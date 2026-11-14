import { h, button, icon, toast, confirmSheet } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import { pageHeader } from '../components/layout.js';
import { outboxSize, serverStatus, sync } from '../api.js';
import { canInstall, promptInstall, isStandalone, isIos, onInstallChange } from '../pwa.js';

function toggle(label, checked, onChange, hint = '') {
  const input = h('input', { type: 'checkbox', class: 'switch-input', role: 'switch' });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return h('label', { class: 'setting' }, h('span', { class: 'setting-text' }, h('b', {}, label), hint ? h('small', { class: 'muted' }, hint) : null), input, h('span', { class: 'switch', 'aria-hidden': 'true' }));
}

function row(iconName, title, sub, href) {
  return h('a', { href, class: 'list-row' }, h('span', { class: 'list-icon' }, icon(iconName)),
    h('span', { class: 'list-text' }, h('b', {}, title), h('small', { class: 'muted' }, sub)), icon('chevron'));
}

export function render(root) {
  const profile = store.getProfile();
  const settings = store.getSettings();
  const tests = store.get('tests', {});
  const surveysDone = store.get('surveysDone', {});

  const saveSetting = (patch) => {
    store.setSettings({ ...store.getSettings(), ...patch });
    window.dispatchEvent(new Event('settingschange'));
  };

  const installBox = h('div', {});
  function drawInstall() {
    installBox.replaceChildren();
    if (isStandalone()) installBox.append(h('p', { class: 'muted small' }, '✓ Aplikasi sudah terpasang.'));
    else if (canInstall()) installBox.append(button('Pasang aplikasi', { iconName: 'download', onClick: promptInstall }));
    else if (isIos()) installBox.append(h('p', { class: 'muted small' }, 'Di iPhone: tekan Bagikan, lalu "Tambah ke Layar Utama".'));
    else installBox.append(h('p', { class: 'muted small' }, 'Di Chrome Android: buka menu ⋮, lalu "Instal aplikasi" atau "Tambahkan ke layar utama".'));
  }
  drawInstall();
  const off = onInstallChange(drawInstall);

  const syncText = h('small', { class: 'muted' });
  const drawSync = () => {
    const n = outboxSize();
    const st = serverStatus();
    syncText.textContent = n === 0 ? 'Semua data sudah terkirim.' : `${n} data menunggu dikirim${st === false ? ' (server tidak terhubung)' : ''}.`;
  };
  drawSync();

  root.append(
    pageHeader('Profil'),
    h('section', { class: 'card profile-card' },
      h('span', { class: 'avatar' }, icon('user', { size: 28 })),
      h('div', {}, h('b', {}, profile.guest ? 'Tamu' : `Kelas ${profile.classCode}`), h('p', { class: 'muted small' }, profile.guest ? 'Progres hanya tersimpan di HP ini.' : `No. absen ${profile.studentNo} · ID ${profile.anonId.slice(0, 6)}…`))),

    h('h2', { class: 'section-title' }, 'Pengaturan'),
    h('section', { class: 'card' },
      toggle('Huruf besar', settings.fontScale === 'large', (on) => saveSetting({ fontScale: on ? 'large' : 'normal' }), 'Teks lebih mudah dibaca'),
      toggle('Suara benar/salah', settings.sound, (on) => saveSetting({ sound: on }), 'Bunyi pendek saat memeriksa jawaban')),

    h('h2', { class: 'section-title' }, 'Pasang di HP'),
    h('section', { class: 'card' }, installBox),

    h('h2', { class: 'section-title' }, 'Tes dan angket'),
    h('section', { class: 'card list' },
      row('clipboard', 'Tes Awal', tests.pre ? `Selesai · skor ${tests.pre.score}/${tests.pre.total}` : '10 soal, sebelum belajar', '#/test/pre'),
      row('clipboard', 'Tes Akhir', tests.post ? `Selesai · skor ${tests.post.score}/${tests.post.total}` : '10 soal, setelah semua modul', '#/test/post'),
      row('check', 'Angket Beban Kognitif', surveysDone.cl_questionnaire ? 'Sudah diisi · terima kasih' : '10 pernyataan, ± 3 menit', '#/survey/cl_questionnaire'),
      row('check', 'Angket Kepraktisan', surveysDone.practicality ? 'Sudah diisi · terima kasih' : '7 pernyataan, ± 2 menit', '#/survey/practicality')),

    h('section', { class: 'card sync-card' },
      h('div', {}, h('b', {}, 'Sinkronisasi data'), h('br'), syncText),
      button('Kirim', { kind: 'secondary', cls: 'btn-sm', iconName: 'sync', onClick: async () => { await sync(); drawSync(); toast(outboxSize() ? 'Belum terkirim. Coba saat online.' : 'Terkirim ✓'); } })),

    h('section', { class: 'danger-zone' },
      button('Reset progres belajar', { kind: 'ghost', onClick: async () => {
        if (!(await confirmSheet('Hapus semua progres, bintang, dan folder Ulas Lagi di HP ini?', { okLabel: 'Ya, reset' }))) return;
        ['progress', 'stats', 'review', 'tests', 'surveysDone', 'pretestDismissed'].forEach((k) => store.set(k, undefined));
        toast('Progres direset');
        go('/');
      } }),
      button('Ganti kode kelas', { kind: 'ghost', onClick: async () => {
        if (!(await confirmSheet('Keluar dan masuk dengan kode lain? Progres di HP ini akan dihapus.', { okLabel: 'Ya, ganti kode' }))) return;
        const outbox = store.get('outbox', []);
        store.clearAll();
        store.set('outbox', outbox); // data yang belum terkirim tetap dikirim
        go('/welcome');
      } })),
    h('p', { class: 'muted small center' }, `Metika v${window.__APP_VERSION__} · Materi Barisan Aritmetika kelas VIII`));
  return off;
}

import { h, html, icon, progressRing, button, iconButton } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { canInstall, promptInstall, onInstallChange, isStandalone } from '../pwa.js';
import { unlockedLevel } from './bank.js';
import { profileLabel, greeting } from '../engine/anon.js';

export async function render(root) {
  const man = await content.manifest();
  const progress = store.allProgress();
  const stats = store.getStats();
  const profile = store.getProfile();
  const done = man.modules.filter((m) => progress[m.id]?.done).length;
  const starCount = man.modules.reduce((s, m) => s + (progress[m.id]?.stars || 0), 0);
  const next = man.modules.find((m) => !progress[m.id]?.done);
  const started = next && progress[next.id]?.step > 0;

  const header = h('header', { class: 'home-head' },
    h('div', {}, h('p', { class: 'muted' }, profile.guest ? 'Mode tamu' : profileLabel(profile)), h('h1', {}, profile.guest ? 'Halo!' : greeting(profile))),
    iconButton('user', 'Profil', () => go('/profile')));

  const hero = h('section', { class: 'card hero' },
    progressRing(done, man.modules.length, { label: 'Modul', caption: 'selesai' }),
    h('div', { class: 'hero-stats' },
      h('div', { class: 'stat' }, h('span', { class: 'stat-icon stat-star' }, icon('star', { filled: true })), h('span', { class: 'stat-num' }, starCount), h('span', { class: 'stat-label' }, 'Bintang')),
      h('div', { class: 'stat-sep' }),
      h('div', { class: 'stat' }, h('span', { class: 'stat-icon stat-check' }, icon('check')), h('span', { class: 'stat-num' }, stats.correct), h('span', { class: 'stat-label' }, 'Soal benar'))));

  const cont = next
    ? h('a', { href: `#/m/${next.id}`, class: 'card continue-card' },
      h('div', {}, h('p', { class: 'eyebrow' }, started ? 'Lanjutkan belajar' : 'Mulai belajar'), h('h2', {}, `Modul ${next.order} · ${next.title}`), h('p', { class: 'muted' }, `${next.subtitle} · ± ${next.minutes} menit`)),
      h('span', { class: 'play' }, icon('chevron')))
    : h('a', { href: '#/challenge', class: 'card continue-card' },
      h('div', {}, h('p', { class: 'eyebrow' }, 'Semua modul selesai! 🎉'), h('h2', {}, 'Coba Tantangan B/S'), h('p', { class: 'muted' }, 'Uji pemahamanmu dengan cepat.')),
      h('span', { class: 'play' }, icon('chevron')));

  const tests = store.get('tests', {});
  const pretestBanner = !profile.guest && !tests.pre && !store.get('pretestDismissed', false)
    ? h('div', { class: 'card banner' },
      h('div', {}, h('b', {}, 'Tes Awal'), h('p', { class: 'muted small' }, '10 soal singkat sebelum belajar.')),
      h('div', { class: 'banner-actions' },
        button('Mulai', { kind: 'secondary', cls: 'btn-sm', onClick: () => go('/test/pre') }),
        iconButton('x', 'Nanti saja', () => { store.set('pretestDismissed', true); pretestBanner.remove(); })))
    : null;

  const installBox = h('div', {});
  function renderInstall() {
    installBox.replaceChildren();
    if (isStandalone() || !canInstall()) return;
    installBox.append(h('div', { class: 'card banner banner-install' },
      h('span', { class: 'banner-icon' }, icon('download')),
      h('div', {}, h('b', {}, 'Pasang aplikasi'), h('p', { class: 'muted small' }, 'Buka dari layar utama, bisa offline.')),
      button('Pasang', { kind: 'primary', cls: 'btn-sm', onClick: promptInstall })));
  }
  renderInstall();
  const off = onInstallChange(renderInstall);

  const review = store.getReview();
  const saved = Object.keys(review.flagged || {}).length;
  const lastKuis = store.getQuizHistory().filter((q) => q.kind === 'timed').at(-1);
  const hist = store.getHistory();
  const acc = hist.length ? `${Math.round((hist.filter((x) => x.firstTry).length / hist.length) * 100)}%` : '–';
  const tile = (href, title, count, sub) => h('a', { href, class: 'tile' },
    h('span', { class: 'tile-star' }, icon('sparkle', { filled: true, size: 22 })),
    h('span', { class: 'tile-title' }, title),
    h('span', { class: 'tile-count' }, count),
    h('span', { class: 'tile-sub' }, sub));
  const tiles = h('div', { class: 'tiles' },
    tile('#/kuis', 'Kuis Cepat', lastKuis ? `${lastKuis.score}/${lastKuis.total}` : '10', lastKuis ? 'skor terakhir' : 'soal · 6 menit'),
    tile('#/bank', 'Bank Soal', `Lv ${unlockedLevel()}`, '4 level bertingkat'),
    tile('#/saved', 'Soal Tersimpan', String(saved), saved ? 'bisa diulang' : 'kosong'),
    tile('#/riwayat', 'Riwayat & Evaluasi', acc, hist.length ? 'benar langsung' : 'belum ada'));

  root.append(...[header, hero, pretestBanner, cont, installBox].filter(Boolean),
    h('h2', { class: 'section-title' }, 'Ayo berlatih'), tiles);
  return off;
}

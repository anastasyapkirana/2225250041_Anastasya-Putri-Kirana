// Riwayat & evaluasi belajar: ringkasan, akurasi per topik, kesalahan tersering, hasil kuis.
import { h, html, button, icon, stars } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { pageHeader } from '../components/layout.js';
import { reviewItems } from '../components/question.js';
import { LEVELS } from './bank.js';

const TOPICS = {
  pola: { label: 'Suku berikutnya', level: 1 },
  beda: { label: 'Beda (b)', level: 1 },
  abn: { label: 'Menentukan a, b, n', level: 2 },
  un: { label: 'Suku ke-n (Uₙ)', level: 3 },
  cari: { label: 'Mencari n, a, b', level: 3 },
};
const KIND = { timed: 'Kuis Cepat', bank: 'Bank Soal', module: 'Kuis modul', challenge: 'Tantangan ✕/✓', daily: 'Tantangan Hari Ini', game: 'Permainan' };

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export async function render(root) {
  const [man, misc, mistakes] = await Promise.all([content.manifest(), content.misconceptions(), reviewItems('mistakes')]);
  const hist = store.getHistory();
  const quizzes = store.getQuizHistory();
  const progress = store.allProgress();
  const tests = store.get('tests', {});
  const daily = store.get('daily', {});

  root.append(pageHeader('Riwayat & Evaluasi', 'Lihat kemajuan dan bagian yang perlu dilatih.'));

  if (!hist.length && !quizzes.length) {
    root.append(h('div', { class: 'card empty' }, icon('chart', { size: 36 }),
      h('h2', {}, 'Belum ada riwayat'),
      h('p', { class: 'muted' }, 'Kerjakan latihan atau kuis dulu. Hasilnya akan muncul di sini.'),
      button('Mulai Tantangan Hari Ini', { onClick: () => go('/harian') })));
    return;
  }

  // ---- ringkasan
  const first = hist.filter((x) => x.firstTry).length;
  const hints = hist.reduce((s, x) => s + (x.hintLevel || 0), 0);
  root.append(h('section', { class: 'card summary-grid' },
    stat(hist.length, 'soal dikerjakan'),
    stat(`${pct(first, hist.length)}%`, 'benar langsung'),
    stat(hints, 'petunjuk dipakai'),
    stat(daily.streak || 0, 'hari beruntun')));

  // ---- per topik
  const byTopic = {};
  hist.forEach((x) => {
    if (!TOPICS[x.topic]) return;
    byTopic[x.topic] = byTopic[x.topic] || { n: 0, ok: 0 };
    byTopic[x.topic].n++;
    if (x.firstTry) byTopic[x.topic].ok++;
  });
  const rows = Object.entries(TOPICS).filter(([k]) => byTopic[k]);
  if (rows.length) {
    const weakest = rows.map(([k, t]) => ({ k, t, p: pct(byTopic[k].ok, byTopic[k].n) })).sort((a, b) => a.p - b.p)[0];
    root.append(h('section', { class: 'card' },
      h('h2', {}, 'Ketepatan per topik'),
      h('p', { class: 'muted small' }, 'Persentase soal yang benar pada percobaan pertama.'),
      h('div', { class: 'bars' }, rows.map(([k, t]) => {
        const p = pct(byTopic[k].ok, byTopic[k].n);
        const fill = h('span', { class: `bar-fill ${p < 60 ? 'is-low' : ''}` });
        fill.style.width = `${Math.max(p, 3)}%`;
        return h('div', { class: 'bar-row' },
          h('span', { class: 'bar-label' }, t.label),
          h('span', { class: 'bar' }, fill),
          h('b', { class: 'bar-val' }, `${p}%`),
          h('span', { class: 'bar-n muted' }, `${byTopic[k].n} soal`));
      })),
      weakest.p < 80 ? h('div', { class: 'advice' },
        html('p', '', `Saran: latih lagi <b>${weakest.t.label}</b> (${weakest.p}%).`),
        button(`Latihan Level ${weakest.t.level} · ${LEVELS[weakest.t.level - 1].name}`, { kind: 'secondary', cls: 'btn-sm', onClick: () => go(`/bank/${weakest.t.level}`) }))
        : h('p', { class: 'advice' }, 'Hebat! Semua topik sudah di atas 80%.')));
  }

  // ---- kesalahan tersering
  const misCount = {};
  hist.forEach((x) => { if (x.misconception) misCount[x.misconception] = (misCount[x.misconception] || 0) + 1; });
  const topMis = Object.entries(misCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
  root.append(h('section', { class: 'card' },
    h('h2', {}, 'Kesalahan yang sering terjadi'),
    topMis.length
      ? h('ul', { class: 'mis-list' }, topMis.map(([id, n]) => h('li', {}, h('span', { class: 'mis-count' }, `${n}×`), html('span', '', misc[id]?.msg || id))))
      : h('p', { class: 'muted' }, 'Belum ada pola kesalahan yang terdeteksi. Bagus!'),
    mistakes.length
      ? button(`Perbaiki soal yang salah (${mistakes.length})`, { iconName: 'refresh', onClick: () => go('/review/mistakes') })
      : null));

  // ---- kuis modul & level
  const bank = store.getBank();
  root.append(h('section', { class: 'card' },
    h('h2', {}, 'Kuis modul'),
    h('ul', { class: 'mini-list' }, man.modules.map((m) => {
      const p = progress[m.id];
      return h('li', {}, h('span', {}, `Modul ${m.order}`), stars(p?.stars || 0),
        h('b', {}, p?.quizScore != null ? `${Math.round(p.quizScore * 100)}%` : '–'));
    })),
    h('h2', { class: 'mt' }, 'Bank Soal'),
    h('ul', { class: 'mini-list' }, LEVELS.map((lv) => h('li', {}, h('span', {}, `Level ${lv.id} · ${lv.name}`), h('span', {}),
      h('b', {}, bank[lv.id] ? `${bank[lv.id].best}/${bank[lv.id].total}` : '–'))))));

  if (tests.pre || tests.post) {
    root.append(h('section', { class: 'card' }, h('h2', {}, 'Tes awal & akhir'),
      h('ul', { class: 'mini-list' },
        h('li', {}, h('span', {}, 'Tes Awal'), h('span', {}), h('b', {}, tests.pre ? `${tests.pre.score}/${tests.pre.total}` : '–')),
        h('li', {}, h('span', {}, 'Tes Akhir'), h('span', {}), h('b', {}, tests.post ? `${tests.post.score}/${tests.post.total}` : '–')))));
  }

  // ---- aktivitas terbaru
  if (quizzes.length) {
    root.append(h('section', { class: 'card' }, h('h2', {}, 'Aktivitas terbaru'),
      h('ul', { class: 'mini-list' }, quizzes.slice(-10).reverse().map((q) => h('li', {},
        h('span', {}, KIND[q.kind] || q.kind),
        h('span', { class: 'muted small' }, new Date(q.ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
        h('b', {}, q.total ? `${q.score}/${q.total}` : `${q.score} poin`))))));
  }
}

function stat(value, label) {
  return h('div', { class: 'sum-stat' }, h('b', {}, String(value)), h('span', { class: 'muted small' }, label));
}

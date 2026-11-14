// Tes awal / akhir untuk penelitian (tanpa umpan balik per soal).
import { h, button } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { logEvent, sync } from '../api.js';
import { focusHeader } from '../components/layout.js';
import { runQuiz } from '../components/quiz.js';

export async function render(root, { form }) {
  const all = await content.tests();
  const test = all[form];
  if (!test) { go('/profile'); return; }
  const prev = store.get('tests', {})[form];
  const area = h('div', {});
  root.append(focusHeader({ title: test.title, back: '/profile', formula: false }), area);

  function start() {
    const startedAt = Date.now();
    runQuiz(area, test.items, {
      mode: 'test', title: test.title,
      onFinish: (r) => {
        store.update('tests', {}, (t) => ({ ...t, [form]: { score: r.score, total: r.total, at: new Date().toISOString() } }));
        logEvent('test_done', {
          item_id: form,
          payload: {
            score: r.score, total: r.total, seconds: Math.round((Date.now() - startedAt) / 1000),
            answers: r.answers.map((a) => ({ i: a.index, ok: a.correct ? 1 : 0, ind: a.indicator })),
          },
        });
        sync();
        area.append(h('div', { class: 'finish-actions' }, button('Selesai', { onClick: () => go('/') })));
      },
    });
  }

  area.append(h('div', { class: 'card step-card' },
    h('h2', {}, test.title),
    h('p', {}, `${test.items.length} soal. Kerjakan sendiri tanpa melihat catatan.`),
    h('p', { class: 'muted' }, 'Petunjuk dan Kartu Rumus tidak tersedia selama tes.'),
    prev ? h('p', { class: 'muted small' }, `Kamu sudah pernah mengerjakan (skor ${prev.score}/${prev.total}). Jika mengulang, skor terbaru yang disimpan.`) : null,
    button('Mulai tes', { onClick: start })));
}

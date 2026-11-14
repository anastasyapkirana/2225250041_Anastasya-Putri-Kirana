// Tantangan Hari Ini: 5 soal yang sama untuk semua siswa di hari yang sama (seed = tanggal).
import { h, button, icon } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { focusHeader } from '../components/layout.js';
import { practiceSession } from '../components/question.js';
import { generate } from '../engine/generator.js';
import { logEvent } from '../api.js';

const PLAN = ['T-beda', 'T-identify', 'T-un-easy', 'T-un', 'T-find-n'];

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function dailyStatus() {
  const d = store.get('daily', {});
  return { doneToday: d.last === todayKey(), streak: d.streak || 0, score: d.last === todayKey() ? d.score : null };
}

function seedFor(key, i) {
  return Number(key.replace(/-/g, '')) * 10 + i;
}

export async function render(root) {
  const tpls = await content.templates();
  const key = todayKey();
  const status = dailyStatus();
  const box = h('div', {});
  root.append(focusHeader({ title: 'Tantangan Hari Ini', back: '/practice' }), box);

  if (status.doneToday) {
    box.append(h('div', { class: 'card summary-card' },
      h('span', { class: 'trophy' }, icon('trophy', { size: 40 })),
      h('h2', {}, 'Tantangan hari ini selesai!'),
      h('p', {}, `Skor: ${status.score}/5 · ${status.streak} hari beruntun 🔥`),
      h('p', { class: 'muted' }, 'Kembali besok untuk 5 soal baru.')),
    h('div', { class: 'finish-actions' }, button('Latihan lain', { onClick: () => go('/practice') })));
    return;
  }

  const items = PLAN.map((tid, i) => generate(tid, tpls[tid], seedFor(key, i)));
  box.append(h('p', { class: 'muted' }, `5 soal untuk ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}.`));
  const area = h('div', {});
  box.append(area);
  practiceSession(area, {
    items, source: 'daily',
    onComplete: (sum) => {
      const prev = store.get('daily', {});
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      const streak = prev.last === yKey ? (prev.streak || 0) + 1 : 1;
      store.set('daily', { last: key, score: sum.correct, streak, best: Math.max(prev.best || 0, streak) });
      store.pushQuizHistory({ kind: 'daily', id: key, score: sum.correct, total: sum.total });
      logEvent('practice_done', { item_id: `daily-${key}`, payload: sum });
      area.append(h('div', { class: 'finish-actions' },
        h('p', { class: 'center' }, `🔥 ${streak} hari beruntun`),
        button('Kembali ke Latihan', { onClick: () => go('/practice') })));
    },
  });
}

// Bank soal bertingkat: Level 1 (mudah) sampai Level 4 (tantangan).
// Level berikutnya terbuka setelah level sebelumnya benar >= 3 dari 5.
import { h, button, icon, stars } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import { pageHeader, focusHeader } from '../components/layout.js';
import { practiceSession } from '../components/question.js';
import { logEvent } from '../api.js';

export const LEVELS = [
  { id: 1, name: 'Mudah', desc: 'Suku berikutnya dan beda', templates: ['T-next', 'T-beda', 'T-is-arith'] },
  { id: 2, name: 'Sedang', desc: 'Menentukan a, b, n dan Uₙ dasar', templates: ['T-identify', 'T-un-easy'] },
  { id: 3, name: 'Sulit', desc: 'Uₙ dengan beda negatif, mencari n dan b', templates: ['T-un', 'T-find-n', 'T-find-b'] },
  { id: 4, name: 'Tantangan', desc: 'Dua suku diketahui, campuran', templates: ['T-two-terms', 'T-find-n', 'T-un', 'T-find-b'] },
];
const COUNT = 5;
const PASS = 3;

export function unlockedLevel(bank = store.getBank()) {
  let top = 1;
  for (const lv of LEVELS.slice(0, -1)) {
    if ((bank[lv.id]?.best || 0) >= PASS) top = lv.id + 1; else break;
  }
  return top;
}

const starsFor = (best) => (best >= 5 ? 3 : best >= 4 ? 2 : best >= PASS ? 1 : 0);

export function render(root, { level } = {}) {
  if (level) return playLevel(root, Number(level));
  const bank = store.getBank();
  const top = unlockedLevel(bank);
  const list = h('ol', { class: 'level-list' }, LEVELS.map((lv) => {
    const res = bank[lv.id];
    const locked = lv.id > top;
    const inner = [
      h('span', { class: `level-num level-${lv.id}` }, locked ? icon('lock', { size: 20 }) : `Lv ${lv.id}`),
      h('div', { class: 'module-info' },
        h('h2', {}, `Level ${lv.id} · ${lv.name}`),
        h('p', { class: 'muted' }, lv.desc),
        h('div', { class: 'module-meta' },
          stars(starsFor(res?.best || 0)),
          h('span', { class: 'pill' }, locked ? `Benar ${PASS}/${COUNT} di Level ${lv.id - 1} dulu` : res ? `Terbaik ${res.best}/${res.total}` : `${COUNT} soal`))),
      locked ? null : h('span', { class: 'chev' }, icon('chevron')),
    ];
    return h('li', {}, locked
      ? h('div', { class: 'card module-card is-locked', 'aria-disabled': 'true' }, ...inner)
      : h('a', { href: `#/bank/${lv.id}`, class: `card module-card ${lv.id === top ? 'is-next' : ''}` }, ...inner));
  }));
  root.append(pageHeader('Bank Soal', 'Naik level dari mudah ke sulit. Soalnya selalu baru.'), list);
  return undefined;
}

function playLevel(root, id) {
  const lv = LEVELS.find((x) => x.id === id);
  if (!lv || id > unlockedLevel()) { go('/bank'); return; }
  const box = h('div', {});
  root.append(focusHeader({ title: `Level ${lv.id} · ${lv.name}`, back: '/bank' }), box);
  practiceSession(box, {
    templateIds: lv.templates, count: COUNT, source: 'bank',
    onComplete: (sum) => {
      const before = unlockedLevel();
      store.saveBankResult(lv.id, sum.correct, sum.total);
      store.pushQuizHistory({ kind: 'bank', id: `level-${lv.id}`, score: sum.correct, total: sum.total });
      logEvent('practice_done', { item_id: `bank-${lv.id}`, payload: sum });
      const opened = unlockedLevel() > before;
      const nextLv = LEVELS.find((x) => x.id === lv.id + 1);
      box.append(h('div', { class: 'finish-actions' },
        opened && nextLv ? h('p', { class: 'center' }, `🎉 Level ${nextLv.id} · ${nextLv.name} terbuka!`) : null,
        opened && nextLv ? button(`Lanjut ke Level ${nextLv.id}`, { onClick: () => go(`/bank/${nextLv.id}`) }) : button('Ulangi level ini', { onClick: () => go(`/bank/${lv.id}`) }),
        button('Kembali ke Bank Soal', { kind: 'secondary', onClick: () => go('/bank') })));
    },
  });
  return undefined;
}

// Tantangan kartu ✕/✓ (gaya flashcard referensi). Tanpa timer.
import { h, html, button, icon, feedback, sound } from '../ui.js';
import { go } from '../router.js';
import * as content from '../content.js';
import { logEvent } from '../api.js';
import * as store from '../store.js';
import { focusHeader } from '../components/layout.js';

export async function render(root) {
  const deck = await content.challenge();
  const stage = h('div', { class: 'challenge' });
  root.append(focusHeader({ title: 'Benar atau Salah? ✕/✓', back: '/practice' }), stage);

  function play() {
    const cards = [...deck.cards].sort(() => Math.random() - 0.5).slice(0, deck.roundSize);
    const results = [];
    let i = 0;

    function show() {
      const c = cards[i];
      const fill = h('span', { class: 'bar-fill' });
      fill.style.width = `${(i / cards.length) * 100}%`;
      const bar = h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': String(i), 'aria-valuemax': String(cards.length) }, fill);
      const fb = h('div', { class: 'q-feedback' });
      const next = button(i === cards.length - 1 ? 'Lihat hasil' : 'Kartu berikutnya', { cls: 'hidden', onClick: () => { i++; if (i < cards.length) show(); else finish(); } });
      const pick = (val) => {
        const ok = val === c.answer;
        results.push(ok);
        sound(ok ? 'correct' : 'wrong');
        btnNo.disabled = true; btnYes.disabled = true;
        (val ? btnYes : btnNo).classList.add(ok ? 'is-correct' : 'is-wrong');
        card.classList.add(ok ? 'is-correct' : 'is-wrong');
        fb.replaceChildren(feedback(ok ? 'correct' : 'wrong', ok ? 'Tepat!' : `Jawabannya: ${c.answer ? 'Benar' : 'Salah'}`, c.explanation));
        next.classList.remove('hidden');
        next.focus();
      };
      const btnNo = h('button', { type: 'button', class: 'round-btn round-no', 'aria-label': 'Salah', onClick: () => pick(false) }, icon('x', { size: 32 }));
      const btnYes = h('button', { type: 'button', class: 'round-btn round-yes', 'aria-label': 'Benar', onClick: () => pick(true) }, icon('check', { size: 32 }));
      const card = h('article', { class: 'card flash-card' },
        h('p', { class: 'eyebrow' }, `Kartu ${i + 1} dari ${cards.length}`),
        html('p', 'flash-text', c.text),
        h('p', { class: 'muted small' }, 'Benar atau salah?'));
      stage.replaceChildren(bar, card, h('div', { class: 'round-row' }, h('div', { class: 'round-wrap' }, btnNo, h('span', {}, 'Salah')), h('div', { class: 'round-wrap' }, btnYes, h('span', {}, 'Benar'))), fb, next);
    }

    function finish() {
      const score = results.filter(Boolean).length;
      store.pushQuizHistory({ kind: 'challenge', id: 'benar-salah', score, total: cards.length });
      logEvent('challenge_done', { payload: { score, total: cards.length, cards: cards.map((c) => c.id) } });
      stage.replaceChildren(h('div', { class: 'card summary-card' },
        html('div', 'summary-big', `${score}<small>/${cards.length}</small>`),
        h('p', {}, score >= 8 ? 'Mantap! Pemahamanmu kuat.' : 'Bagus! Main lagi untuk menguatkan ingatan.')),
      h('div', { class: 'finish-actions' }, button('Main lagi', { onClick: play }), button('Ke Beranda', { kind: 'secondary', onClick: () => go('/') })));
    }
    show();
  }
  play();
}

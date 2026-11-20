// Kuis dengan timer: 10 soal acak dari mudah ke sulit, waktu 6 menit (timer bisa dimatikan).
import { h, button, icon, toast } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { logEvent, sync } from '../api.js';
import { focusHeader } from '../components/layout.js';
import { runQuiz } from '../components/quiz.js';
import { bookmarkButton } from '../components/question.js';
import { generate } from '../engine/generator.js';

const PLAN = ['T-beda', 'T-is-arith', 'T-beda', 'T-un-easy', 'T-un-easy', 'T-find-b', 'T-un', 'T-un', 'T-find-n', 'T-find-b'];
const SECONDS = 6 * 60;

function toItem(q) {
  const f = q.fields[0];
  return {
    type: f.type === 'choice' ? 'mcq' : 'numeric',
    prompt: q.prompt,
    options: f.options || undefined,
    answer: f.answer,
    explanation: `<ol class="solution">${q.solution.map((s) => `<li>${s}</li>`).join('')}</ol>`,
    q,
  };
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export async function render(root) {
  const tpls = await content.templates();
  const area = h('div', { class: 'kuis' });
  root.append(focusHeader({ title: 'Kuis Cepat', back: '/practice', formula: false }), area);
  let timerId = null;

  function intro() {
    let useTimer = store.get('kuisTimer', true);
    const history = store.getQuizHistory().filter((x) => x.kind === 'timed').slice(-3).reverse();
    const toggle = h('input', { type: 'checkbox', class: 'switch-input', role: 'switch', id: 'kuis-timer' });
    toggle.checked = useTimer;
    toggle.addEventListener('change', () => { useTimer = toggle.checked; store.set('kuisTimer', useTimer); });
    area.replaceChildren(...[
      h('section', { class: 'card kuis-intro' },
        h('span', { class: 'kuis-badge' }, icon('clock', { size: 30 })),
        h('h2', {}, 'Kuis Waktu'),
        h('p', {}, `10 soal, dari mudah ke sulit. Waktu ${SECONDS / 60} menit.`),
        h('label', { class: 'setting', for: 'kuis-timer' },
          h('span', { class: 'setting-text' }, h('b', {}, 'Pakai timer'), h('small', { class: 'muted' }, 'Matikan jika ingin santai')),
          toggle, h('span', { class: 'switch', 'aria-hidden': 'true' })),
        button('Mulai kuis', { onClick: () => start(useTimer) })),
      history.length ? h('section', { class: 'card' }, h('h2', {}, 'Hasil terakhir'),
        h('ul', { class: 'mini-list' }, history.map((r) => h('li', {},
          h('span', {}, new Date(r.ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
          h('b', {}, `${r.score}/${r.total}`),
          h('span', { class: 'muted' }, r.seconds != null ? mmss(r.seconds) : '–'))))) : null,
      h('a', { href: '#/challenge', class: 'card list-row-card' },
        h('span', { class: 'list-icon' }, icon('cards')),
        h('span', { class: 'list-text' }, h('b', {}, 'Tantangan B/S'), h('small', { class: 'muted' }, 'Mode santai tanpa timer: benar atau salah?')),
        icon('chevron'))].filter(Boolean));
  }

  function start(useTimer) {
    const qs = PLAN.map((tid) => generate(tid, tpls[tid]));
    const items = qs.map(toItem);
    const startedAt = Date.now();
    const timerText = h('span', { class: 'timer-text' }, mmss(SECONDS));
    const fill = h('span', { class: 'timer-fill' });
    const timer = useTimer ? h('div', { class: 'timer', role: 'timer', 'aria-label': 'Sisa waktu' }, icon('clock', { size: 20 }), timerText, h('span', { class: 'timer-bar' }, fill)) : null;
    const box = h('div', {});
    area.replaceChildren(...[timer, box].filter(Boolean));

    const ctrl = runQuiz(box, items, {
      mode: 'quiz', title: 'Kuis',
      headExtra: (item) => bookmarkButton(item.q),
      onFinish: (r) => {
        clearInterval(timerId);
        const seconds = Math.round((Date.now() - startedAt) / 1000);
        r.answers.forEach((a, i) => store.pushHistory({
          source: 'kuis', tid: qs[i].tid, topic: qs[i].topic, firstTry: a.correct, solved: a.correct, attempts: a.skipped ? 0 : 1, hintLevel: 0, misconception: null,
        }));
        store.pushQuizHistory({ kind: 'timed', id: 'kuis', score: r.score, total: r.total, seconds: useTimer ? Math.min(seconds, SECONDS) : null });
        logEvent('quiz_done', { item_id: 'kuis-waktu', payload: { score: r.score, total: r.total, seconds, timer: useTimer } });
        sync();
        if (timer) timer.classList.add('is-done');
        box.append(h('div', { class: 'finish-actions' },
          button('Kuis lagi', { onClick: intro }),
          button('Lihat riwayat & evaluasi', { kind: 'secondary', onClick: () => go('/riwayat') })));
      },
    });

    if (useTimer) {
      let left = SECONDS;
      timerId = setInterval(() => {
        left--;
        timerText.textContent = mmss(Math.max(left, 0));
        fill.style.width = `${(Math.max(left, 0) / SECONDS) * 100}%`;
        timer.classList.toggle('is-low', left <= 60);
        if (left <= 0) {
          clearInterval(timerId);
          toast('Waktu habis! ⏰');
          ctrl.stop();
        }
      }, 1000);
    }
  }

  intro();
  return () => clearInterval(timerId);
}

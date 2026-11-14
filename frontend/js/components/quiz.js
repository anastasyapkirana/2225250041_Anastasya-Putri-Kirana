// Kuis modul (umpan balik langsung) dan tes awal/akhir (tanpa umpan balik).
import { h, html, button, numberInput, choiceList, markChoice, feedback, sound } from '../ui.js';
import { parseNumber, sameNumber, fmt } from '../engine/format.js';

let uid = 0;

/**
 * @param items  [{type:'numeric'|'mcq', prompt, answer, options?, explanation?}]
 * @param opts   { mode: 'quiz'|'test', onFinish({score,total,answers}), title, headExtra?(item) }
 * @returns { stop() } — hentikan kuis (mis. waktu habis); soal yang belum dijawab dihitung salah.
 */
export function runQuiz(container, items, opts) {
  const mode = opts.mode || 'quiz';
  const answers = [];
  let ended = false;
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, items.map(() => h('span', { class: 'dot' })));
  const stage = h('div', { class: 'q-stage' });
  container.replaceChildren(dots, stage);

  function show(i) {
    [...dots.children].forEach((d, j) => {
      const state = j < i ? (mode === 'quiz' ? (answers[j].correct ? 'is-correct' : 'is-wrong') : 'is-done') : '';
      d.className = `dot ${state} ${j === i ? 'is-current' : ''}`;
    });
    const item = items[i];
    const card = h('article', { class: 'card q-card' });
    const fb = h('div', { class: 'q-feedback' });
    let value = null;
    let input = null;
    let buttons = null;
    let checked = false;
    const fieldBox = h('div', { class: 'q-fields' });
    if (item.type === 'mcq') {
      const cl = choiceList(item.options, {
        onPick: (idx) => {
          if (checked) return;
          value = idx;
          cl.buttons.forEach((b, j) => { b.classList.toggle('is-picked', j === idx); b.setAttribute('aria-checked', String(j === idx)); });
        },
      });
      buttons = cl.buttons;
      fieldBox.append(cl.list);
    } else {
      const ni = numberInput({ label: 'Jawaban', id: `quiz${++uid}`, onEnter: () => primary.click() });
      input = ni.input;
      fieldBox.append(ni.wrap);
    }
    const last = i === items.length - 1;
    const primary = button(mode === 'test' ? (last ? 'Selesai' : 'Berikutnya') : 'Periksa', {
      onClick: () => {
        if (ended) return;
        if (checked) { next(); return; }
        if (item.type === 'numeric') value = parseNumber(input.value);
        if (value == null) { fb.replaceChildren(feedback('hint', item.type === 'mcq' ? 'Pilih salah satu jawaban dulu.' : 'Tulis jawaban berupa angka.')); return; }
        const correct = item.type === 'mcq' ? value === item.answer : sameNumber(value, item.answer);
        answers.push({ index: i, value, correct, indicator: item.indicator || null });
        checked = true;
        if (mode === 'test') { next(); return; }
        sound(correct ? 'correct' : 'wrong');
        if (input) { input.readOnly = true; input.classList.add(correct ? 'is-correct' : 'is-wrong'); }
        if (buttons) {
          buttons.forEach((b) => { b.disabled = true; });
          markChoice(buttons, value, correct ? 'correct' : 'wrong');
          if (!correct) buttons[item.answer].classList.add('is-correct');
        }
        const ans = item.type === 'mcq' ? item.options[item.answer] : fmt(item.answer);
        fb.replaceChildren(feedback(correct ? 'correct' : 'wrong', correct ? 'Tepat!' : `Jawaban yang benar: ${ans.replace(/<[^>]+>/g, '')}`, item.explanation || ''));
        primary.querySelector('span').textContent = last ? 'Lihat hasil' : 'Soal berikutnya';
        primary.focus();
      },
    });
    card.append(
      h('div', { class: 'q-head' }, h('span', { class: 'q-count' }, `${opts.title || 'Kuis'} · ${i + 1} dari ${items.length}`), opts.headExtra ? opts.headExtra(item) : null),
      html('div', 'q-prompt', item.prompt), fieldBox, fb, h('div', { class: 'q-actions' }, primary));
    stage.replaceChildren(card);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    function next() { if (last) finish(); else show(i + 1); }
  }

  function finish() {
    if (ended) return;
    ended = true;
    const score = answers.filter((a) => a.correct).length;
    [...dots.children].forEach((d, j) => { d.className = `dot ${answers[j].correct ? 'is-correct' : 'is-wrong'}`; });
    const list = mode === 'quiz'
      ? h('ol', { class: 'quiz-recap' }, items.map((it, j) => h('li', { class: answers[j].correct ? 'ok' : 'no', html: `${answers[j].correct ? '✓' : '✕'} ${it.prompt}` })))
      : null;
    stage.replaceChildren(h('div', { class: 'card summary-card' },
      html('div', 'summary-big', `${score}<small>/${items.length}</small>`),
      h('p', {}, mode === 'test' ? 'Terima kasih sudah mengerjakan!' : score >= Math.ceil(items.length * 0.8) ? 'Hebat! Kamu menguasai modul ini.' : 'Bagus! Ulas lagi bagian yang salah, ya.'),
      list));
    opts.onFinish && opts.onFinish({ score, total: items.length, answers });
  }

  show(0);
  return {
    stop() {
      if (ended) return;
      for (let j = answers.length; j < items.length; j++) answers.push({ index: j, value: null, correct: false, indicator: items[j].indicator || null, skipped: true });
      finish();
    },
  };
}

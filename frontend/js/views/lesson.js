// Penampil modul: satu langkah per layar (materi → contoh → latihan → literasi → kuis).
import { h, html, button, icon, segmentBar, choiceList, markChoice, feedback, sound, stars, contextBadge } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { logEvent, queueSurvey, sync } from '../api.js';
import { renderVisual } from '../components/viz.js';
import { practiceSession } from '../components/question.js';
import { runQuiz } from '../components/quiz.js';
import { storyWorkspace } from '../components/story.js';
import { focusHeader } from '../components/layout.js';
import { parseNumber, sameNumber } from '../engine/format.js';

const KIND_LABEL = {
  hook: 'Pemantik', concept: 'Materi', example: 'Contoh bertahap', faded: 'Contoh memudar', explain: 'Bernalar',
  practice: 'Latihan', story: 'Soal cerita', mcq: 'Pojok Literasi', quiz: 'Kuis',
};
const AUTO_DONE = new Set(['hook', 'concept']);

export async function render(root, { id }) {
  const [mod, meta, man] = await Promise.all([content.loadModule(id), content.moduleMeta(id), content.manifest()]);
  const steps = mod.steps;
  let prog = store.getModuleProgress(id);
  let idx = prog.done ? 0 : Math.min(prog.step || 0, steps.length - 1);
  let maxStep = prog.maxStep || 0;
  const practiceResults = [];
  let quizScore = null;

  const headSlot = h('div', { class: 'lesson-progress' });
  const stage = h('main', { class: 'lesson-stage' });
  const backBtn = button('', { kind: 'secondary', iconName: 'back', aria: 'Langkah sebelumnya', cls: 'btn-square', onClick: () => show(idx - 1) });
  const nextBtn = button('Lanjut', { onClick: () => advance() });
  const footer = h('footer', { class: 'lesson-foot' }, backBtn, nextBtn);

  root.classList.add('lesson');
  root.append(focusHeader({ title: `Modul ${meta.order}`, back: '/modules', closeLabel: 'Tutup modul' }), headSlot, stage, footer);

  function setNext(enabled, label = 'Lanjut') {
    nextBtn.disabled = !enabled;
    nextBtn.querySelector('span:last-child').textContent = label;
  }

  function markComplete() {
    maxStep = Math.max(maxStep, idx + 1);
    store.saveModuleProgress(id, { maxStep });
    setNext(true, idx === steps.length - 1 ? 'Selesai' : 'Lanjut');
  }

  function advance() {
    if (idx < steps.length - 1) show(idx + 1);
    else finishModule();
  }

  function show(i) {
    if (i < 0) return;
    idx = i;
    const step = steps[i];
    prog = store.saveModuleProgress(id, { step: i, maxStep: Math.max(maxStep, i) });
    headSlot.replaceChildren(segmentBar(steps.length, i), h('p', { class: 'lesson-kind' }, `${KIND_LABEL[step.kind]} · ${i + 1}/${steps.length}`));
    backBtn.disabled = i === 0;
    footer.classList.remove('hidden');
    const already = i < maxStep || prog.done;
    setNext(already || AUTO_DONE.has(step.kind), i === steps.length - 1 ? 'Selesai' : 'Lanjut');
    if (AUTO_DONE.has(step.kind)) markCompleteQuiet();
    stage.replaceChildren();
    logEvent('step_view', { module_id: id, item_id: `${i}:${step.kind}` });
    RENDERERS[step.kind](stage, step, { markComplete, already });
    window.scrollTo({ top: 0 });
    stage.querySelector('h2')?.focus?.({ preventScroll: true });
  }

  function markCompleteQuiet() {
    maxStep = Math.max(maxStep, idx + 1);
    store.saveModuleProgress(id, { maxStep });
  }

  // ---------------------------------------------------------------- renderers
  const RENDERERS = {
    hook(el, s) {
      const card = h('article', { class: 'card step-card step-hook' },
        h('h2', { tabindex: '-1' }, s.title), renderVisual(s.visual), html('p', 'step-text', s.text));
      if (s.reveal) {
        const reveal = html('div', 'reveal hidden', s.reveal);
        const btn = button('Lihat jawaban', { kind: 'secondary', iconName: 'eye', cls: 'btn-sm', onClick: () => { reveal.classList.remove('hidden'); btn.remove(); } });
        card.append(btn, reveal);
      }
      el.append(card);
    },

    concept(el, s) {
      el.append(h('article', { class: 'card step-card' },
        h('h2', { tabindex: '-1' }, s.title), html('div', 'step-text', s.text), renderVisual(s.visual)));
    },

    example(el, s, { markComplete: done, already }) {
      const list = h('ol', { class: 'worked' });
      let shown = 0;
      const btn = button('', { kind: 'secondary', cls: 'btn-block', iconName: 'chevron', onClick: reveal });
      function reveal() {
        list.append(html('li', 'worked-step', s.steps[shown]));
        shown++;
        if (shown >= s.steps.length) { btn.remove(); done(); } else label();
      }
      function label() { btn.querySelector('span:last-child').textContent = `Langkah berikutnya (${shown + 1}/${s.steps.length})`; }
      label();
      el.append(h('article', { class: 'card step-card' },
        h('p', { class: 'eyebrow' }, 'Contoh bertahap'), h('h2', { tabindex: '-1' }, s.title),
        html('div', 'problem', s.problem), renderVisual(s.visual), list, btn));
      if (already) while (shown < s.steps.length) reveal();
      else reveal();
    },

    faded(el, s, { markComplete: done }) {
      const list = h('ol', { class: 'worked' }, s.steps.map((st) => html('li', 'worked-step',
        st.replace(/\[\[([^\]]+)\]\]/g, (_, ans) => `<input class="blank" data-answer="${ans}" inputmode="decimal" autocomplete="off" aria-label="isian kosong">`))));
      const blanks = [...list.querySelectorAll('input.blank')];
      const fb = h('div', { class: 'q-feedback' });
      let tries = 0;
      const revealBtn = button('Tunjukkan jawaban', { kind: 'ghost', cls: 'btn-sm hidden', iconName: 'eye', onClick: () => {
        blanks.forEach((b) => { b.value = b.dataset.answer.replace('-', '−'); b.classList.add('is-revealed'); b.readOnly = true; });
        fb.replaceChildren(feedback('hint', 'Perhatikan jawabannya, lalu lanjutkan.'));
        check.disabled = true; revealBtn.remove(); done();
      } });
      const check = button('Periksa', { onClick: () => {
        if (blanks.some((b) => parseNumber(b.value) === null)) { fb.replaceChildren(feedback('hint', 'Isi semua kotak dengan angka.')); return; }
        tries++;
        let ok = true;
        blanks.forEach((b) => {
          const right = sameNumber(parseNumber(b.value), Number(b.dataset.answer));
          b.classList.toggle('is-correct', right);
          b.classList.toggle('is-wrong', !right);
          ok = ok && right;
        });
        logEvent('answer', { module_id: id, item_id: `faded:${idx}`, payload: { correct: ok, attempt: tries } });
        if (ok) {
          sound('correct');
          blanks.forEach((b) => { b.readOnly = true; });
          fb.replaceChildren(feedback('correct', 'Tepat! Kamu bisa melengkapinya sendiri.'));
          check.disabled = true; revealBtn.remove(); done();
        } else {
          sound('wrong');
          fb.replaceChildren(feedback('wrong', 'Ada yang belum tepat', 'Lihat kotak merah. Bandingkan dengan contoh sebelumnya.'));
          if (tries >= 2) revealBtn.classList.remove('hidden');
        }
      } });
      blanks.forEach((b) => b.addEventListener('keydown', (e) => { if (e.key === 'Enter') check.click(); }));
      el.append(h('article', { class: 'card step-card' },
        h('p', { class: 'eyebrow' }, 'Contoh memudar · isi kotak kosong'), h('h2', { tabindex: '-1' }, s.title),
        html('div', 'problem', s.problem), list, fb, h('div', { class: 'q-tools' }, revealBtn), h('div', { class: 'q-actions' }, check)));
    },

    explain(el, s, { markComplete: done }) {
      const fb = h('div', { class: 'q-feedback' });
      const { list, buttons } = choiceList(s.options.map((o) => o.text), {
        onPick: (i) => {
          const o = s.options[i];
          markChoice(buttons, i, o.correct ? 'correct' : 'wrong');
          sound(o.correct ? 'correct' : 'wrong');
          fb.replaceChildren(feedback(o.correct ? 'correct' : 'wrong', o.correct ? 'Tepat!' : 'Kurang tepat', o.why));
          logEvent('answer', { module_id: id, item_id: `explain:${idx}`, payload: { correct: o.correct, choice: i } });
          if (o.correct) { buttons.forEach((b) => { b.disabled = true; }); done(); }
        },
      });
      el.append(h('article', { class: 'card step-card' },
        h('p', { class: 'eyebrow' }, 'Jelaskan dengan kata-katamu'), h('h2', { tabindex: '-1' }, s.title),
        html('p', 'step-text', s.question), list, fb));
    },

    mcq(el, s, { markComplete: done }) {
      const fb = h('div', { class: 'q-feedback' });
      let tries = 0;
      const { list, buttons } = choiceList(s.options, {
        onPick: (i) => {
          tries++;
          const ok = i === s.answer;
          markChoice(buttons, i, ok ? 'correct' : 'wrong');
          sound(ok ? 'correct' : 'wrong');
          logEvent('answer', { module_id: id, item_id: `mcq:${idx}`, payload: { correct: ok, attempt: tries } });
          if (ok || tries >= 2) {
            if (!ok) buttons[s.answer].classList.add('is-correct');
            buttons.forEach((b) => { b.disabled = true; });
            fb.replaceChildren(feedback(ok ? 'correct' : 'hint', ok ? 'Tepat!' : 'Pembahasan', s.explanation));
            done();
          } else {
            fb.replaceChildren(feedback('wrong', 'Coba lagi', 'Baca lagi soalnya, lalu hitung setiap pilihan.'));
          }
        },
      });
      el.append(h('article', { class: 'card step-card' },
        contextBadge(`Pojok Literasi · ${s.context || 'Literasi'}`), h('h2', { tabindex: '-1' }, s.title),
        html('p', 'step-text', s.question), list, fb));
    },

    practice(el, s, { markComplete: done }) {
      const box = h('div', {});
      el.append(h('div', { class: 'step-intro' }, h('h2', { tabindex: '-1' }, s.title), h('p', { class: 'muted' }, 'Soal sejenis dengan angka acak. Pakai 💡 jika macet.')), box);
      practiceSession(box, {
        templateIds: s.templates, count: s.count, moduleId: id,
        onComplete: (sum) => { practiceResults.push(sum); store.saveModuleProgress(id, { practice: sum }); done(); },
      });
    },

    story(el, s, { markComplete: done }) {
      storyWorkspace(el, s, { moduleId: id, onComplete: done });
    },

    quiz(el, s, { markComplete: done }) {
      const box = h('div', {});
      el.append(h('div', { class: 'step-intro' }, h('h2', { tabindex: '-1' }, s.title), h('p', { class: 'muted' }, `${s.items.length} soal. Tanpa petunjuk, kerjakan sendiri.`)), box);
      runQuiz(box, s.items, {
        mode: 'quiz', title: 'Kuis',
        onFinish: (r) => {
          quizScore = r.score / r.total;
          store.pushQuizHistory({ kind: 'module', id, score: r.score, total: r.total });
          logEvent('quiz_done', { module_id: id, payload: { score: r.score, total: r.total, answers: r.answers.map((a) => (a.correct ? 1 : 0)) } });
          done();
        },
      });
    },
  };

  // ---------------------------------------------------------------- selesai
  function finishModule() {
    const prev = store.getModuleProgress(id);
    const practice = practiceResults.at(-1) || prev.practice;
    const qScore = quizScore ?? prev.quizScore ?? 0;
    let earned = 1; // semua langkah selesai
    if (qScore >= 0.8) earned++;
    if (practice && practice.total && practice.correct / practice.total >= 0.7) earned++;
    const starsNow = Math.max(prev.stars || 0, earned);
    store.saveModuleProgress(id, { done: true, step: 0, stars: starsNow, quizScore: Math.max(prev.quizScore || 0, qScore) });
    logEvent('module_done', { module_id: id, payload: { stars: earned, quiz: qScore } });
    sync();

    const nextMeta = man.modules.find((m) => m.order === meta.order + 1);
    headSlot.replaceChildren(segmentBar(steps.length, steps.length));
    footer.classList.add('hidden');
    const survey = h('div', { class: 'card survey-card' });
    content.surveys().then((sv) => {
      const me = sv.mental_effort;
      const row = h('div', { class: 'effort-row', role: 'radiogroup', 'aria-label': me.title },
        me.scale.map((opt) => h('button', {
          type: 'button', class: 'effort', 'aria-label': opt.label, title: opt.label,
          onClick: () => {
            queueSurvey('mental_effort', id, { effort: opt.value });
            sync();
            survey.replaceChildren(h('p', { class: 'center' }, `Terima kasih! (${opt.emoji} ${opt.label})`));
          },
        }, h('span', { class: 'effort-emoji' }, opt.emoji), h('span', { class: 'effort-label' }, opt.label))));
      survey.append(h('p', { class: 'survey-q' }, me.title), row);
    });

    stage.replaceChildren(h('article', { class: 'card finish-card' },
      h('span', { class: 'finish-icon' }, icon('sparkle', { filled: true, size: 40 })),
      h('h2', {}, `Modul ${meta.order} selesai!`),
      stars(starsNow),
      h('ul', { class: 'finish-list' },
        h('li', {}, '★ Menyelesaikan semua langkah'),
        h('li', { class: qScore >= 0.8 ? '' : 'muted' }, `★ Kuis ≥ 80% (skormu ${Math.round(qScore * 100)}%)`),
        h('li', { class: practice && practice.correct / practice.total >= 0.7 ? '' : 'muted' }, `★ Latihan benar ≥ 70%${practice ? ` (${practice.correct}/${practice.total})` : ''}`))),
    survey,
    h('div', { class: 'finish-actions' },
      nextMeta ? button(`Lanjut ke Modul ${nextMeta.order}`, { onClick: () => go(`/m/${nextMeta.id}`) }) : button('Coba Tantangan', { onClick: () => go('/challenge') }),
      button('Kembali ke Peta Belajar', { kind: 'secondary', onClick: () => go('/modules') })));
    window.scrollTo({ top: 0 });
  }

  show(idx);
}

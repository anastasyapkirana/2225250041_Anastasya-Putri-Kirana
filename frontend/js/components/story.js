// Ruang Kerja Soal Cerita 5 langkah (FR-10, literasi matematika):
// Diketahui → Ditanya → Ubah ke barisan → Hitung → Periksa & tafsirkan.
import { h, html, button, numberInput, choiceList, markChoice, feedback, sound, contextBadge } from '../ui.js';
import { renderVisual, discussionCard } from './viz.js';
import { checkField } from '../engine/checker.js';
import { fmt, fmtMoney } from '../engine/format.js';
import { clean } from '../engine/expr.js';
import { logEvent } from '../api.js';
import * as store from '../store.js';
import * as content from '../content.js';

const STEPS = [
  { key: 'known', title: 'Diketahui', ask: 'Apa yang diketahui dari cerita?' },
  { key: 'asked', title: 'Ditanya', ask: 'Apa yang ditanyakan?' },
  { key: 'model', title: 'Ubah ke barisan', ask: 'Tentukan angka-angkanya.' },
  { key: 'compute', title: 'Hitung', ask: 'Masukkan ke rumus, lalu hitung.' },
  { key: 'interpret', title: 'Periksa & tafsirkan', ask: 'Apa arti jawabanmu?' },
];

let uid = 0;

export async function storyWorkspace(container, step, { moduleId, onComplete }) {
  const misc = await content.misconceptions();
  const m = step.model;
  const target = step.target;
  const answer = target === 'un' ? clean(m.a + (m.n - 1) * m.b) : clean((m.un - m.a) / m.b + 1);
  const env = target === 'un' ? { a: m.a, b: m.b, n: m.n } : { a: m.a, b: m.b, un: m.un, n: answer };
  const show = (v) => (step.money ? fmtMoney(v) : fmt(v));
  const unit = step.money ? '' : ` ${step.unit}`;
  let current = 0;
  const startedAt = performance.now();

  const storyCard = h('details', { class: 'card story-card', open: true },
    h('summary', {}, contextBadge(`Pojok Literasi · ${step.context}`), h('span', { class: 'story-title' }, step.title)),
    html('div', 'story-text', step.text),
    renderVisual(step.visual));
  const list = h('ol', { class: 'stepper' });
  const items = STEPS.map((s, i) => {
    const body = h('div', { class: 'stepper-body' });
    const li = h('li', { class: 'stepper-item' },
      h('div', { class: 'stepper-head' }, h('span', { class: 'stepper-num' }, String(i + 1)), h('span', { class: 'stepper-title' }, s.title), h('span', { class: 'stepper-done' })),
      body);
    list.append(li);
    return { li, body };
  });
  container.replaceChildren(storyCard, list);

  function setState() {
    items.forEach(({ li }, i) => {
      li.classList.toggle('is-done', i < current);
      li.classList.toggle('is-current', i === current);
    });
  }

  function advance(summary) {
    items[current].body.replaceChildren(html('p', 'stepper-summary', summary));
    logEvent('story_step', { module_id: moduleId, item_id: step.id, payload: { step: STEPS[current].key } });
    current++;
    setState();
    if (current < STEPS.length) renderStep(current);
    items[Math.min(current, STEPS.length - 1)].li.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Langkah pilihan ganda (Diketahui, Ditanya, Tafsir, Nalar).
  function choiceStep(body, choice, question, onRight) {
    const fb = h('div', { class: 'q-feedback' });
    let wrongs = 0;
    const { list: cl, buttons } = choiceList(choice.options, {
      onPick: (idx) => {
        if (idx === choice.answer) {
          sound('correct');
          markChoice(buttons, idx, 'correct');
          buttons.forEach((b) => { b.disabled = true; });
          fb.replaceChildren(choice.explanation ? feedback('correct', 'Tepat!', choice.explanation) : '');
          setTimeout(() => onRight(choice.options[idx]), choice.explanation ? 0 : 450);
        } else {
          sound('wrong');
          wrongs++;
          markChoice(buttons, idx, 'wrong');
          fb.replaceChildren(feedback('hint', 'Coba lagi', choice.hint || (wrongs > 1 && choice.explanation) || 'Baca lagi ceritanya pelan-pelan.'));
        }
      },
    });
    body.replaceChildren(html('p', 'stepper-ask', question), cl, fb);
  }

  function renderStep(i) {
    const s = STEPS[i];
    const body = items[i].body;
    if (s.key === 'known' || s.key === 'asked') {
      choiceStep(body, step[s.key], s.ask, (text) => advance(text));
      return;
    }
    if (s.key === 'model') {
      const fields = target === 'un'
        ? [{ key: 'a', label: 'a = suku pertama', chip: 'a', answer: m.a, misconceptions: [] },
          { key: 'b', label: 'b = beda', chip: 'b', answer: m.b, misconceptions: [] },
          { key: 'n', label: 'n = suku yang dicari', chip: 'n', answer: m.n, misconceptions: [] }]
        : [{ key: 'a', label: 'a = suku pertama', chip: 'a', answer: m.a, misconceptions: [] },
          { key: 'b', label: 'b = beda', chip: 'b', answer: m.b, misconceptions: [] },
          { key: 'un', label: 'U<sub>n</sub> = nilai yang dicapai', chip: null, answer: m.un, misconceptions: [] }];
      numericStep(body, s.ask, fields, {
        hint: m.b < 0 ? 'Nilainya berkurang, jadi b negatif. Pakai tombol ±.' : 'a = angka awal, b = tambahannya.',
        onRight: () => {
          const seq = [0, 1, 2].map((k) => show(m.a + k * m.b)).join(', ');
          const parts = target === 'un' ? `a = ${fmt(m.a)}, b = ${fmt(m.b)}, n = ${m.n}` : `a = ${fmt(m.a)}, b = ${fmt(m.b)}, U<sub>n</sub> = ${fmt(m.un)}`;
          advance(`${parts}<br>Barisannya: ${seq}, …`);
        },
      });
      return;
    }
    if (s.key === 'compute') {
      const formula = target === 'un'
        ? `U<sub>${m.n}</sub> = ${fmt(m.a)} + (${m.n} − 1) × ${fmt(m.b, { paren: true })}`
        : `${fmt(m.un)} = ${fmt(m.a)} + (n − 1) × ${fmt(m.b, { paren: true })}`;
      const field = {
        key: target, label: target === 'un' ? `U<sub>${m.n}</sub> =` : 'n =', answer,
        misconceptions: target === 'un' ? ['M1', 'M2', 'M3', 'M4', 'M6', 'M7', 'M8'] : ['M9', 'M8'],
      };
      const hints = target === 'un'
        ? [`Kurung dulu: ${m.n} − 1 = ${m.n - 1}.`, `Lalu kali: ${m.n - 1} × ${fmt(m.b, { paren: true })} = ${fmt((m.n - 1) * m.b)}.`]
        : [`Kurangi dulu: ${fmt(m.un)} − ${fmt(m.a, { paren: true })} = ${fmt(m.un - m.a)}.`, `Bagi dengan b: ${fmt(m.un - m.a)} ÷ ${fmt(m.b, { paren: true })} = ${fmt((m.un - m.a) / m.b)}, lalu tambah 1.`];
      numericStep(body, `${s.ask}<span class="formula">${formula}</span>`, [field], {
        hints,
        onRight: () => advance(`${formula}<br>= <b>${show(answer)}${unit}</b>`),
      });
      return;
    }
    // interpret (+ reason)
    choiceStep(body, step.interpret, `${s.ask} (${show(answer)}${unit})`, (text) => {
      if (step.reason) {
        choiceStep(body, step.reason, `<b>Bernalar:</b> ${step.reason.question}`, () => {
          setTimeout(() => finish(text), 1200);
        });
        body.prepend(html('p', 'stepper-summary', `✓ ${text}`));
      } else finish(text);
    });
  }

  function numericStep(body, question, fields, { hint, hints = [], onRight }) {
    const fb = h('div', { class: 'q-feedback' });
    const inputs = {};
    const wrap = h('div', { class: 'q-fields is-stack' });
    fields.forEach((f) => {
      const ni = numberInput({ label: f.label, chip: f.chip, id: `st${++uid}-${f.key}`, onEnter: () => check.click() });
      inputs[f.key] = ni.input;
      wrap.append(ni.wrap);
    });
    let attempts = 0;
    let hintIdx = 0;
    const hintBox = h('div', { class: 'q-hints' });
    const hintBtn = hints.length ? button('Petunjuk', { kind: 'ghost', iconName: 'bulb', cls: 'btn-sm', onClick: () => {
      if (hintIdx >= hints.length) return;
      hintBox.append(html('div', 'hint-card', `<span class="hint-level">Petunjuk ${hintIdx + 1}</span>${hints[hintIdx]}`));
      hintIdx++;
      logEvent('hint', { module_id: moduleId, item_id: step.id, payload: { level: hintIdx } });
      if (hintIdx >= hints.length) hintBtn.disabled = true;
    } }) : null;
    const revealBtn = button('Tunjukkan jawaban', { kind: 'ghost', iconName: 'eye', cls: 'btn-sm hidden', onClick: () => {
      fields.forEach((f) => { inputs[f.key].value = fmt(f.answer).replace('−', '-'); inputs[f.key].classList.add('is-revealed'); });
      onRight();
    } });
    const check = button('Periksa', { onClick: () => {
      const res = fields.map((f) => ({ f, r: checkField(f, inputs[f.key].value, env, misc) }));
      if (res.some((x) => x.r.status === 'empty' || x.r.status === 'invalid')) {
        fb.replaceChildren(feedback('hint', 'Isi semua kotak dengan angka.'));
        return;
      }
      attempts++;
      const ok = res.every((x) => x.r.status === 'correct');
      res.forEach(({ f, r }) => {
        inputs[f.key].classList.toggle('is-correct', r.status === 'correct');
        inputs[f.key].classList.toggle('is-wrong', r.status === 'wrong');
      });
      logEvent('answer', { module_id: moduleId, item_id: `${step.id}:${fields.map((f) => f.key).join('')}`, payload: { correct: ok, attempt: attempts, misconception: res.find((x) => x.r.misconception)?.r.misconception.id || null } });
      store.bumpStats({ answered: 1, correct: ok ? 1 : 0 });
      if (ok) { sound('correct'); onRight(); return; }
      sound('wrong');
      const mis = res.find((x) => x.r.misconception)?.r.misconception;
      fb.replaceChildren(feedback('wrong', 'Belum tepat', mis ? mis.msg : (hint || 'Periksa lagi hitunganmu, atau buka petunjuk.')));
      if (attempts >= 2) revealBtn.classList.remove('hidden');
    } });
    body.replaceChildren(html('p', 'stepper-ask', question), wrap, h('div', { class: 'q-tools' }, hintBtn, revealBtn), hintBox, fb, h('div', { class: 'q-actions' }, check));
    inputs[fields[0].key].focus({ preventScroll: true });
  }

  function finish(text) {
    items[STEPS.length - 1].body.replaceChildren(html('p', 'stepper-summary', `✓ ${text}`));
    current = STEPS.length;
    setState();
    storyCard.open = false;
    container.append(h('div', { class: 'card summary-card' }, html('p', '', '<b>Soal cerita selesai!</b> Kamu sudah merumuskan, menghitung, dan menafsirkan.')),
      discussionCard(step.discussion) || '');
    logEvent('story_step', { module_id: moduleId, item_id: step.id, payload: { step: 'done', ms: Math.round(performance.now() - startedAt) } });
    onComplete && onComplete();
  }

  setState();
  renderStep(0);
}

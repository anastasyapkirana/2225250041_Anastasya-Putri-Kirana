// Kartu soal latihan: hint 3 level, umpan balik miskonsepsi, cek hitungan,
// tandai soal, dan sesi latihan (beberapa soal berurutan).
import { h, html, button, icon, iconButton, numberInput, choiceList, markChoice, feedback, sound, toast } from '../ui.js';
import * as store from '../store.js';
import { logEvent } from '../api.js';
import { checkField, calcCheck } from '../engine/checker.js';
import { fmt } from '../engine/format.js';
import { generate, instantiate, questionKey } from '../engine/generator.js';
import * as content from '../content.js';
import { renderVisual } from './viz.js';

let uid = 0;
const GENERIC_WRONG = 'Periksa lagi langkahmu, atau buka petunjuk 💡.';

/**
 * @param q objek soal dari generator
 * @param opts { misc, moduleId, index, total, onDone({correct, revealed, hintLevel, attempts}), reviewFolder, reviewKey }
 */
export function questionCard(q, opts) {
  const { misc, moduleId = null, onDone } = opts;
  const key = questionKey(q);
  const started = performance.now();
  let attempts = 0;
  let hintLevel = 0;
  let finished = false;
  let lastValues = {};

  const card = h('article', { class: 'card q-card' });
  let seenMis = null;

  const head = h('div', { class: 'q-head' },
    h('span', { class: 'q-count' }, opts.total ? `Soal ${opts.index + 1} dari ${opts.total}` : q.title),
    bookmarkButton(q, moduleId));
  const prompt = html('div', 'q-prompt', q.prompt);

  // ---- field jawaban
  const inputs = {};
  const fieldWrap = h('div', { class: `q-fields ${q.fields.length > 1 ? 'is-multi' : ''}` });
  for (const f of q.fields) {
    if (f.type === 'choice') {
      const { list, buttons } = choiceList(f.options, {
        name: f.label,
        onPick: (i) => {
          inputs[f.key].value = i;
          buttons.forEach((b, j) => { b.setAttribute('aria-checked', String(i === j)); b.classList.toggle('is-picked', i === j); b.classList.remove('is-wrong'); });
        },
      });
      inputs[f.key] = { value: null, buttons, el: list };
      fieldWrap.append(list);
    } else {
      const { wrap, input } = numberInput({ label: f.label, chip: f.chip, id: `q${++uid}-${f.key}`, onEnter: () => primary.click() });
      inputs[f.key] = { input, el: wrap };
      fieldWrap.append(wrap);
    }
  }

  const fb = h('div', { class: 'q-feedback' });
  const hintBox = h('div', { class: 'q-hints' });
  const extra = h('div', { class: 'q-extra' });

  const hintBtn = button('Petunjuk', { kind: 'ghost', iconName: 'bulb', cls: 'btn-sm', onClick: showHint });
  const checkBtn = q.check ? button('Cek cara lain', { kind: 'ghost', iconName: 'refresh', cls: 'btn-sm', onClick: showCalcCheck, disabled: true }) : null;
  const revealBtn = button('Lihat pembahasan', { kind: 'ghost', iconName: 'eye', cls: 'btn-sm hidden', onClick: () => finish(false, true) });
  const tools = h('div', { class: 'q-tools' }, hintBtn, checkBtn, revealBtn);
  const primary = button('Periksa', { kind: 'primary', onClick: onPrimary });

  card.append(head, prompt, fieldWrap, tools, hintBox, fb, extra, h('div', { class: 'q-actions' }, primary));

  function readValue(f) {
    const inp = inputs[f.key];
    return f.type === 'choice' ? inp.value : inp.input.value;
  }

  function onPrimary() {
    if (finished) { onDone && onDone(result); return; }
    const results = q.fields.map((f) => ({ f, r: checkField(f, readValue(f), q.env, misc) }));
    if (results.some((x) => x.r.status === 'empty')) {
      fb.replaceChildren(feedback('hint', 'Isi dulu semua jawabannya, ya.'));
      return;
    }
    const invalid = results.find((x) => x.r.status === 'invalid');
    if (invalid) {
      fb.replaceChildren(feedback('hint', 'Tulis jawaban berupa angka, misalnya 32 atau −4.'));
      return;
    }
    attempts++;
    lastValues = Object.fromEntries(results.map((x) => [x.f.key, x.r.value]));
    if (checkBtn) checkBtn.disabled = false;
    let firstMis = null;
    for (const { f, r } of results) {
      const el = f.type === 'choice' ? null : inputs[f.key].input;
      if (el) {
        el.classList.toggle('is-correct', r.status === 'correct');
        el.classList.toggle('is-wrong', r.status === 'wrong');
      } else if (r.status === 'wrong') {
        markChoice(inputs[f.key].buttons, r.value, 'wrong');
      }
      if (!firstMis && r.misconception) firstMis = r.misconception;
    }
    if (firstMis && !seenMis) seenMis = firstMis.id;
    const allCorrect = results.every((x) => x.r.status === 'correct');
    logEvent('answer', {
      module_id: moduleId,
      item_id: q.tid,
      payload: {
        correct: allCorrect, attempt: attempts, hint: hintLevel, values: lastValues,
        misconception: firstMis?.id || null, params: paramsOf(q.env), ms: Math.round(performance.now() - started),
      },
    });
    store.bumpStats({ answered: 1 });

    if (allCorrect) {
      sound('correct');
      store.bumpStats({ correct: 1 });
      if (opts.reviewFolder && hintLevel < 3 && attempts <= 2) {
        const folders = opts.reviewFolder === 'mistakes' ? ['hard', 'confused'] : [opts.reviewFolder];
        folders.forEach((f) => store.removeReview(f, opts.reviewKey || key));
      }
      finish(true, false);
      return;
    }
    sound('wrong');
    const right = results.filter((x) => x.r.status === 'correct').map((x) => x.f.key);
    const partial = right.length && q.fields.length > 1 ? `<b>${right.join(', ')}</b> sudah benar. ` : '';
    fb.replaceChildren(feedback('wrong', firstMis ? 'Coba periksa lagi' : 'Belum tepat', partial + (firstMis ? firstMis.msg : GENERIC_WRONG)));
    if (firstMis) store.addReview('confused', key, { tid: q.tid, env: q.env, moduleId, misconception: firstMis.id });
    if (attempts >= 2) {
      revealBtn.classList.remove('hidden');
      store.addReview('hard', key, { tid: q.tid, env: q.env, moduleId });
    }
  }

  function showHint() {
    if (hintLevel >= 3) return;
    if (hintLevel === 2 && attempts === 0) {
      fb.replaceChildren(feedback('hint', 'Coba jawab dulu sekali, ya. Petunjuk terakhir terbuka setelah itu.'));
      return;
    }
    hintLevel++;
    store.bumpStats({ hints: 1 });
    logEvent('hint', { module_id: moduleId, item_id: q.tid, payload: { level: hintLevel, attempts } });
    hintBox.append(html('div', 'hint-card', `<span class="hint-level">Petunjuk ${hintLevel}</span>${q.hints[hintLevel - 1]}`));
    hintBtn.querySelector('span:last-child').textContent = hintLevel >= 3 ? 'Petunjuk habis' : 'Petunjuk berikutnya';
    if (hintLevel >= 3) { hintBtn.disabled = true; store.addReview('hard', key, { tid: q.tid, env: q.env, moduleId }); }
  }

  function showCalcCheck() {
    const f = q.fields[0];
    const value = lastValues[f.key];
    if (value == null) return;
    const res = calcCheck(q.env, value);
    logEvent('check_calc', { module_id: moduleId, item_id: q.tid, payload: { matches: res.matches } });
    let body;
    if (res.mode === 'list') {
      const list = res.terms.map((t, i) => (i === res.terms.length - 1 ? `<b>${fmt(t)}</b>` : fmt(t))).join(', ');
      body = `Tulis sukunya satu per satu:<br>${list}<br>Suku ke-${q.env.n} = <b>${fmt(res.terms.at(-1))}</b>. Jawabanmu ${fmt(value)} ${res.matches ? 'cocok ✓' : 'belum cocok'}.`;
    } else {
      body = `Hitung mundur: (jawabanmu − a) ÷ b + 1<br>= (${fmt(value)} − ${fmt(q.env.a, { paren: true })}) ÷ ${fmt(q.env.b, { paren: true })} + 1 = <b>${fmt(res.back)}</b><br>Harusnya sama dengan n = ${q.env.n}. ${res.matches ? 'Cocok ✓' : 'Belum cocok, cek lagi hitunganmu.'}`;
    }
    extra.replaceChildren(html('div', 'calc-check', `<span class="hint-level">Cek dengan cara lain</span>${body}`));
  }

  let result = null;
  function finish(correct, revealed) {
    finished = true;
    result = { correct, revealed, hintLevel, attempts, tid: q.tid };
    store.pushHistory({
      source: opts.source || (moduleId ? 'module' : 'practice'), tid: q.tid, topic: q.topic,
      firstTry: correct && attempts === 1, solved: correct, attempts, hintLevel, misconception: seenMis,
    });
    hintBtn.disabled = true;
    revealBtn.classList.add('hidden');
    Object.values(inputs).forEach((inp) => {
      if (inp.input) inp.input.readOnly = true;
      if (inp.buttons) inp.buttons.forEach((b) => { b.disabled = true; });
    });
    const sol = `<ol class="solution">${q.solution.map((s) => `<li>${s}</li>`).join('')}</ol>`;
    const choiceAnswer = q.fields.filter((f) => f.type === 'choice').map((f) => `<p>Jawaban: <b>${f.options[f.answer]}</b></p>`).join('');
    if (correct) {
      fb.replaceChildren(feedback('correct', attempts === 1 && hintLevel === 0 ? 'Tepat! 🎉' : 'Tepat!',
        `<details><summary>Lihat pembahasan</summary>${sol}${choiceAnswer}</details>`));
    } else {
      q.fields.forEach((f) => {
        if (f.type === 'choice') markChoice(inputs[f.key].buttons, f.answer, 'correct');
        else { inputs[f.key].input.value = fmt(f.answer).replace('−', '-'); inputs[f.key].input.classList.add('is-revealed'); }
      });
      fb.replaceChildren(feedback('hint', 'Pembahasan', sol + choiceAnswer + '<p>Soal ini masuk folder <b>Soal sulit</b> untuk diulas lagi.</p>'));
    }
    // Ilustrasi pembahasan diletakkan tepat sebelum langkah penyelesaian.
    const pic = renderVisual(q.visual);
    const solEl = fb.querySelector('.solution');
    if (pic && solEl) solEl.before(pic);
    primary.querySelector('span').textContent = opts.lastLabel || 'Lanjut';
    primary.focus();
  }

  return card;
}

/** Tombol "Simpan": simpan soal ke koleksi "Soal tersimpan". */
export function bookmarkButton(q, moduleId = null) {
  const key = questionKey(q);
  const label = h('span', {});
  const btn = h('button', { type: 'button', class: 'save-btn' }, icon('bookmark', { size: 20 }), label);
  const draw = () => {
    const on = store.isFlagged(key);
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Tersimpan' : 'Simpan';
  };
  btn.addEventListener('click', () => {
    if (store.isFlagged(key)) {
      store.removeReview('flagged', key);
      toast('Dihapus dari Soal tersimpan');
    } else {
      store.addReview('flagged', key, { tid: q.tid, env: q.env, moduleId });
      toast('Soal disimpan');
    }
    draw();
  });
  draw();
  return btn;
}

function paramsOf(env) {
  return Object.fromEntries(Object.entries(env).filter(([k]) => !/^u\d+$/.test(k)));
}

/**
 * Sesi latihan: beberapa soal berurutan.
 * @param opts { templateIds?, count?, items? (soal jadi), moduleId, reviewFolder, onComplete(summary), title }
 */
export async function practiceSession(container, opts) {
  const [tpls, misc] = await Promise.all([content.templates(), content.misconceptions()]);
  const items = opts.items || Array.from({ length: opts.count }, (_, i) => {
    const tid = opts.templateIds[i % opts.templateIds.length];
    return generate(tid, tpls[tid]);
  });
  const results = [];
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, items.map(() => h('span', { class: 'dot' })));
  const stage = h('div', { class: 'q-stage' });
  container.replaceChildren(dots, stage);

  function show(i) {
    [...dots.children].forEach((d, j) => {
      d.className = `dot ${j < i ? (results[j].correct ? 'is-correct' : 'is-wrong') : ''} ${j === i ? 'is-current' : ''}`;
    });
    const q = items[i];
    const card = questionCard(q, {
      misc, moduleId: opts.moduleId, index: i, total: items.length, source: opts.source,
      reviewFolder: opts.reviewFolder, reviewKey: q.reviewKey,
      lastLabel: i === items.length - 1 ? 'Selesai' : 'Soal berikutnya',
      onDone: (r) => { results.push(r); if (i + 1 < items.length) show(i + 1); else done(); },
    });
    stage.replaceChildren(card);
    card.querySelector('input')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function done() {
    [...dots.children].forEach((d, j) => { d.className = `dot ${results[j].correct ? 'is-correct' : 'is-wrong'}`; });
    const correct = results.filter((r) => r.correct).length;
    const summary = { correct, total: results.length, hints: results.reduce((s, r) => s + r.hintLevel, 0) };
    logEvent('practice_done', { module_id: opts.moduleId, payload: summary });
    const msg = correct === results.length ? 'Luar biasa, semua benar!' : correct >= results.length * 0.7 ? 'Bagus! Terus berlatih.' : 'Tidak apa-apa. Coba ulas contoh lagi, lalu latihan lagi.';
    stage.replaceChildren(h('div', { class: 'card summary-card' },
      html('div', 'summary-big', `${correct}<small>/${results.length}</small>`),
      h('p', {}, msg),
      h('p', { class: 'muted' }, 'Soal yang salah tersimpan di Ulas Lagi.')));
    opts.onComplete && opts.onComplete(summary);
  }

  if (!items.length) {
    stage.replaceChildren(h('div', { class: 'card empty' }, icon('sparkle'), h('p', {}, 'Belum ada soal di sini.')));
    opts.onComplete && opts.onComplete({ correct: 0, total: 0, hints: 0 });
    return;
  }
  show(0);
}

/** Bangun ulang soal dari item Ulas Lagi. */
export async function reviewItems(folder) {
  const tpls = await content.templates();
  const review = store.getReview();
  const source = folder === 'mistakes' ? { ...review.hard, ...review.confused } : review[folder] || {};
  const items = Object.entries(source);
  return items.filter(([, it]) => tpls[it.tid]).map(([k, it]) => ({ ...instantiate(it.tid, tpls[it.tid], it.env), reviewKey: k }));
}

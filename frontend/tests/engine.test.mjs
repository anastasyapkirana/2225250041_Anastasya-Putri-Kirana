// Jalankan: node --test frontend/tests
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluate, clean } from '../js/engine/expr.js';
import { fmt, render, parseNumber } from '../js/engine/format.js';
import { generate, instantiate, sample, questionKey } from '../js/engine/generator.js';
import { checkField, calcCheck } from '../js/engine/checker.js';
import { anonId } from '../js/engine/anon.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf-8'));
const CASES = readJson('backend/tests/fixtures/expr_cases.json');
const TEMPLATES = readJson('content/questions/templates.json');
const MISC = readJson('content/misconceptions.json');

test('evaluate cocok dengan fixture bersama (sama dengan Python)', () => {
  for (const c of CASES.evaluate) {
    const r = evaluate(c.expr, c.env);
    if (typeof c.result === 'boolean') assert.equal(r, c.result, c.expr);
    else assert.ok(Math.abs(clean(r) - c.result) < 1e-9, `${c.expr} → ${r}`);
  }
});

test('ekspresi tidak aman / tidak valid ditolak', () => {
  for (const expr of CASES.errors) {
    assert.throws(() => evaluate(expr, { a: 1, b: 2 }), Error, expr);
  }
});

test('format angka Indonesia sama dengan Python', () => {
  for (const c of CASES.format) assert.equal(fmt(c.value, { paren: c.paren }), c.text);
  for (const c of CASES.render) assert.equal(render(c.template, c.env), c.text);
});

test('parseNumber menerima gaya penulisan siswa', () => {
  const cases = [['32', 32], [' -4 ', -4], ['−4', -4], ['19.000', 19000], ['Rp19.000', 19000],
    ['25,5', 25.5], ['1.5', 1.5], ['1.234.567', 1234567], ['', null], ['abc', null], ['-', null], ['3-2', null]];
  for (const [raw, expected] of cases) assert.equal(parseNumber(raw), expected, raw);
});

test('semua template menghasilkan soal valid untuk 300 seed', () => {
  for (const [tid, tpl] of Object.entries(TEMPLATES)) {
    for (let seed = 1; seed <= 300; seed++) {
      const q = generate(tid, tpl, seed);
      assert.ok(!q.prompt.includes('{'), `${tid}: placeholder tersisa`);
      for (const h of q.hints) assert.ok(!h.includes('{'), `${tid}: hint placeholder`);
      for (const f of q.fields) {
        assert.ok(Number.isInteger(f.answer), `${tid}.${f.key} jawaban bukan bulat`);
        // jawaban benar harus dinilai benar
        const raw = f.type === 'choice' ? f.answer : fmt(f.answer).replace('−', '-');
        assert.equal(checkField(f, raw, q.env, MISC).status, 'correct', `${tid}.${f.key} seed ${seed}`);
      }
    }
  }
});

test('seed sama menghasilkan soal sama', () => {
  const a = generate('T-un', TEMPLATES['T-un'], 42);
  const b = generate('T-un', TEMPLATES['T-un'], 42);
  assert.deepEqual(a, b);
  assert.equal(questionKey(a), questionKey(b));
});

test('miskonsepsi M1–M4, M6–M8 terdeteksi', () => {
  const tpl = TEMPLATES['T-un'];
  const q = instantiate('T-un', tpl, sample({ ...tpl, params: { a: [5, 5], b: [3, 3], n: [10, 10] } }, 1));
  const f = q.fields[0];
  assert.equal(f.answer, 32);
  const id = (raw) => checkField(f, raw, q.env, MISC).misconception?.id ?? null;
  assert.equal(id('35'), 'M1'); // 5 + 10×3
  assert.equal(id('27'), 'M2'); // 9×3
  assert.equal(id('42'), 'M3'); // (5+10−1)×3
  assert.equal(id('77'), 'M6'); // 5 + 9×8
  assert.equal(id('185'), 'M7'); // jumlah deret
  assert.equal(id('33'), 'M8'); // salah hitung kecil
  assert.equal(id('100'), null);

  const neg = instantiate('T-un', tpl, sample({ ...tpl, params: { a: [50, 50], b: [-4, -4], n: [12, 12] } }, 1));
  assert.equal(checkField(neg.fields[0], '94', neg.env, MISC).misconception?.id, 'M4');
});

test('miskonsepsi beda terbalik (M5) dan lupa +1 (M9)', () => {
  const tb = TEMPLATES['T-beda'];
  const q = instantiate('T-beda', tb, sample({ ...tb, params: { a: [20, 20], b: [-3, -3] } }, 1));
  assert.equal(checkField(q.fields[0], '3', q.env, MISC).misconception?.id, 'M5');
  const tn = TEMPLATES['T-find-n'];
  const qn = instantiate('T-find-n', tn, sample({ ...tn, params: { a: [7, 7], b: [4, 4], n: [21, 21] } }, 1));
  assert.equal(checkField(qn.fields[0], '20', qn.env, MISC).misconception?.id, 'M9');
});

test('cek hitungan', () => {
  assert.deepEqual(calcCheck({ a: 1, b: 4, n: 8 }, 29).terms, [1, 5, 9, 13, 17, 21, 25, 29]);
  assert.equal(calcCheck({ a: 1, b: 4, n: 8 }, 32).matches, false);
  const big = calcCheck({ a: 5, b: 3, n: 100 }, 302);
  assert.equal(big.mode, 'backward');
  assert.equal(big.back, 100);
});

test('anonId deterministik dan sesuai pola backend', () => {
  const id = anonId(' 8a ', '12');
  assert.equal(id, anonId('8A', 12));
  assert.match(id, /^[a-z0-9]{8,32}$/);
  assert.notEqual(id, anonId('8A', 13));
});

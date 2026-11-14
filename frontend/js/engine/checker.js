// Pemeriksa jawaban + deteksi miskonsepsi (lihat docs/02-desain-pembelajaran.md §6).
import { clean, evaluate } from './expr.js';
import { parseNumber, sameNumber } from './format.js';

/** Cocokkan jawaban salah dengan daftar miskonsepsi field. */
export function findMisconception(field, value, env, db) {
  const correct = field.answer;
  for (const id of field.misconceptions || []) {
    const m = db[id];
    if (!m || m.near || !m.expr) continue;
    let predicted;
    try { predicted = clean(evaluate(m.expr, env)); } catch { continue; }
    if (!Number.isFinite(predicted) || sameNumber(predicted, correct)) continue;
    if (sameNumber(predicted, value)) return { id, msg: m.msg };
  }
  if ((field.misconceptions || []).includes('M8') && db.M8) {
    const diff = Math.abs(value - correct);
    if (diff > 0 && diff <= Math.max(2, Math.abs(correct) * 0.05)) return { id: 'M8', msg: db.M8.msg };
  }
  return null;
}

/**
 * Periksa satu field.
 * @returns {{status:'empty'|'invalid'|'correct'|'wrong', value:number|null, misconception:object|null}}
 */
export function checkField(field, raw, env, db) {
  if (field.type === 'choice') {
    if (raw == null || raw === '') return { status: 'empty', value: null, misconception: null };
    const idx = Number(raw);
    return { status: idx === field.answer ? 'correct' : 'wrong', value: idx, misconception: null };
  }
  if (raw == null || String(raw).trim() === '') return { status: 'empty', value: null, misconception: null };
  const value = parseNumber(raw);
  if (value === null) return { status: 'invalid', value: null, misconception: null };
  if (sameNumber(value, field.answer)) return { status: 'correct', value, misconception: null };
  return { status: 'wrong', value, misconception: findMisconception(field, value, env, db) };
}

/**
 * Data untuk tombol "Cek dengan cara lain" (FR-12).
 * Jika n kecil: tampilkan daftar suku. Jika besar: hitung mundur.
 */
export function calcCheck(env, studentValue) {
  const { a, b, n } = env;
  if (n <= 15) {
    const terms = Array.from({ length: n }, (_, i) => clean(a + i * b));
    return { mode: 'list', terms, matches: sameNumber(terms[n - 1], studentValue) };
  }
  const back = clean((studentValue - a) / b + 1);
  return { mode: 'backward', back, matches: sameNumber(back, n) };
}

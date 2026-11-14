// Format & parsing angka gaya Indonesia (ribuan titik, desimal koma, minus Unicode).
import { clean, evaluate } from './expr.js';

const MINUS = '−';

function groupThousands(intStr) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Sama dengan solver.format_id di Python. */
export function fmt(value, { paren = false } = {}) {
  const v = clean(Number(value));
  const abs = Math.abs(v);
  let text;
  if (Number.isInteger(v)) {
    text = groupThousands(String(abs));
  } else {
    const [whole, frac] = abs.toFixed(6).replace(/0+$/, '').split('.');
    text = `${groupThousands(whole)},${frac}`;
  }
  if (v < 0) {
    text = MINUS + text;
    if (paren) text = `(${text})`;
  }
  return text;
}

export function fmtMoney(value) {
  return `Rp${fmt(value)}`;
}

const PLACEHOLDER = /\{([^{}|]+)(\|p)?\}/g;

/** Ganti {ekspresi} atau {ekspresi|p} dengan nilainya. */
export function render(template, env) {
  return String(template).replace(PLACEHOLDER, (_, expr, p) => fmt(evaluate(expr, env), { paren: Boolean(p) }));
}

/**
 * Ubah teks masukan siswa menjadi angka.
 * "1.000" → 1000, "25,5" → 25.5, "1.5" → 1.5, "−3" → -3, "Rp19.000" → 19000.
 * Mengembalikan null jika kosong / tidak valid.
 */
export function parseNumber(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/^rp/i, '');
  if (s === '' || s === '-') return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function sameNumber(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-9;
}

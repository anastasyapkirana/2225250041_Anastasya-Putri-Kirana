// Parser ekspresi aman (tanpa eval). Pasangan dari backend/app/services/solver.py.
// Mendukung: angka, variabel, + - * / %, minus unary, kurung, abs(), floor(),
// dan satu perbandingan (< <= > >= == !=).

const FUNCS = { abs: Math.abs, floor: Math.floor };
const cache = new Map();

function tokenize(src) {
  const s = src.replace(/−/g, '-');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ t: 'num', v: Number(s.slice(i, j)) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      tokens.push({ t: 'id', v: s.slice(i, j) });
      i = j; continue;
    }
    const two = s.slice(i, i + 2);
    if (['<=', '>=', '==', '!='].includes(two)) { tokens.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/%()<>'.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`Karakter tidak dikenal "${c}" di "${src}"`);
  }
  return tokens;
}

function parse(src) {
  const tk = tokenize(src);
  let p = 0;
  const peek = () => tk[p];
  const take = (v) => {
    const t = tk[p];
    if (!t || (v && t.v !== v)) throw new Error(`Sintaks salah di "${src}"`);
    p++; return t;
  };

  function primary() {
    const t = peek();
    if (!t) throw new Error(`Ekspresi terpotong: "${src}"`);
    if (t.t === 'num') { p++; return () => t.v; }
    if (t.t === 'id') {
      p++;
      if (peek() && peek().v === '(') {
        const fn = FUNCS[t.v];
        if (!fn) throw new Error(`Fungsi tidak diizinkan: ${t.v}`);
        take('('); const arg = comparison(); take(')');
        return (env) => fn(arg(env));
      }
      const name = t.v;
      return (env) => {
        if (!(name in env)) throw new Error(`Variabel tidak dikenal "${name}" di "${src}"`);
        return env[name];
      };
    }
    if (t.v === '(') { take('('); const e = comparison(); take(')'); return e; }
    throw new Error(`Sintaks salah di "${src}"`);
  }
  function unary() {
    const t = peek();
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) {
      p++; const u = unary();
      return t.v === '-' ? (env) => -u(env) : u;
    }
    return primary();
  }
  function term() {
    let left = unary();
    while (peek() && ['*', '/', '%'].includes(peek().v)) {
      const op = take().v; const l = left; const r = unary();
      left = op === '*' ? (e) => l(e) * r(e)
        : (e) => {
          const d = r(e);
          if (d === 0) throw new Error(`Pembagian dengan nol di "${src}"`);
          return op === '/' ? l(e) / d : l(e) % d;
        };
    }
    return left;
  }
  function additive() {
    let left = term();
    while (peek() && (peek().v === '+' || peek().v === '-')) {
      const op = take().v; const l = left; const r = term();
      left = op === '+' ? (e) => l(e) + r(e) : (e) => l(e) - r(e);
    }
    return left;
  }
  function comparison() {
    const left = additive();
    const t = peek();
    if (t && t.t === 'op' && ['<', '<=', '>', '>=', '==', '!='].includes(t.v)) {
      p++; const right = additive();
      const ops = {
        '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b,
        '>=': (a, b) => a >= b, '==': (a, b) => a === b, '!=': (a, b) => a !== b,
      };
      const f = ops[t.v];
      return (e) => f(left(e), right(e));
    }
    return left;
  }

  const fn = comparison();
  if (p !== tk.length) throw new Error(`Sisa token tidak terbaca di "${src}"`);
  return fn;
}

export function compile(src) {
  let fn = cache.get(src);
  if (!fn) { fn = parse(src); cache.set(src, fn); }
  return fn;
}

export function evaluate(src, env) {
  return compile(String(src))(env);
}

/** Bulatkan galat floating point (sama dengan solver.clean). */
export function clean(v) {
  if (typeof v === 'boolean') return v;
  const r = Math.round(v * 1e9) / 1e9;
  return Object.is(r, -0) ? 0 : r;
}

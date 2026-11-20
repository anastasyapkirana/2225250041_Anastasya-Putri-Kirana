// Pembangkit soal berparameter dari content/questions/templates.json.
import { clean, evaluate } from './expr.js';
import { render } from './format.js';

const DEFAULT_SEQ = 'a + (k - 1) * b';
const SEQ_TERMS = 8;

/** RNG ber-seed (mulberry32) agar soal bisa dibuat ulang dari seed yang sama. */
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Hitung u1..u8 dari `seq`, lalu variabel `derived` berurutan. */
export function computeVars(tpl, params) {
  const env = { ...params };
  const seq = tpl.seq || DEFAULT_SEQ;
  for (let k = 1; k <= SEQ_TERMS; k++) env[`u${k}`] = clean(evaluate(seq, { ...env, k }));
  for (const [key, expr] of Object.entries(tpl.derived || {})) env[key] = clean(evaluate(expr, env));
  return env;
}

export function sample(tpl, seed) {
  const rng = mulberry32(seed);
  const exclude = tpl.exclude || {};
  const constraints = tpl.constraints || [];
  for (let i = 0; i < 500; i++) {
    const params = {};
    for (const [name, [lo, hi]] of Object.entries(tpl.params)) params[name] = randInt(rng, lo, hi);
    if (Object.entries(exclude).some(([name, banned]) => banned.includes(params[name]))) continue;
    const env = computeVars(tpl, params);
    if (constraints.every((c) => evaluate(c, env))) return env;
  }
  throw new Error('Tidak menemukan parameter yang memenuhi batasan');
}

/** Bentuk objek soal siap tampil dari template + variabel. */
export function instantiate(tid, tpl, env) {
  return {
    tid,
    topic: tpl.topic,
    title: tpl.title,
    env,
    prompt: render(tpl.prompt, env),
    fields: tpl.fields.map((f) => ({
      key: f.key,
      type: f.type || 'number',
      label: render(f.label, env),
      options: f.options || null,
      chip: f.chip || null,
      answer: clean(evaluate(f.answer, env)),
      misconceptions: f.misconceptions || [],
    })),
    hints: tpl.hints.map((h) => render(h, env)),
    solution: tpl.solution.map((s) => render(s, env)),
    check: Boolean(tpl.check),
    visual: resolveVisual(tpl.visual, env),
  };
}

/**
 * Ubah spesifikasi visual template ("leap:a,b,n") menjadi angka ("leap:5,3,10").
 * Argumen berupa nama variabel diambil dari env; angka dibiarkan.
 */
export function resolveVisual(spec, env) {
  if (!spec) return null;
  const [kind, argStr = ''] = spec.split(':');
  if (!argStr) return kind;
  const args = argStr.split(',').map((x) => {
    const name = x.trim();
    if (name in env) return String(env[name]);
    if (Number.isFinite(Number(name))) return name;
    throw new Error(`Variabel visual tidak dikenal: ${name}`);
  });
  return `${kind}:${args.join(',')}`;
}

export function generate(tid, tpl, seed = newSeed()) {
  return instantiate(tid, tpl, sample(tpl, seed));
}

/** Kunci unik soal (untuk folder Ulas Lagi). */
export function questionKey(q) {
  const params = Object.keys(q.env).filter((k) => !/^u\d+$/.test(k)).sort()
    .map((k) => `${k}=${q.env[k]}`).join('&');
  return `${q.tid}?${params}`;
}

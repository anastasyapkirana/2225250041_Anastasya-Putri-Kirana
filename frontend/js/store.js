// Penyimpanan lokal. Semua akses dibungkus try/catch: app tetap jalan
// walau localStorage diblokir (mode privat), hanya progres tidak tersimpan.

const PREFIX = 'lb1:';
const memory = new Map();

function clone(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

export function get(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw != null) return JSON.parse(raw);
  } catch { /* storage tidak tersedia */ }
  return memory.has(key) ? clone(memory.get(key)) : clone(fallback);
}

export function set(key, value) {
  if (value === undefined) {
    memory.delete(key);
    try { localStorage.removeItem(PREFIX + key); } catch { /* abaikan */ }
    return;
  }
  memory.set(key, clone(value));
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* abaikan */ }
}

export function update(key, fallback, fn) {
  const next = fn(get(key, fallback));
  set(key, next);
  return next;
}

export function clearAll() {
  memory.clear();
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
  } catch { /* abaikan */ }
}

// ------------------------------------------------------------ domain

export const getProfile = () => get('profile', null);
export const setProfile = (p) => set('profile', p);

export const getSettings = () => get('settings', { fontScale: 'normal', sound: false });
export const setSettings = (s) => set('settings', s);

export function getModuleProgress(mid) {
  return get('progress', {})[mid] || { step: 0, maxStep: 0, done: false, stars: 0, quizScore: null, practice: null };
}

export function saveModuleProgress(mid, patch) {
  return update('progress', {}, (all) => {
    const cur = all[mid] || { step: 0, maxStep: 0, done: false, stars: 0, quizScore: null, practice: null };
    all[mid] = { ...cur, ...patch, lastOpened: new Date().toISOString() };
    return all;
  })[mid];
}

export const allProgress = () => get('progress', {});

export function getStats() {
  return get('stats', { correct: 0, answered: 0, hints: 0 });
}

export function bumpStats(patch) {
  return update('stats', { correct: 0, answered: 0, hints: 0 }, (s) => {
    for (const [k, v] of Object.entries(patch)) s[k] = (s[k] || 0) + v;
    return s;
  });
}

// Kumpulan soal: confused (salah karena miskonsepsi), hard (salah 2x / semua petunjuk),
// flagged (soal tersimpan lewat bookmark). "mistakes" = gabungan confused + hard.
export const FOLDERS = {
  confused: { title: 'Soal yang salah' },
  hard: { title: 'Soal yang salah' },
  mistakes: { title: 'Perbaiki soal yang salah' },
  flagged: { title: 'Soal tersimpan' },
};

// ------------------------------------------------------------ riwayat belajar (lokal)
const HISTORY_MAX = 600;

/** Catat hasil satu soal: { source, tid, topic, firstTry, solved, attempts, hintLevel, misconception } */
export function pushHistory(entry) {
  update('history', [], (h) => {
    h.push({ ...entry, ts: new Date().toISOString() });
    return h.length > HISTORY_MAX ? h.slice(-HISTORY_MAX) : h;
  });
}
export const getHistory = () => get('history', []);

/** Catat hasil kuis: { kind: 'timed'|'module'|'challenge'|'bank', id, score, total, seconds } */
export function pushQuizHistory(entry) {
  update('quizHistory', [], (h) => {
    h.push({ ...entry, ts: new Date().toISOString() });
    return h.slice(-100);
  });
}
export const getQuizHistory = () => get('quizHistory', []);

export const getBank = () => get('bank', {});
export function saveBankResult(level, score, total) {
  return update('bank', {}, (b) => {
    const cur = b[level] || { best: 0, total, plays: 0 };
    b[level] = { best: Math.max(cur.best, score), total, plays: cur.plays + 1, last: score };
    return b;
  });
}

export function getReview() {
  return get('review', { confused: {}, hard: {}, flagged: {} });
}

export function addReview(folder, key, item) {
  update('review', { confused: {}, hard: {}, flagged: {} }, (r) => {
    r[folder] = r[folder] || {};
    r[folder][key] = { ...item, addedAt: new Date().toISOString() };
    return r;
  });
}

export function removeReview(folder, key) {
  update('review', { confused: {}, hard: {}, flagged: {} }, (r) => {
    if (r[folder]) delete r[folder][key];
    return r;
  });
}

export function isFlagged(key) {
  return Boolean(getReview().flagged[key]);
}

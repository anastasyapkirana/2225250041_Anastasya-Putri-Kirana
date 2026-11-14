// Antrean data penelitian (offline-first). Event disimpan di "outbox" lalu
// dikirim ke server saat online. Jika server tidak ada, app tetap berjalan.
import * as store from './store.js';

export const APP_VERSION = '1.1.0';
const OUTBOX_MAX = 3000;
const BATCH = 200;
let serverOk = null; // null = belum dicek
let syncing = false;

function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function enqueue(kind, body) {
  store.update('outbox', [], (box) => {
    box.push({ kind, body });
    return box.length > OUTBOX_MAX ? box.slice(-OUTBOX_MAX) : box;
  });
}

export function logEvent(type, { module_id = null, item_id = null, payload = {} } = {}) {
  const profile = store.getProfile();
  if (!profile) return;
  enqueue('event', {
    client_id: uuid(),
    anon_id: profile.anonId,
    type,
    module_id,
    item_id: item_id ? String(item_id).slice(0, 64) : null,
    payload,
    client_ts: new Date().toISOString(),
  });
}

export function queueSurvey(kind, module_id, answers) {
  const profile = store.getProfile();
  if (!profile) return;
  enqueue('survey', {
    client_id: uuid(), anon_id: profile.anonId, kind, module_id, answers, client_ts: new Date().toISOString(),
  });
}

export function queueParticipant(profile) {
  enqueue('participant', { anon_id: profile.anonId, class_code: profile.classCode, app_version: APP_VERSION });
}

export const outboxSize = () => store.get('outbox', []).length;
export const serverStatus = () => serverOk;

async function post(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function checkServer() {
  try {
    const res = await fetch('api/health', { cache: 'no-store' });
    serverOk = res.ok && (res.headers.get('content-type') || '').includes('json');
  } catch {
    serverOk = false;
  }
  return serverOk;
}

/** Kirim isi outbox. Aman dipanggil berkali-kali. */
export async function sync() {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  try {
    if (!serverOk && !(await checkServer())) return;
    let box = store.get('outbox', []);
    while (box.length) {
      const head = box[0];
      let taken;
      if (head.kind === 'event') {
        taken = [];
        while (taken.length < BATCH && box[taken.length]?.kind === 'event') taken.push(box[taken.length]);
        await post('api/events', { events: taken.map((x) => x.body) });
      } else {
        taken = [head];
        await post(head.kind === 'survey' ? 'api/surveys' : 'api/participants', head.body);
      }
      box = store.update('outbox', [], (cur) => cur.slice(taken.length));
    }
  } catch (err) {
    // 422 = data rusak: buang item terdepan agar antrean tidak macet.
    if (err.status === 422) store.update('outbox', [], (cur) => cur.slice(1));
    else serverOk = null;
  } finally {
    syncing = false;
  }
}

export function startAutoSync() {
  window.addEventListener('online', () => sync());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sync(); });
  setInterval(() => sync(), 60_000);
  sync();
}

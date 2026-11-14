// Memuat konten JSON dari folder content/. Service worker menyimpannya
// untuk dipakai offline.

const cache = new Map();

async function fetchJson(path) {
  if (!cache.has(path)) {
    // content/ (server FastAPI) atau ../content/ (frontend dibuka lewat Live Server dari folder proyek)
    const p = fetch(`content/${path}`)
      .then((res) => (res.ok ? res : fetch(`../content/${path}`)))
      .then((res) => {
        if (!res.ok) throw new Error(`Gagal memuat ${path} (${res.status})`);
        return res.json();
      });
    cache.set(path, p);
    p.catch(() => cache.delete(path));
  }
  return cache.get(path);
}

export const manifest = () => fetchJson('manifest.json');

export async function moduleMeta(id) {
  const m = await manifest();
  return m.modules.find((x) => x.id === id) || null;
}

export async function loadModule(id) {
  const meta = await moduleMeta(id);
  if (!meta) throw new Error(`Modul ${id} tidak ditemukan`);
  return fetchJson(meta.file);
}

export async function templates() { return fetchJson((await manifest()).templates); }
export async function misconceptions() { return fetchJson((await manifest()).misconceptions); }
export async function challenge() { return fetchJson((await manifest()).challenge); }
export async function tests() { return fetchJson((await manifest()).tests); }
export async function surveys() { return fetchJson((await manifest()).surveys); }

/** Muat semua file agar tersimpan di cache service worker (siap offline). */
export async function preloadAll() {
  const m = await manifest();
  await Promise.allSettled([
    ...m.modules.map((x) => fetchJson(x.file)),
    templates(), misconceptions(), challenge(), tests(), surveys(),
  ]);
}

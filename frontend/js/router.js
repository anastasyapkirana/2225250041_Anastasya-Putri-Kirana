// Hash router sederhana: #/m/m3 → { view: lesson, params: { id: 'm3' } }

const routes = [];

export function route(pattern, loader, { focus = false, tab = null, guest = false } = {}) {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
  routes.push({ re, keys, loader, focus, tab, guest });
}

export function match(path) {
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) return { ...r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

export function currentPath() {
  return (location.hash.replace(/^#/, '') || '/').replace(/\/+$/, '') || '/';
}

export function go(path) {
  if (currentPath() === path) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = path;
}

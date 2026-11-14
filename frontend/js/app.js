// Titik masuk aplikasi: router, navigasi bawah, PWA (install + service worker).
import { h, icon } from './ui.js';
import { route, match, currentPath, go } from './router.js';
import * as store from './store.js';
import { logEvent, startAutoSync, APP_VERSION } from './api.js';
import { initPwa, isStandalone } from './pwa.js';
import { openFormulaSheet } from './components/formula.js';

window.__APP_VERSION__ = APP_VERSION;

// ------------------------------------------------------------ rute
route('/welcome', () => import('./views/welcome.js'), { focus: true, guest: true });
route('/join', () => import('./views/join.js'), { focus: true, guest: true });
route('/', () => import('./views/home.js'), { tab: 'home' });
route('/modules', () => import('./views/modules.js'), { tab: 'modules' });
route('/m/:id', () => import('./views/lesson.js'), { focus: true });
route('/practice', () => import('./views/practice.js'), { tab: 'practice' });
route('/formula', () => import('./views/formula.js'), { tab: 'formula' });
route('/profile', () => import('./views/profile.js'), { tab: 'profile' });
route('/challenge', () => import('./views/challenge.js'), { focus: true });
route('/review/:folder', () => import('./views/review.js'), { focus: true });
route('/survey/:kind', () => import('./views/survey.js'), { focus: true });
route('/test/:form', () => import('./views/test.js'), { focus: true });
route('/kuis', () => import('./views/kuis.js'), { focus: true });
route('/bank', () => import('./views/bank.js'), { tab: 'practice' });
route('/bank/:level', () => import('./views/bank.js'), { focus: true });
route('/saved', () => import('./views/saved.js'), { tab: 'practice' });
route('/saved/:mode', () => import('./views/saved.js'), { focus: true });
route('/riwayat', () => import('./views/history.js'), { tab: 'practice' });
route('/harian', () => import('./views/daily.js'), { focus: true });
route('/game/:id', () => import('./views/games.js'), { focus: true });

// ------------------------------------------------------------ pengaturan tampilan
function applySettings() {
  document.documentElement.dataset.font = store.getSettings().fontScale;
}
window.addEventListener('settingschange', applySettings);

// ------------------------------------------------------------ kerangka layar
const view = document.getElementById('view');
const nav = document.getElementById('bottom-nav');

const TABS = [
  { id: 'home', label: 'Beranda', icon: 'home', path: '/' },
  { id: 'modules', label: 'Materi', icon: 'book', path: '/modules' },
  { id: 'practice', label: 'Latihan', icon: 'pencil', path: '/practice', fab: true },
  { id: 'formula', label: 'Rumus', icon: 'formula', path: '/formula' },
  { id: 'profile', label: 'Profil', icon: 'user', path: '/profile' },
];

function buildNav() {
  nav.replaceChildren(...TABS.map((t) => h('a', {
    href: `#${t.path}`, class: `nav-item ${t.fab ? 'nav-fab' : ''}`, dataset: { tab: t.id }, 'aria-label': t.label,
  }, h('span', { class: 'nav-icon' }, icon(t.icon)), h('span', { class: 'nav-label' }, t.label))));
}

let cleanup = null;
let renderToken = 0;

async function render() {
  const path = currentPath();
  const r = match(path);
  if (!r) { go('/'); return; }
  const profile = store.getProfile();
  if (!profile && !r.guest) { go('/welcome'); return; }

  const token = ++renderToken;
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  document.body.classList.toggle('is-focus', r.focus);
  nav.querySelectorAll('.nav-item').forEach((a) => {
    const on = a.dataset.tab === r.tab;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  view.setAttribute('aria-busy', 'true');
  try {
    const mod = await r.loader();
    if (token !== renderToken) return;
    const root = h('div', { class: 'page' });
    view.replaceChildren(root);
    window.scrollTo(0, 0);
    cleanup = await mod.render(root, r.params);
  } catch (err) {
    console.error(err);
    view.replaceChildren(h('div', { class: 'page' }, h('div', { class: 'card empty' },
      h('h2', {}, 'Halaman gagal dimuat'),
      h('p', {}, navigator.onLine ? 'Coba muat ulang halaman.' : 'Kamu sedang offline. Buka sekali saat online agar materi tersimpan.'),
      h('button', { class: 'btn btn-primary', type: 'button', onClick: () => location.reload() }, 'Muat ulang'))));
  } finally {
    view.removeAttribute('aria-busy');
    view.focus({ preventScroll: true });
  }
}

// Tombol 📘 global (dipakai di header halaman fokus)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open-formula]');
  if (btn) openFormulaSheet(currentPath());
});

applySettings();
buildNav();
window.addEventListener('hashchange', render);
render();
initPwa();
startAutoSync();
if (store.getProfile()) logEvent('app_open', { payload: { standalone: isStandalone(), v: APP_VERSION } });

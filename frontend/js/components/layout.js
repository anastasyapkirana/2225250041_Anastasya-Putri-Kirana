// Header untuk halaman fokus (tanpa navigasi bawah) dan judul halaman tab.
import { h, icon } from '../ui.js';
import { go } from '../router.js';

export function focusHeader({ title = '', back = '/', closeLabel = 'Tutup', extra = null, formula = true } = {}) {
  return h('header', { class: 'focus-head' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': closeLabel, title: closeLabel, onClick: () => go(back) }, icon('x')),
    h('div', { class: 'focus-title' }, title),
    extra,
    formula ? h('button', { type: 'button', class: 'icon-btn icon-btn-formula', 'aria-label': 'Buka Kartu Rumus', title: 'Kartu Rumus', 'data-open-formula': '' }, icon('formula')) : null);
}

export function pageHeader(title, subtitle = '', action = null) {
  return h('header', { class: 'page-head' },
    h('div', {}, h('h1', {}, title), subtitle ? h('p', { class: 'muted' }, subtitle) : null),
    action);
}

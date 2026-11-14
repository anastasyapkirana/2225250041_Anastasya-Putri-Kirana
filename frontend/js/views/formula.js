import { h } from '../ui.js';
import { pageHeader } from '../components/layout.js';
import { formulaCard } from '../components/formula.js';
import { renderVisual } from '../components/viz.js';

export function render(root) {
  root.append(
    pageHeader('Kartu Rumus', 'Buka kapan saja saat lupa.'),
    h('section', { class: 'card' }, formulaCard()),
    h('section', { class: 'card' }, h('h2', {}, 'Mengapa (n − 1)?'), renderVisual('posts:4'),
      h('p', { class: 'muted' }, 'U₁ sudah ada di awal. Lompatan baru dimulai setelah U₁.')));
}

import { h, icon, stars } from '../ui.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { pageHeader } from '../components/layout.js';

export async function render(root) {
  const man = await content.manifest();
  const progress = store.allProgress();
  const firstOpen = man.modules.find((m) => !progress[m.id]?.done);

  const list = h('ol', { class: 'module-list' }, man.modules.map((m) => {
    const p = progress[m.id] || {};
    const status = p.done ? 'Selesai' : p.step > 0 ? 'Sedang dipelajari' : m.id === firstOpen?.id ? 'Mulai di sini' : '';
    return h('li', {},
      h('a', { href: `#/m/${m.id}`, class: `card module-card ${p.done ? 'is-done' : ''} ${m.id === firstOpen?.id ? 'is-next' : ''}` },
        h('span', { class: 'module-num' }, p.done ? icon('check') : String(m.order)),
        h('div', { class: 'module-info' },
          h('h2', {}, m.title),
          h('p', { class: 'muted' }, `${m.subtitle} · ± ${m.minutes} menit`),
          h('div', { class: 'module-meta' }, stars(p.stars || 0), status ? h('span', { class: 'pill' }, status) : null)),
        h('span', { class: 'chev' }, icon('chevron'))));
  }));

  root.append(pageHeader('Peta Belajar', '6 modul pendek. Ikuti urutannya, ya.'), list);
}

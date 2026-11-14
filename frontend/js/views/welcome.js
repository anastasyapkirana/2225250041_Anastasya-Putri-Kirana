import { h, html, button, icon } from '../ui.js';
import { go } from '../router.js';
import { renderVisual } from '../components/viz.js';

const SLIDES = [
  { title: 'Belajar sedikit demi sedikit', text: 'Satu konsep per halaman. Singkat, lalu langsung contoh.', visual: 'diff:3,7,11,15' },
  { title: 'Bingung? Ada petunjuk', text: 'Tekan 💡 untuk petunjuk kecil. Rumus selalu ada di tombol 📘.', visual: null, formula: true },
  { title: 'Matematika di sekitar kita', text: 'Latih soal cerita: kursi, tabungan, parkir, dan lainnya.', visual: 'seats:6,2,3' },
];

export function render(root) {
  let i = 0;
  const stage = h('div', { class: 'welcome-stage' });
  const dots = h('div', { class: 'dots dots-center', 'aria-hidden': 'true' }, SLIDES.map(() => h('span', { class: 'dot' })));
  const next = button('Lanjut', { onClick: () => (i < SLIDES.length - 1 ? show(i + 1) : go('/join')) });
  const skip = h('button', { type: 'button', class: 'link-btn', onClick: () => go('/join') }, 'Lewati');

  function show(k) {
    i = k;
    const s = SLIDES[k];
    stage.replaceChildren(h('div', { class: 'welcome-slide' },
      h('div', { class: 'welcome-art' }, s.formula
        ? html('div', 'formula big', 'U<sub>n</sub> = <span class="chip chip-a">a</span> + (<span class="chip chip-n">n</span> − 1)<span class="chip chip-b">b</span>')
        : renderVisual(s.visual)),
      h('h2', {}, s.title),
      h('p', {}, s.text)));
    [...dots.children].forEach((d, j) => { d.className = `dot ${j === k ? 'is-current' : ''}`; });
    next.querySelector('span').textContent = k === SLIDES.length - 1 ? 'Mulai' : 'Lanjut';
  }

  root.classList.add('welcome');
  root.append(
    h('div', { class: 'brand' }, h('img', { class: 'brand-mark', src: 'assets/icons/icon-192.png', alt: '', width: '48', height: '48' }), h('span', { class: 'brand-name' }, 'Metika')),
    h('p', { class: 'brand-tag' }, 'Barisan Aritmetika · Kelas VIII'),
    stage, dots,
    h('div', { class: 'welcome-actions' }, next, skip));
  show(0);
}

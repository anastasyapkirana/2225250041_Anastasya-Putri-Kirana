// Ulas Lagi: soal dari folder dibangun ulang dengan angka yang sama.
import { h, icon, button } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import { focusHeader } from '../components/layout.js';
import { practiceSession, reviewItems } from '../components/question.js';

export async function render(root, { folder }) {
  const info = store.FOLDERS[folder];
  if (!info) { go('/'); return; }
  const items = (await reviewItems(folder)).slice(0, 10);
  const area = h('div', {});
  root.append(focusHeader({ title: info.title, back: '/' }), area);
  if (!items.length) {
    area.append(h('div', { class: 'card empty' }, icon('sparkle', { filled: true, size: 36 }),
      h('h2', {}, 'Folder ini kosong'),
      h('p', { class: 'muted' }, folder === 'flagged' ? 'Tekan 🚩 di soal latihan untuk menyimpannya di sini.' : 'Hebat! Belum ada soal yang perlu diulas.'),
      button('Ke Latihan', { onClick: () => go('/practice') })));
    return;
  }
  area.append(h('p', { class: 'muted' }, folder === 'flagged'
    ? 'Soal yang kamu tandai.'
    : 'Jawab benar tanpa petunjuk terakhir agar soal keluar dari folder.'));
  const box = h('div', {});
  area.append(box);
  practiceSession(box, {
    items, reviewFolder: folder === 'flagged' ? null : folder,
    onComplete: () => box.append(h('div', { class: 'finish-actions' }, button('Ke Beranda', { onClick: () => go('/') }))),
  });
}

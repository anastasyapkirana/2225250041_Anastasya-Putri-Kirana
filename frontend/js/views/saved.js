// Soal tersimpan: koleksi pribadi dari tombol bookmark. Bisa dikerjakan ulang & dilihat pembahasannya.
import { h, html, button, icon, toast } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import { pageHeader, focusHeader } from '../components/layout.js';
import { practiceSession, reviewItems } from '../components/question.js';
import { renderVisual } from '../components/viz.js';

export async function render(root, { mode } = {}) {
  const items = await reviewItems('flagged');
  if (mode === 'kerjakan') {
    const box = h('div', {});
    root.append(focusHeader({ title: 'Kerjakan soal tersimpan', back: '/saved' }), box);
    const only = sessionStorageGet('lb-saved-one');
    const list = only ? items.filter((q) => q.reviewKey === only) : items;
    practiceSession(box, {
      items: list, source: 'saved',
      onComplete: () => box.append(h('div', { class: 'finish-actions' }, button('Kembali ke Soal tersimpan', { onClick: () => go('/saved') }))),
    });
    return;
  }

  root.append(pageHeader('Soal tersimpan'));
  if (!items.length) {
    root.append(h('div', { class: 'card empty' }, icon('bookmark', { size: 36 }),
      h('h2', {}, 'Belum ada soal tersimpan'),
      button('Buka Bank Soal', { onClick: () => go('/bank') })));
    return;
  }

  root.append(button(`Kerjakan semua (${items.length} soal)`, { iconName: 'pencil', onClick: () => { sessionStorageSet('lb-saved-one', ''); go('/saved/kerjakan'); } }));
  const list = h('ol', { class: 'saved-list' });
  items.forEach((q, i) => {
    const sol = h('div', { class: 'saved-solution hidden' },
      renderVisual(q.visual),
      html('ol', 'solution', q.solution.map((s) => `<li>${s}</li>`).join('')),
      ...q.fields.filter((f) => f.type === 'choice').map((f) => html('p', '', `Jawaban: <b>${f.options[f.answer]}</b>`)));
    const toggleBtn = button('Lihat pembahasan', { kind: 'ghost', cls: 'btn-sm', iconName: 'eye', onClick: () => {
      const hidden = sol.classList.toggle('hidden');
      toggleBtn.querySelector('span:last-child').textContent = hidden ? 'Lihat pembahasan' : 'Tutup pembahasan';
    } });
    const card = h('li', { class: 'card saved-card' },
      h('div', { class: 'q-head' }, h('span', { class: 'q-count' }, `${i + 1}. ${q.title}`),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Hapus dari Soal tersimpan', title: 'Hapus', onClick: () => {
          store.removeReview('flagged', q.reviewKey);
          card.remove();
          toast('Soal dihapus');
          if (!list.children.length) go('/saved');
        } }, icon('trash'))),
      html('div', 'q-prompt', q.prompt),
      h('div', { class: 'q-tools' },
        button('Kerjakan ulang', { kind: 'secondary', cls: 'btn-sm', iconName: 'refresh', onClick: () => { sessionStorageSet('lb-saved-one', q.reviewKey); go('/saved/kerjakan'); } }),
        toggleBtn),
      sol);
    list.append(card);
  });
  root.append(list);
}

function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* abaikan */ } }

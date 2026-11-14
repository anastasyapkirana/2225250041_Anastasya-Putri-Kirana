import { h, button, icon, feedback } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import { anonId, guestId, normalizeClassCode } from '../engine/anon.js';
import { queueParticipant, logEvent, sync } from '../api.js';

export function render(root) {
  const code = h('input', { id: 'class-code', class: 'text-input', autocomplete: 'off', maxlength: '20', placeholder: 'contoh: 8A-SMPN1', autocapitalize: 'characters' });
  const no = h('input', { id: 'student-no', class: 'text-input', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', placeholder: 'contoh: 12' });
  const fb = h('div', {});

  function save(profile) {
    store.setProfile(profile);
    queueParticipant(profile);
    logEvent('app_open', { payload: { first: true } });
    sync();
    go('/');
  }

  const form = h('form', {
    class: 'card join-card',
    onSubmit: (e) => {
      e.preventDefault();
      const c = normalizeClassCode(code.value);
      const n = no.value.trim();
      if (!c || !/^\d{1,3}$/.test(n)) {
        fb.replaceChildren(feedback('hint', 'Isi kode kelas dan nomor absen (angka).'));
        return;
      }
      save({ anonId: anonId(c, n), classCode: c, studentNo: n, joinedAt: new Date().toISOString(), guest: false });
    },
  },
  h('label', { for: 'class-code', class: 'field-label' }, 'Kode kelas'),
  code,
  h('label', { for: 'student-no', class: 'field-label' }, 'Nomor absen'),
  no,
  fb,
  button('Masuk', { type: 'submit' }),
  h('p', { class: 'muted small' }, icon('check', { size: 16 }), ' Tanpa nama. Datamu disimpan secara anonim.'));

  root.classList.add('join');
  root.append(
    h('h1', {}, 'Halo! 👋'),
    h('p', { class: 'muted' }, 'Masukkan kode dari gurumu.'),
    form,
    h('button', {
      type: 'button', class: 'link-btn',
      onClick: () => save({ anonId: guestId(), classCode: 'TAMU', studentNo: '-', joinedAt: new Date().toISOString(), guest: true }),
    }, 'Coba tanpa kode (tamu)'));
  code.focus();
}

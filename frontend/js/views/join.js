import { h, button, icon, feedback } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import { anonId, guestId, normalizeName } from '../engine/anon.js';
import { queueParticipant, logEvent, sync } from '../api.js';

export function render(root) {
  const code = h('input', { id: 'student-name', class: 'text-input', autocomplete: 'off', maxlength: '40', placeholder: 'contoh: Tasya Kirana', autocapitalize: 'words' });
  const no = h('input', { id: 'student-no', class: 'text-input', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', placeholder: 'contoh: 10' });
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
      const c = normalizeName(code.value);
      const n = no.value.trim();
      if (!c || !/^\d{1,3}$/.test(n)) {
        fb.replaceChildren(feedback('hint', 'Isi nama dan nomor absen (angka).'));
        return;
      }
      save({ anonId: anonId(c, n), name: c, classCode: 'SISWA', studentNo: n, joinedAt: new Date().toISOString(), guest: false });
    },
  },
  h('label', { for: 'student-name', class: 'field-label' }, 'Nama'),
  code,
  h('label', { for: 'student-no', class: 'field-label' }, 'Nomor absen'),
  no,
  fb,
  button('Masuk', { type: 'submit' }),
  h('p', { class: 'muted small' }, icon('check', { size: 16 }), ' Namamu hanya tersimpan di perangkat ini.'));

  root.classList.add('join');
  root.append(
    h('h1', {}, 'Halo! 👋'),
    h('p', { class: 'muted' }, 'Isi nama dan nomor absenmu.'),
    form,
    h('button', {
      type: 'button', class: 'link-btn',
      onClick: () => save({ anonId: guestId(), classCode: 'TAMU', studentNo: '-', joinedAt: new Date().toISOString(), guest: true }),
    }, 'Masuk sebagai tamu'));
  code.focus();
}

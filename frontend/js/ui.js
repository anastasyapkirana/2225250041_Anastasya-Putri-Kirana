// Helper DOM kecil + komponen UI yang dipakai ulang.
import * as store from './store.js';

/** Buat elemen: h('div', {class:'x', onClick}, child...) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const html = (tag, cls, markup) => h(tag, { class: cls, html: markup });

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ------------------------------------------------------------ ikon (garis 2px)

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  formula: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  sparkle: '<path d="M12 2c.6 5 2 7.4 10 10-8 2.6-9.4 5-10 10-.6-5-2-7.4-10-10 8-2.6 9.4-5 10-10z"/>',
  cards: '<rect x="3" y="6" width="14" height="15" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 2h6v4H9z"/><path d="M9 12h6M9 16h4"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.9-3"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3"/><path d="M20 20v-4h-4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bookmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  gamepad: '<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 10v4M5 12h4M15.5 11h.01M18 13h.01"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
};

export function icon(name, { filled = false, size = 24, label = null } = {}) {
  const fill = filled ? 'currentColor' : 'none';
  const aria = label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"';
  return h('span', {
    class: 'icon',
    html: `<svg ${aria} width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`,
  });
}

// ------------------------------------------------------------ tombol

export function button(label, { kind = 'primary', onClick, iconName, disabled, cls = '', type = 'button', aria } = {}) {
  return h('button', { type, class: `btn btn-${kind} ${cls}`.trim(), onClick, disabled, 'aria-label': aria },
    iconName ? icon(iconName) : null, label ? h('span', {}, label) : null);
}

export function iconButton(name, label, onClick, cls = '') {
  return h('button', { type: 'button', class: `icon-btn ${cls}`.trim(), 'aria-label': label, title: label, onClick }, icon(name));
}

// ------------------------------------------------------------ bottom sheet

let openSheets = 0;

export function openSheet({ title, content, onClose } = {}) {
  const prevFocus = document.activeElement;
  const panel = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Panel', tabindex: '-1' });
  const backdrop = h('div', { class: 'sheet-backdrop' });
  function close() {
    if (!panel.isConnected) return;
    backdrop.classList.add('closing');
    panel.classList.add('closing');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { backdrop.remove(); panel.remove(); }, 180);
    openSheets--;
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    if (onClose) onClose();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  panel.append(
    h('div', { class: 'sheet-handle', 'aria-hidden': 'true' }),
    h('div', { class: 'sheet-head' }, h('h2', {}, title || ''), iconButton('x', 'Tutup', close)),
    h('div', { class: 'sheet-body' }, content),
  );
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.append(backdrop, panel);
  openSheets++;
  requestAnimationFrame(() => panel.focus());
  return { close, panel };
}

// ------------------------------------------------------------ toast

export function toast(message, ms = 2200) {
  let host = document.querySelector('.toast-host');
  if (!host) { host = h('div', { class: 'toast-host', 'aria-live': 'polite' }); document.body.append(host); }
  const t = h('div', { class: 'toast' }, message);
  host.append(t);
  setTimeout(() => { t.classList.add('closing'); setTimeout(() => t.remove(), 200); }, ms);
}

// ------------------------------------------------------------ suara (opsional, mati default)

let audioCtx = null;
export function sound(kind) {
  if (!store.getSettings().sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'correct' ? [660, 880] : [300, 220];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = f;
      o.type = 'sine';
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.12 + 0.18);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + i * 0.12);
      o.stop(audioCtx.currentTime + i * 0.12 + 0.2);
    });
  } catch { /* audio tidak tersedia */ }
}

// ------------------------------------------------------------ input angka

/** Input angka dengan tombol ± (keyboard angka Android sering tanpa minus). */
export function numberInput({ label, chip = null, id, onEnter, value = '' } = {}) {
  const input = h('input', {
    id, class: 'num-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done',
    'aria-label': label ? label.replace(/<[^>]+>/g, '') : 'jawaban',
  });
  input.value = value;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } });
  const toggle = h('button', {
    type: 'button', class: 'pm-btn', 'aria-label': 'Ubah tanda plus/minus',
    onClick: () => {
      const v = input.value.trim();
      input.value = v.startsWith('-') || v.startsWith('−') ? v.replace(/^[-−]/, '') : `-${v}`;
      input.focus();
    },
  }, '±');
  const labelEl = label ? h('label', { class: `num-label ${chip ? `chip-label chip-${chip}` : ''}`, for: id, html: label }) : null;
  const wrap = h('div', { class: 'num-field' }, labelEl, h('div', { class: 'num-row' }, input, toggle));
  return { wrap, input };
}

/** Grup pilihan (radio sebagai tombol besar). */
export function choiceList(options, { onPick, name = 'pilihan' } = {}) {
  const list = h('div', { class: 'choices', role: 'radiogroup', 'aria-label': name });
  const buttons = options.map((opt, i) => {
    const b = h('button', {
      type: 'button', class: 'choice', role: 'radio', 'aria-checked': 'false',
      html: `<span class="choice-key">${String.fromCharCode(65 + i)}</span><span class="choice-text">${opt}</span>`,
      onClick: () => onPick && onPick(i, b),
    });
    list.append(b);
    return b;
  });
  return { list, buttons };
}

export function markChoice(buttons, idx, state) {
  buttons.forEach((b, i) => {
    b.setAttribute('aria-checked', String(i === idx));
    if (i === idx) { b.classList.remove('is-correct', 'is-wrong'); b.classList.add(state === 'correct' ? 'is-correct' : 'is-wrong'); }
  });
}

// ------------------------------------------------------------ cincin progres & bintang

export function progressRing(value, max, { size = 148, label = '', caption = '' } = {}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const frac = max ? Math.min(1, value / max) : 0;
  return h('div', {
    class: 'ring', role: 'img', 'aria-label': `${value} dari ${max} ${caption}`,
    html: `<svg width="${size}" height="${size}" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r="${r}" class="ring-track"/>
      <circle cx="64" cy="64" r="${r}" class="ring-bar" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 64 64)"/>
    </svg>
    <div class="ring-center"><span class="ring-label">${label}</span><span class="ring-value">${value}<small>/${max}</small></span><span class="ring-caption">${caption}</span></div>`,
  });
}

export function stars(n, max = 3) {
  return h('span', { class: 'stars', 'aria-label': `${n} dari ${max} bintang` },
    Array.from({ length: max }, (_, i) => icon('star', { filled: i < n, size: 18 })));
}

export function segmentBar(total, current, done = -1) {
  const bar = h('div', { class: 'segments', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(total), 'aria-valuenow': String(current + 1) });
  for (let i = 0; i < total; i++) {
    bar.append(h('span', { class: `seg ${i < current || i <= done ? 'is-done' : ''} ${i === current ? 'is-current' : ''}` }));
  }
  return bar;
}

export function feedback(kind, title, bodyHtml = '') {
  return h('div', { class: `feedback feedback-${kind}`, role: 'status' },
    h('div', { class: 'feedback-title' }, icon(kind === 'correct' ? 'check' : kind === 'hint' ? 'bulb' : 'x'), h('span', {}, title)),
    bodyHtml ? html('div', 'feedback-body', bodyHtml) : null);
}

export function contextBadge(text) {
  return h('span', { class: 'badge' }, text);
}

/** Konfirmasi di dalam aplikasi (pengganti confirm() bawaan browser). */
export function confirmSheet(message, { okLabel = 'Ya, lanjutkan', cancelLabel = 'Batal', title = 'Yakin?' } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const done = (v) => { if (!answered) { answered = true; resolve(v); } sheet.close(); };
    const body = h('div', { class: 'confirm-body' },
      h('p', {}, message),
      h('div', { class: 'finish-actions' },
        button(okLabel, { kind: 'primary', onClick: () => done(true) }),
        button(cancelLabel, { kind: 'secondary', onClick: () => done(false) })));
    const sheet = openSheet({ title, content: body, onClose: () => { if (!answered) { answered = true; resolve(false); } } });
  });
}

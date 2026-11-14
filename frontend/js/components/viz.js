// Visual pola bilangan. Spesifikasi berupa string "jenis:arg1,arg2,...".
// Label diletakkan langsung pada gambar (prinsip split-attention).
import { h, html, button } from '../ui.js';
import { fmt } from '../engine/format.js';

const nums = (s) => s.split(',').map(Number);
const sub = (k) => `U<sub>${k}</sub>`;
const signed = (d) => (d >= 0 ? `+${fmt(d)}` : fmt(d));

/** Gelembung suku dengan label U1, U2, … */
function terms(list) {
  const row = h('div', { class: 'viz-terms', role: 'img', 'aria-label': `Barisan ${list.join(', ')}` });
  list.forEach((v, i) => row.append(html('div', 'term', `<span class="term-val">${fmt(v)}</span><span class="term-idx">${sub(i + 1)}</span>`)));
  row.append(html('div', 'term term-more', '<span class="term-val">…</span><span class="term-idx">&nbsp;</span>'));
  return row;
}

/** Suku dengan selisih di antaranya. */
function diff(list) {
  const row = h('div', { class: 'viz-diff', role: 'img', 'aria-label': `Barisan ${list.join(', ')} dengan selisihnya` });
  list.forEach((v, i) => {
    if (i > 0) {
      const d = list[i] - list[i - 1];
      row.append(html('div', 'diff-pill', `<svg viewBox="0 0 40 14" aria-hidden="true"><path d="M2 12 Q20 -4 38 12" /></svg><span>${signed(d)}</span>`));
    }
    row.append(html('div', 'term', `<span class="term-val">${fmt(v)}</span><span class="term-idx">${sub(i + 1)}</span>`));
  });
  return row;
}

/** Garis bilangan dengan busur lompatan +b. */
function jumps(a, b, count) {
  const W = 320; const pad = 24; const step = (W - 2 * pad) / (count - 1);
  let svg = `<svg viewBox="0 0 ${W} 100" class="viz-svg" role="img" aria-label="Lompatan ${signed(b)} dari ${a}">`;
  svg += `<line x1="8" y1="70" x2="${W - 8}" y2="70" class="nl-axis"/>`;
  for (let i = 0; i < count; i++) {
    const x = pad + i * step;
    if (i > 0) {
      const x0 = x - step;
      svg += `<path d="M${x0 + 4} 62 Q${(x0 + x) / 2} ${22} ${x - 4} 62" class="nl-arc"/>`;
      svg += `<text x="${(x0 + x) / 2}" y="34" class="nl-jump">${signed(b)}</text>`;
    }
    svg += `<circle cx="${x}" cy="70" r="${i === 0 ? 9 : 7}" class="${i === 0 ? 'nl-dot-a' : 'nl-dot'}"/>`;
    svg += `<text x="${x}" y="94" class="nl-val">${fmt(a + i * b)}</text>`;
  }
  return html('div', 'viz', `${svg}</svg>`);
}

/** Susunan ubin: kolom berisi start, start+step, … dan satu tanda tanya. */
function tiles(start, step, count) {
  const S = 14; const gap = 2; const colW = 2 * S + gap; const space = 26;
  const maxRows = Math.ceil((start + step * count) / 2);
  const H = maxRows * (S + gap) + 30;
  const W = (count + 1) * (colW + space);
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="viz-svg" role="img" aria-label="Susunan ubin ${start}, ${start + step}, … ">`;
  for (let c = 0; c <= count; c++) {
    const n = start + step * c;
    const x0 = c * (colW + space) + space / 2;
    const unknown = c === count;
    for (let t = 0; t < n; t++) {
      const col = t % 2; const row = Math.floor(t / 2);
      const y = H - 26 - (row + 1) * (S + gap);
      svg += `<rect x="${x0 + col * (S + gap)}" y="${y}" width="${S}" height="${S}" rx="3" class="${unknown ? 'tile-unknown' : 'tile'}"/>`;
    }
    svg += `<text x="${x0 + colW / 2}" y="${H - 6}" class="nl-val">${unknown ? '?' : n}</text>`;
  }
  return html('div', 'viz', `${svg}</svg>`);
}

/** Pola segitiga korek api: gambar ke-k punya k segitiga (2k + 1 batang). */
function matches(count) {
  // Segitiga berjajar naik-turun: titik zig-zag bawah/atas.
  const s = 30; const yB = 60; const yT = yB - s * 0.87; const gapFig = 34;
  let x = 12; let svg = '';
  const line = (p, q) => `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="stick"/>`;
  for (let k = 1; k <= count; k++) {
    const pts = Array.from({ length: k + 2 }, (_, i) => [x + (i * s) / 2, i % 2 === 0 ? yB : yT]);
    for (let i = 0; i <= k; i++) svg += line(pts[i], pts[i + 1]); // sisi miring
    for (let i = 0; i + 2 <= k + 1; i++) svg += line(pts[i], pts[i + 2]); // sisi datar atas/bawah
    const w = ((k + 1) * s) / 2;
    svg += `<text x="${x + w / 2}" y="84" class="nl-val">${2 * k + 1} batang</text>`;
    x += w + gapFig;
  }
  return html('div', 'viz', `<svg viewBox="0 0 ${x} 92" class="viz-svg" role="img" aria-label="Pola segitiga korek api 3, 5, 7 batang">${svg}</svg>`);
}

/** Tiang dan lompatan: n suku → n − 1 lompatan. */
function posts(count) {
  const W = 300; const pad = 30; const step = (W - 2 * pad) / (count - 1);
  let svg = `<svg viewBox="0 0 ${W} 110" class="viz-svg" role="img" aria-label="${count} suku dan ${count - 1} lompatan">`;
  for (let i = 0; i < count; i++) {
    const x = pad + i * step;
    if (i > 0) {
      const x0 = x - step;
      svg += `<path d="M${x0 + 6} 52 Q${(x0 + x) / 2} 10 ${x - 6} 52" class="nl-arc"/>`;
      svg += `<text x="${(x0 + x) / 2}" y="26" class="nl-jump">${i}</text>`;
    }
    svg += `<rect x="${x - 7}" y="54" width="14" height="30" rx="4" class="${i === 0 ? 'post-a' : 'post'}"/>`;
    svg += `<text x="${x}" y="102" class="nl-val">U${String.fromCharCode(0x2080 + i + 1)}</text>`;
  }
  svg += '</svg>';
  return html('div', 'viz', `${svg}<p class="viz-caption">${count} suku → <b>${count - 1} lompatan</b></p>`);
}

/** Baris kursi: a kursi di baris 1, bertambah b. */
function seats(a, b, rows) {
  const r = 5; const gap = 3;
  const maxSeats = a + (rows - 1) * b;
  const W = maxSeats * (2 * r + gap) + 96;
  let svg = `<svg viewBox="0 0 ${W} ${rows * 22 + 10}" class="viz-svg" role="img" aria-label="Baris kursi ${a}, ${a + b}, ${a + 2 * b}">`;
  for (let i = 0; i < rows; i++) {
    const n = a + i * b;
    const y = 14 + i * 22;
    const x0 = 88 + ((maxSeats - n) * (2 * r + gap)) / 2;
    svg += `<text x="4" y="${y + 4}" class="nl-val nl-left">Baris ${i + 1}: ${n}</text>`;
    for (let s = 0; s < n; s++) svg += `<circle cx="${x0 + s * (2 * r + gap)}" cy="${y}" r="${r}" class="seat"/>`;
  }
  return html('div', 'viz', `${svg}</svg>`);
}

/** Interaktif: tambah suku satu per satu untuk menemukan pola a + (k − 1)b. */
function derive(a, b) {
  const box = h('div', { class: 'viz viz-derive' });
  const table = h('div', { class: 'derive-table', 'aria-live': 'polite' });
  let k = 0;
  const addBtn = button('Tambah suku', { kind: 'secondary', iconName: 'sparkle', cls: 'btn-sm' });
  function addRow() {
    k++;
    const value = a + (k - 1) * b;
    const plusB = Array.from({ length: k - 1 }, () => fmt(b)).join(' + ');
    const left = k === 1 ? fmt(a) : `${fmt(a)} + ${plusB}`;
    const right = k === 1 ? '<span class="chip chip-a">a</span>'
      : `<span class="chip chip-a">a</span> + ${k - 1}·<span class="chip chip-b">b</span>`;
    table.append(html('div', 'derive-row', `<span>${sub(k)} = ${left}</span><span class="derive-eq">= ${fmt(value)}</span><span class="derive-sym">${right}</span>`));
    if (k >= 4) {
      table.append(html('div', 'derive-row derive-final', `<span>${sub('n')}</span><span class="derive-eq">&nbsp;</span><span class="derive-sym"><span class="chip chip-a">a</span> + (<span class="chip chip-n">n</span> − 1)·<span class="chip chip-b">b</span></span>`));
      addBtn.remove();
    } else {
      addBtn.querySelector('span:last-child').textContent = `Tambah suku (U${String.fromCharCode(0x2080 + k + 1)})`;
    }
  }
  addBtn.addEventListener('click', addRow);
  addRow();
  box.append(table, addBtn);
  return box;
}

export function renderVisual(spec) {
  if (!spec) return null;
  const [kind, argStr = ''] = spec.split(':');
  const args = argStr ? nums(argStr) : [];
  switch (kind) {
    case 'terms': return terms(args);
    case 'diff': return diff(args);
    case 'jumps': return jumps(...args);
    case 'tiles': return tiles(...args);
    case 'matches': return matches(...args);
    case 'posts': return posts(...args);
    case 'seats': return seats(...args);
    case 'derive': return derive(...args);
    default: return null;
  }
}

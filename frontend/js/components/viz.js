// Visual pola bilangan. Spesifikasi berupa string "jenis:arg1,arg2,...".
// Label diletakkan langsung pada gambar (prinsip split-attention).
import { h, html, button } from '../ui.js';
import { fmt } from '../engine/format.js';

const nums = (s) => s.split(',').map(Number);
const sub = (k) => `U<sub>${k}</sub>`;
const signed = (d) => (d >= 0 ? `+${fmt(d)}` : fmt(d));
const toSub = (k) => String(k).split('').map((c) => String.fromCharCode(0x2080 + Number(c))).join('');

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

/** Satu ikon pot tanaman berpusat di (x, y). */
const potShape = (x, y) => `<path d="M${x - 5} ${y - 1} L${x + 5} ${y - 1} L${x + 3.5} ${y + 7} L${x - 3.5} ${y + 7} Z" class="pot"/>`
  + `<path d="M${x} ${y - 1} Q${x - 6} ${y - 8} ${x - 2} ${y - 9} M${x} ${y - 1} Q${x + 6} ${y - 7} ${x + 2} ${y - 10}" class="leaf"/>`;
const seatShape = (x, y) => `<circle cx="${x}" cy="${y}" r="5" class="seat"/>`;

/**
 * Baris benda (kursi/pot): a di baris 1, bertambah b. Jika `target` > rows,
 * tampilkan "⋮" lalu baris ke-target yang disorot (untuk pembahasan).
 */
function rowsOf(shape, noun, a, b, rows, target = 0) {
  const cell = 13; const rowH = shape === potShape ? 26 : 22; const labelW = 92;
  const list = Array.from({ length: rows }, (_, i) => i + 1);
  const far = target > rows;
  if (far) list.push(null, target);
  // Baris yang sangat panjang dipadatkan: 10 benda, "…", 10 benda (angkanya tetap di label).
  const CAP = 23;
  const cells = (n) => (n > CAP ? CAP : n);
  const maxCount = Math.max(...list.filter(Boolean).map((k) => cells(a + (k - 1) * b)));
  const W = maxCount * cell + labelW + 8;
  const H = list.length * rowH + 10;
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="viz-svg ${list.length > 5 ? 'viz-tall' : ''}" role="img" aria-label="${noun} tiap baris: ${list.filter(Boolean).map((k) => a + (k - 1) * b).join(', ')}">`;
  list.forEach((k, i) => {
    const y = 14 + i * rowH;
    if (k === null) { svg += `<text x="${labelW / 2}" y="${y + 4}" class="nl-val">⋮</text><text x="${labelW + (W - labelW) / 2}" y="${y + 4}" class="nl-val">⋮</text>`; return; }
    const n = a + (k - 1) * b;
    const hl = far && k === target;
    if (hl) svg += `<rect x="1" y="${y - rowH / 2 + 1}" width="${W - 2}" height="${rowH - 2}" rx="8" class="row-hl"/>`;
    svg += `<text x="6" y="${y + 4}" class="nl-val nl-left${hl ? ' nl-strong' : ''}">Baris ${k}: ${fmt(n)}</text>`;
    const x0 = labelW + ((maxCount - cells(n)) * cell) / 2 + cell / 2;
    if (n > CAP) {
      for (let s2 = 0; s2 < 10; s2++) svg += shape(x0 + s2 * cell, y) + shape(x0 + (s2 + 13) * cell, y);
      svg += `<text x="${x0 + 11 * cell}" y="${y + 4}" class="nl-val">…</text>`;
    } else {
      for (let s2 = 0; s2 < n; s2++) svg += shape(x0 + s2 * cell, y);
    }
  });
  return html('div', 'viz', `${svg}</svg>`);
}

const seats = (...args) => rowsOf(seatShape, 'Kursi', ...args);
const pots = (...args) => rowsOf(potShape, 'Pot', ...args);

/**
 * Lompatan dari U₁ ke Uₙ: tiga suku pertama, "…", lalu Uₙ.
 * Kurung bawah menunjukkan ada (n − 1) lompatan.
 */
function leap(a, b, n) {
  const W = 320; const xs = [24, 84, 144, 296]; const yAxis = 62;
  const shown = n > 4 ? [1, 2, 3, n] : Array.from({ length: n }, (_, i) => i + 1);
  const pos = n > 4 ? xs : shown.map((_, i) => 24 + (i * 272) / Math.max(1, n - 1));
  let svg = `<svg viewBox="0 0 ${W} 132" class="viz-svg" role="img" aria-label="Dari U1 ke U${n} ada ${n - 1} lompatan sebesar ${fmt(b)}">`;
  svg += `<line x1="8" y1="${yAxis}" x2="${W - 8}" y2="${yAxis}" class="nl-axis"/>`;
  shown.forEach((k, i) => {
    const x = pos[i];
    if (i > 0 && shown[i - 1] === k - 1) {
      const x0 = pos[i - 1];
      svg += `<path d="M${x0 + 4} ${yAxis - 8} Q${(x0 + x) / 2} 16 ${x - 4} ${yAxis - 8}" class="nl-arc"/>`;
      svg += `<text x="${(x0 + x) / 2}" y="28" class="nl-jump">${signed(b)}</text>`;
    } else if (i > 0) {
      const x0 = pos[i - 1];
      svg += `<path d="M${x0 + 8} ${yAxis - 8} Q${(x0 + x) / 2} 16 ${x - 8} ${yAxis - 8}" class="nl-arc nl-arc-dash"/>`;
      svg += `<text x="${(x0 + x) / 2}" y="28" class="nl-jump">${signed(b)} terus …</text>`;
    }
    svg += `<circle cx="${x}" cy="${yAxis}" r="${k === 1 ? 9 : 7}" class="${k === 1 ? 'nl-dot-a' : 'nl-dot'}"/>`;
    svg += `<text x="${x}" y="${yAxis + 22}" class="nl-val">${fmt(a + (k - 1) * b)}</text>`;
    svg += `<text x="${x}" y="${yAxis + 36}" class="nl-idx">U${toSub(k)}</text>`;
  });
  const x1 = pos[0]; const x2 = pos[pos.length - 1];
  svg += `<path d="M${x1} 110 L${x1} 116 L${x2} 116 L${x2} 110" class="nl-brace"/>`;
  svg += `<text x="${(x1 + x2) / 2}" y="130" class="nl-jump">${n - 1} lompatan</text>`;
  svg += '</svg>';
  const cap = `U<sub>${n}</sub> = ${fmt(a)} + (${n} − 1) × ${fmt(b, { paren: true })} = ${fmt(a)} + ${fmt((n - 1) * b, { paren: true })} = <b>${fmt(a + (n - 1) * b)}</b>`;
  return html('div', 'viz', `${svg}<p class="viz-caption">${cap}</p>`);
}

const COMPARE_UNITS = ['Baris', 'Bulan', 'Minggu', 'Hari'];

/**
 * Membandingkan dua barisan (A dan B) langkah demi langkah sampai ke-n.
 * unit: 0 = Baris, 1 = Bulan, 2 = Minggu, 3 = Hari.
 */
function compare(a1, b1, a2, b2, n, unit = 0) {
  const label = COMPARE_UNITS[unit] || COMPARE_UNITS[0];
  const max = Math.max(a1 + (n - 1) * b1, a2 + (n - 1) * b2);
  const W = 320; const labelW = 62; const barH = 11; const rowH = 34; const valW = (fmt(max).length + 2) * 7.5;
  const scale = (W - labelW - valW) / max;
  let svg = `<svg viewBox="0 0 ${W} ${n * rowH + 26}" class="viz-svg viz-tall" role="img" aria-label="Perbandingan A dan B sampai ${label.toLowerCase()} ke-${n}">`;
  svg += `<rect x="${labelW}" y="2" width="12" height="10" rx="2" class="bar-a"/><text x="${labelW + 16}" y="11" class="nl-val nl-left">A</text>`;
  svg += `<rect x="${labelW + 40}" y="2" width="12" height="10" rx="2" class="bar-b"/><text x="${labelW + 56}" y="11" class="nl-val nl-left">B</text>`;
  for (let k = 1; k <= n; k++) {
    const y = 20 + (k - 1) * rowH;
    const va = a1 + (k - 1) * b1; const vb = a2 + (k - 1) * b2;
    const last = k === n;
    if (last) svg += `<rect x="1" y="${y - 3}" width="${W - 2}" height="${rowH - 2}" rx="8" class="row-hl"/>`;
    const st = last ? ' nl-strong' : '';
    svg += `<text x="6" y="${y + 16}" class="nl-val nl-left${st}">${label} ${k}</text>`;
    svg += `<rect x="${labelW}" y="${y}" width="${va * scale}" height="${barH}" rx="3" class="bar-a"/>`;
    svg += `<text x="${labelW + va * scale + 4}" y="${y + 10}" class="nl-val nl-left${st}">A ${fmt(va)}</text>`;
    svg += `<rect x="${labelW}" y="${y + barH + 3}" width="${vb * scale}" height="${barH}" rx="3" class="bar-b"/>`;
    svg += `<text x="${labelW + vb * scale + 4}" y="${y + 2 * barH + 2}" class="nl-val nl-left${st}">B ${fmt(vb)}</text>`;
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
    case 'pots': return pots(...args);
    case 'leap': return leap(...args);
    case 'compare': return compare(...args);
    case 'derive': return derive(...args);
    default: return null;
  }
}

/**
 * Kartu Pembahasan: ilustrasi + langkah penyelesaian.
 * @param d { visual?: string, steps: string[] }
 */
export function discussionCard(d, title = 'Pembahasan') {
  if (!d) return null;
  return h('section', { class: 'card discussion-card', 'aria-label': title },
    h('p', { class: 'eyebrow' }, title),
    renderVisual(d.visual),
    html('ol', 'solution', d.steps.map((st) => `<li>${st}</li>`).join('')));
}

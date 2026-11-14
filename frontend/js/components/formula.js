// Kartu Rumus (FR-09): selalu bisa dibuka dari tombol 📘.
import { h, html, openSheet } from '../ui.js';
import { logEvent } from '../api.js';

export function formulaCard() {
  return h('div', { class: 'formula-card' },
    html('div', 'formula big', 'U<sub>n</sub> = <span class="chip chip-a">a</span> + (<span class="chip chip-n">n</span> − 1)<span class="chip chip-b">b</span>'),
    html('dl', 'legend', `
      <div><dt><span class="chip chip-a">a</span></dt><dd>suku pertama (U<sub>1</sub>)</dd></div>
      <div><dt><span class="chip chip-b">b</span></dt><dd>beda = U<sub>2</sub> − U<sub>1</sub></dd></div>
      <div><dt><span class="chip chip-n">n</span></dt><dd>nomor suku yang dicari</dd></div>
      <div><dt>U<sub>n</sub></dt><dd>nilai suku ke-n</dd></div>`),
    html('div', 'formula-example', `
      <p class="formula-ex-title">Contoh: 5, 8, 11, 14, … cari U<sub>10</sub></p>
      <p>a = 5, b = 3, n = 10</p>
      <p>U<sub>10</sub> = 5 + (10 − 1) × 3 = 5 + 27 = <b>32</b></p>`),
    html('div', 'formula-tips', `
      <p><b>Cari n:</b> n = (U<sub>n</sub> − a) ÷ b + 1</p>
      <p><b>Urutan hitung:</b> kurung → kali → tambah</p>
      <p><b>Barisan turun:</b> b negatif</p>`));
}

export function openFormulaSheet(source = null) {
  logEvent('step_view', { item_id: 'formula', payload: { source } });
  return openSheet({ title: 'Kartu Rumus', content: formulaCard() });
}

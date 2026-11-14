// Angket beban kognitif (0–10) dan kepraktisan (1–5).
import { h, button, feedback, toast } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { queueSurvey, sync } from '../api.js';
import { focusHeader } from '../components/layout.js';

export async function render(root, { kind }) {
  const all = await content.surveys();
  const sv = all[kind];
  if (!sv || !sv.items) { go('/profile'); return; }
  const answers = {};
  const fb = h('div', {});
  const values = Array.from({ length: sv.max - sv.min + 1 }, (_, i) => sv.min + i);

  const list = h('ol', { class: 'survey-list' }, sv.items.map((item) => {
    const scale = h('div', { class: `scale scale-${values.length}`, role: 'radiogroup', 'aria-label': item.text },
      values.map((v) => h('button', {
        type: 'button', class: 'scale-btn', role: 'radio', 'aria-checked': 'false', 'aria-label': String(v),
        onClick: (e) => {
          answers[item.id] = v;
          [...scale.children].forEach((b) => { b.setAttribute('aria-checked', String(b === e.currentTarget)); b.classList.toggle('is-on', b === e.currentTarget); });
        },
      }, String(v))));
    return h('li', { class: 'card survey-item' }, h('p', {}, item.text), scale,
      h('div', { class: 'scale-ends muted small' }, h('span', {}, 'Tidak setuju'), h('span', {}, 'Setuju')));
  }));

  root.append(focusHeader({ title: sv.title, back: '/profile', formula: false }),
    h('p', { class: 'muted' }, sv.intro), list, fb,
    h('div', { class: 'finish-actions' }, button('Kirim angket', { onClick: () => {
      const missing = sv.items.filter((it) => answers[it.id] == null).length;
      if (missing) { fb.replaceChildren(feedback('hint', `Masih ada ${missing} pernyataan yang belum dijawab.`)); return; }
      queueSurvey(kind, null, answers);
      store.update('surveysDone', {}, (d) => ({ ...d, [kind]: new Date().toISOString() }));
      sync();
      toast('Terima kasih! Angket tersimpan.');
      go('/profile');
    } })));
}

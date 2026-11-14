// Pusat Latihan (tombol tengah): pilih cara belajar + permainan edukatif.
import { h, icon } from '../ui.js';
import * as store from '../store.js';
import { pageHeader } from '../components/layout.js';
import { dailyStatus } from './daily.js';
import { GAMES } from './games.js';
import { unlockedLevel } from './bank.js';

function hubCard(href, iconName, title, sub, badge = null) {
  return h('a', { href, class: 'card hub-card' },
    h('span', { class: 'hub-icon' }, icon(iconName)),
    h('span', { class: 'hub-title' }, title),
    h('span', { class: 'hub-sub' }, sub),
    badge ? h('span', { class: 'hub-badge' }, badge) : null);
}

export function render(root) {
  const saved = Object.keys(store.getReview().flagged || {}).length;
  const daily = dailyStatus();
  const games = store.get('games', {});

  root.append(
    pageHeader('Latihan', 'Pilih cara belajar yang kamu inginkan!'),
    h('div', { class: 'hub-grid' },
      hubCard('#/bank', 'layers', 'Bank Soal', 'Latihan berdasarkan tingkat kesulitan', `Lv ${unlockedLevel()}`),
      hubCard('#/kuis', 'clock', 'Kuis Cepat', '10 soal dengan batas waktu'),
      hubCard('#/saved', 'bookmark', 'Soal Tersimpan', 'Kumpulan soal pilihanmu', saved ? String(saved) : null),
      hubCard('#/riwayat', 'history', 'Riwayat Latihan', 'Lihat hasil pengerjaan sebelumnya')),
    h('a', { href: '#/harian', class: `card daily-card ${daily.doneToday ? 'is-done' : ''}` },
      h('div', {},
        h('span', { class: 'hub-title' }, 'Tantangan Hari Ini'),
        h('span', { class: 'daily-big' }, daily.doneToday ? `${daily.score}/5 ✓` : '5 Soal'),
        h('span', { class: 'hub-sub' }, daily.doneToday ? `Selesai! ${daily.streak} hari beruntun 🔥` : daily.streak ? `Pertahankan ${daily.streak} hari beruntun 🔥` : 'Selesaikan tantanganmu hari ini!')),
      h('span', { class: 'trophy' }, icon('trophy', { size: 40 }))),
    h('h2', { class: 'section-title' }, 'Permainan'),
    h('div', { class: 'game-list' }, GAMES.map((g) => h('a', { href: `#/game/${g.id}`, class: 'card game-row' },
      h('span', { class: 'list-icon game-art', html: g.art }),
      h('span', { class: 'list-text' }, h('b', {}, g.title), h('small', { class: 'muted' }, g.desc)),
      h('span', { class: 'game-best' }, games[g.id] ? `🏆 ${games[g.id]}` : icon('chevron'))))));
}

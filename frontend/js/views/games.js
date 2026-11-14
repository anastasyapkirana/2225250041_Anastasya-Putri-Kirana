// Permainan edukatif beranimasi (DS.01 "kuis atau permainan").
//  - Lompat Katak : lompat ke daun berisi suku berikutnya
//  - Tangkap Beda : gerakkan keranjang, tangkap nilai b yang benar
//  - Pecah Balon  : pecahkan balon sesuai urutan barisan
import { h, html, button, sound } from '../ui.js';
import { go } from '../router.js';
import * as store from '../store.js';
import { logEvent } from '../api.js';
import { focusHeader } from '../components/layout.js';
import { fmt } from '../engine/format.js';
import { mulberry32, randInt, newSeed } from '../engine/generator.js';

const ART = {
  katak: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="46" rx="26" ry="10" fill="#8FC79A"/><ellipse cx="32" cy="36" rx="18" ry="14" fill="#5FAF72"/><circle cx="23" cy="24" r="7" fill="#5FAF72"/><circle cx="41" cy="24" r="7" fill="#5FAF72"/><circle cx="23" cy="23" r="3.5" fill="#fff"/><circle cx="41" cy="23" r="3.5" fill="#fff"/><circle cx="23.5" cy="23.5" r="1.8" fill="#2F4860"/><circle cx="41.5" cy="23.5" r="1.8" fill="#2F4860"/><path d="M25 38 Q32 43 39 38" stroke="#2F4860" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  tangkap: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="14" r="8" fill="#F5D96B"/><circle cx="42" cy="22" r="8" fill="#7DA7D9"/><path d="M10 38h44l-6 18H16z" fill="#C98F5B"/><path d="M10 38h44" stroke="#8A5A33" stroke-width="3"/><path d="M18 44h28M20 50h24" stroke="#8A5A33" stroke-width="2"/></svg>',
  balon: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 40 Q24 52 20 60" stroke="#5A6F85" stroke-width="1.5" fill="none"/><path d="M42 36 Q40 50 44 60" stroke="#5A6F85" stroke-width="1.5" fill="none"/><ellipse cx="22" cy="24" rx="13" ry="16" fill="#7DA7D9"/><ellipse cx="42" cy="20" rx="12" ry="15" fill="#F5D96B"/><ellipse cx="18" cy="18" rx="3" ry="5" fill="#fff" opacity=".6"/></svg>',
};

export const GAMES = [
  { id: 'katak', title: 'Lompat Katak', desc: 'Lompat ke daun berisi suku berikutnya.', how: 'Ketuk daun yang berisi suku berikutnya. Salah = tercebur!', art: ART.katak },
  { id: 'tangkap', title: 'Tangkap Beda', desc: 'Gerakkan keranjang, tangkap nilai b.', how: 'Geser jarimu (atau tombol ◀ ▶) untuk menangkap angka beda (b) yang benar.', art: ART.tangkap },
  { id: 'balon', title: 'Pecah Balon', desc: 'Pecahkan balon sesuai urutan barisan.', how: 'Ketuk balon secara berurutan: U₂, U₃, U₄, lalu U₅.', art: ART.balon },
];

const HEARTS = 3;
const nonZero = (rng, lo, hi) => { let v = 0; while (v === 0) v = randInt(rng, lo, hi); return v; };
const shuffle = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
function newSeq(rng, level) {
  const neg = level >= 2 && rng() < 0.4;
  const b = neg ? -randInt(rng, 2, 4 + level) : randInt(rng, 2, 4 + level * 2);
  const a = randInt(rng, neg ? 20 : 1, neg ? 60 : 25);
  return { a, b };
}

// ======================================================= musik latar
const musicOn = () => store.getSettings().music !== false;

/** Musik latar berulang. Diunduh utuh (bukan streaming) agar ikut tersimpan untuk offline. */
function gameMusic(src) {
  let audio = null;
  let loading = null;
  let wanted = false;
  let dead = false;
  function load() {
    loading = loading || fetch(src)
      .then((r) => { if (!r.ok) throw new Error('musik tidak ada'); return r.blob(); })
      .then((blob) => {
        if (dead) return null;
        audio = new Audio(URL.createObjectURL(blob));
        audio.loop = true;
        audio.volume = 0.35;
        if (wanted && musicOn()) audio.play().catch(() => {});
        return audio;
      })
      .catch(() => { loading = null; return null; });
    return loading;
  }
  const onVisibility = () => {
    if (!audio) return;
    if (document.hidden) audio.pause();
    else if (wanted && musicOn()) audio.play().catch(() => {});
  };
  document.addEventListener('visibilitychange', onVisibility);
  if (musicOn()) load();
  return {
    play() {
      wanted = true;
      if (!musicOn()) return;
      if (audio) audio.play().catch(() => {});
      else load();
    },
    pause() { wanted = false; if (audio) audio.pause(); },
    refresh() { if (musicOn()) { if (wanted) this.play(); } else if (audio) audio.pause(); },
    stop() {
      dead = true; wanted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      if (audio) { audio.pause(); URL.revokeObjectURL(audio.src); audio = null; }
    },
  };
}

// ======================================================= kerangka permainan (HUD + layar mulai/selesai)
function shell(root, game, start) {
  const music = gameMusic(`assets/audio/${game.id}.mp3`);
  const hud = h('div', { class: 'game-hud' });
  const arena = h('div', { class: `arena arena-${game.id}` });
  const overlay = h('div', { class: 'arena-overlay' });
  arena.append(overlay);
  root.append(focusHeader({ title: game.title, back: '/practice', formula: false }), hud, arena);

  const state = { score: 0, hearts: HEARTS, level: 1, combo: 0, correct: 0, tries: 0 };
  function drawHud() {
    hud.replaceChildren(
      h('span', { class: 'hud-item', 'aria-label': `${state.hearts} nyawa` }, '❤️'.repeat(state.hearts) + '🤍'.repeat(HEARTS - state.hearts)),
      h('span', { class: 'hud-item' }, `Lv ${state.level}`),
      h('span', { class: `hud-item ${state.combo >= 3 ? 'is-hot' : ''}` }, `⭐ ${state.score}`),
      h('button', {
        type: 'button', class: 'hud-item hud-btn',
        'aria-label': musicOn() ? 'Matikan musik' : 'Nyalakan musik', 'aria-pressed': musicOn() ? 'true' : 'false',
        onClick: () => { store.setSettings({ ...store.getSettings(), music: !musicOn() }); music.refresh(); drawHud(); },
      }, musicOn() ? '🔊' : '🔇'));
  }
  function floatText(text, x, y, kind = 'good') {
    const t = h('span', { class: `float-text float-${kind}` }, text);
    t.style.left = `${x}px`; t.style.top = `${y}px`;
    arena.append(t);
    setTimeout(() => t.remove(), 900);
  }
  function hit(ok, x, y) {
    state.tries++;
    if (ok) {
      state.combo++; state.correct++;
      const pts = 10 + (state.combo >= 3 ? 5 : 0);
      state.score += pts;
      sound('correct');
      floatText(state.combo >= 3 ? `+${pts} 🔥` : `+${pts}`, x, y);
    } else {
      state.combo = 0; state.hearts--;
      sound('wrong');
      floatText('−❤️', x, y, 'bad');
      arena.classList.remove('shake'); void arena.offsetWidth; arena.classList.add('shake');
    }
    drawHud();
    return state.hearts > 0;
  }
  function showStart() {
    const best = store.get('games', {})[game.id] || 0;
    overlay.replaceChildren(h('div', { class: 'overlay-card' },
      html('div', 'overlay-art', game.art),
      h('h2', {}, game.title),
      h('p', {}, game.how),
      best ? h('p', { class: 'muted small' }, `Rekormu: ${best} poin`) : null,
      button('Main!', { onClick: () => { music.play(); overlay.classList.add('hidden'); Object.assign(state, { score: 0, hearts: HEARTS, level: 1, combo: 0, correct: 0, tries: 0 }); drawHud(); start(); } })));
    overlay.classList.remove('hidden');
  }
  function gameOver(win) {
    music.pause();
    const games = store.get('games', {});
    const isBest = state.score > (games[game.id] || 0);
    store.set('games', { ...games, [game.id]: Math.max(games[game.id] || 0, state.score) });
    store.pushQuizHistory({ kind: 'game', id: game.id, score: state.correct, total: state.tries });
    logEvent('challenge_done', { item_id: `game-${game.id}`, payload: { score: state.score, correct: state.correct, tries: state.tries, level: state.level } });
    overlay.replaceChildren(h('div', { class: 'overlay-card' },
      h('div', { class: 'overlay-emoji' }, win ? '🏆' : '💦'),
      h('h2', {}, win ? 'Kamu menang!' : 'Permainan selesai'),
      html('div', 'summary-big', `${state.score}<small> poin</small>`),
      h('p', {}, `${state.correct} benar · sampai Level ${state.level}`),
      isBest ? h('p', { class: 'pill' }, '🏆 Rekor baru!') : null,
      h('div', { class: 'finish-actions' },
        button('Main lagi', { onClick: showStart }),
        button('Permainan lain', { kind: 'secondary', onClick: () => go('/practice') }))));
    overlay.classList.remove('hidden');
  }
  drawHud();
  return { arena, state, hit, floatText, showStart, gameOver, drawHud, music };
}

// ======================================================= 1. Lompat Katak
function katak(root, game) {
  const rng = mulberry32(newSeed());
  let seq; let terms; let busy = false;
  const GOAL = 15;
  let g = null;
  const seqBar = h('div', { class: 'seq-bar' });
  const homePad = h('div', { class: 'pad pad-home' }, h('span', {}));
  const frog = h('div', { class: 'frog', html: ART.katak });
  const pads = [0, 1, 2].map((k) => h('button', { type: 'button', class: `pad pad-opt pad-${k}` }, h('span', {})));

  function drawSeq() {
    seqBar.replaceChildren(...terms.slice(-4).map((t) => h('span', { class: 'seq-chip' }, fmt(t))), h('span', { class: 'seq-chip seq-q' }, '?'));
  }
  function newRound() {
    const cur = terms.at(-1);
    const next = cur + seq.b;
    const pool = shuffle([next + seq.b, next + 1, next - 1, cur - seq.b, next + 2, next - 2].filter((v) => v !== next), rng);
    const opts = shuffle([next, pool[0], pool[1]], rng);
    homePad.firstChild.textContent = fmt(cur);
    pads.forEach((p, k) => {
      p.dataset.v = opts[k];
      p.firstChild.textContent = fmt(opts[k]);
      p.className = `pad pad-opt pad-${k} pop-in`;
      p.disabled = false;
    });
    frog.className = 'frog';
    frog.style.removeProperty('--dx'); frog.style.removeProperty('--dy');
    drawSeq();
    busy = false;
  }
  function start() {
    seq = newSeq(rng, 1);
    terms = [0, 1, 2].map((k) => seq.a + k * seq.b);
    newRound();
  }
  pads.forEach((p) => p.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    pads.forEach((x) => { x.disabled = true; });
    const fr = frog.getBoundingClientRect(); const pr = p.getBoundingClientRect(); const ar = g.arena.getBoundingClientRect();
    frog.style.setProperty('--dx', `${pr.left + pr.width / 2 - (fr.left + fr.width / 2)}px`);
    frog.style.setProperty('--dy', `${pr.top + pr.height / 2 - (fr.top + fr.height / 2) - 14}px`);
    frog.classList.add('jump');
    const ok = Number(p.dataset.v) === terms.at(-1) + seq.b;
    setTimeout(() => {
      const alive = g.hit(ok, pr.left - ar.left + pr.width / 2, pr.top - ar.top);
      if (ok) {
        p.classList.add('pad-good');
        terms.push(Number(p.dataset.v));
        if (g.state.correct % 5 === 0) {
          g.state.level++; g.drawHud();
          seq = newSeq(rng, g.state.level);
          terms = [0, 1, 2].map((k) => seq.a + k * seq.b);
          g.floatText(`Level ${g.state.level}!`, ar.width / 2 - 40, ar.height / 2, 'level');
        }
        if (g.state.correct >= GOAL) { setTimeout(() => g.gameOver(true), 600); return; }
        setTimeout(newRound, 650);
      } else {
        p.classList.add('pad-sink');
        frog.classList.add('splash');
        if (!alive) { setTimeout(() => g.gameOver(false), 900); return; }
        setTimeout(newRound, 1000);
      }
    }, 480);
  }));
  g = shell(root, game, start);
  g.arena.prepend(h('div', { class: 'pond' }, h('span', { class: 'ripple r1' }), h('span', { class: 'ripple r2' }), h('span', { class: 'ripple r3' })), seqBar, ...pads, homePad, frog);
  g.showStart();
  return () => g.music.stop();
}

// ======================================================= 2. Tangkap Beda
function tangkap(root, game) {
  const rng = mulberry32(newSeed());
  const GOAL = 10;
  let g = null; let raf = 0; let running = false;
  let seq; let items = []; let last = 0; let spawnIn = 0; let untilCorrect = 0; let basketX = 0; let targetX = 0; let dir = 0;
  const prompt = h('div', { class: 'seq-bar' });
  const basket = h('div', { class: 'basket', html: '<svg viewBox="0 0 90 44" aria-hidden="true"><path d="M2 6h86l-10 36H12z" fill="#C98F5B"/><path d="M2 6h86" stroke="#8A5A33" stroke-width="5" stroke-linecap="round"/><path d="M14 18h62M18 30h54" stroke="#8A5A33" stroke-width="3"/></svg>' });
  const controls = h('div', { class: 'arena-controls' });

  function drawPrompt() {
    prompt.replaceChildren(...[0, 1, 2, 3].map((k) => h('span', { class: 'seq-chip' }, fmt(seq.a + k * seq.b))), h('span', { class: 'seq-chip seq-q' }, 'b = ?'));
  }
  function nextSeq() {
    seq = newSeq(rng, g.state.level);
    untilCorrect = randInt(rng, 2, 4);
    items.forEach((it) => it.el.classList.add('fade-out'));
    setTimeout(() => { items.forEach((it) => it.el.remove()); items = []; }, 250);
    drawPrompt();
  }
  function spawn(W) {
    // Jawaban benar muncul setelah 1–3 pengecoh (acak), bukan selalu paling awal.
    const hasCorrect = items.some((it) => it.ok && !it.done);
    let ok;
    if (hasCorrect) ok = rng() < 0.2;
    else { untilCorrect--; ok = untilCorrect <= 0; }
    if (ok) untilCorrect = randInt(rng, 2, 4);
    const pool = [-seq.b, seq.b + 1, seq.b - 1, seq.a + seq.b, seq.b * 2, seq.a].filter((v) => v !== seq.b);
    const value = ok ? seq.b : pool[randInt(rng, 0, pool.length - 1)];
    const el = h('div', { class: `drop drop-${randInt(rng, 0, 2)}` }, fmt(value));
    g.arena.append(el);
    items.push({ el, x: randInt(rng, 30, Math.max(31, W - 30)), y: -60, v: 70 + g.state.level * 18 + rng() * 30, ok: value === seq.b, done: false });
  }
  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    const W = g.arena.clientWidth; const H = g.arena.clientHeight;
    if (dir) targetX = Math.max(45, Math.min(W - 45, targetX + dir * 320 * dt));
    basketX += (targetX - basketX) * Math.min(1, dt * 14);
    basket.style.transform = `translateX(${basketX - 45}px)`;
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(W); spawnIn = Math.max(0.6, 1.25 - g.state.level * 0.1); }
    const basketTop = H - 70;
    for (const it of items) {
      if (it.done) continue;
      it.y += it.v * dt;
      it.el.style.transform = `translate(${it.x - 26}px, ${it.y}px)`;
      if (it.y + 52 >= basketTop && it.y + 52 <= basketTop + 36 && Math.abs(it.x - basketX) < 52) {
        it.done = true;
        it.el.classList.add(it.ok ? 'caught' : 'caught-bad');
        setTimeout(() => it.el.remove(), 300);
        const alive = g.hit(it.ok, basketX - 10, basketTop - 30);
        if (!alive) { stop(); setTimeout(() => g.gameOver(false), 500); return; }
        if (it.ok) {
          basket.classList.remove('bounce'); void basket.offsetWidth; basket.classList.add('bounce');
          if (g.state.correct >= GOAL) { stop(); setTimeout(() => g.gameOver(true), 500); return; }
          if (g.state.correct % 3 === 0) { g.state.level++; g.drawHud(); g.floatText(`Level ${g.state.level}!`, W / 2 - 40, H / 2, 'level'); }
          nextSeq();
        }
      } else if (it.y > H) {
        it.done = true; it.el.remove();
      }
    }
    items = items.filter((it) => !it.done || it.el.isConnected);
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function start() {
    items.forEach((it) => it.el.remove()); items = [];
    const W = g.arena.clientWidth;
    basketX = targetX = W / 2; last = 0; spawnIn = 0.3;
    seq = newSeq(rng, 1); untilCorrect = randInt(rng, 2, 4); drawPrompt();
    running = true; raf = requestAnimationFrame(loop);
  }
  g = shell(root, game, start);
  const move = (e) => { const r = g.arena.getBoundingClientRect(); targetX = Math.max(45, Math.min(r.width - 45, e.clientX - r.left)); };
  g.arena.addEventListener('pointerdown', move);
  g.arena.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) move(e); });
  const hold = (d) => ({ onPointerdown: (e) => { e.preventDefault(); dir = d; }, onPointerup: () => { dir = 0; }, onPointerleave: () => { dir = 0; } });
  controls.append(
    h('button', { type: 'button', class: 'ctrl-btn', 'aria-label': 'Geser kiri', ...hold(-1) }, '◀'),
    h('button', { type: 'button', class: 'ctrl-btn', 'aria-label': 'Geser kanan', ...hold(1) }, '▶'));
  const onKey = (e) => { if (e.key === 'ArrowLeft') dir = -1; else if (e.key === 'ArrowRight') dir = 1; };
  const onKeyUp = (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') dir = 0; };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);
  g.arena.prepend(h('div', { class: 'sky' }, h('span', { class: 'cloud c1' }), h('span', { class: 'cloud c2' })), prompt, basket);
  root.append(controls);
  g.showStart();
  return () => { stop(); g.music.stop(); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); };
}

// ======================================================= 3. Pecah Balon
function balon(root, game) {
  const rng = mulberry32(newSeed());
  const ROUNDS = 5;
  let g = null; let raf = 0; let running = false; let last = 0;
  let seq; let need = 1; let balloons = [];
  const progress = h('div', { class: 'seq-bar' });

  function drawProgress() {
    progress.replaceChildren(...[0, 1, 2, 3, 4].map((k) => h('span', { class: `seq-chip ${k < need ? '' : 'seq-blank'}` }, k < need ? fmt(seq.a + k * seq.b) : `U${String.fromCharCode(0x2081 + k)}`)),
      h('span', { class: 'seq-hint' }, `b = ${fmt(seq.b)}`));
  }
  function newRound() {
    balloons.forEach((b) => b.el.remove());
    seq = newSeq(rng, g.state.level);
    need = 1;
    const terms = [1, 2, 3, 4].map((k) => seq.a + k * seq.b);
    const fake = shuffle([terms[1] + 1, terms[2] - 1, terms[0] - seq.b * 2, terms[3] + seq.b].filter((v) => !terms.includes(v) && v !== seq.a), rng).slice(0, 2);
    const W = g.arena.clientWidth; const H = g.arena.clientHeight;
    const values = shuffle([...terms, ...fake], rng);
    const lane = (W - 60) / values.length;
    balloons = values.map((v, k) => {
      const el = h('button', { type: 'button', class: `balloon balloon-${k % 4}`, 'aria-label': `Balon ${v}` }, h('span', {}, fmt(v)));
      const b = { el, v, x: 30 + lane * k + lane / 2, y: H * 0.3 + rng() * H * 0.8, sp: 38 + g.state.level * 8 + rng() * 22, ph: rng() * 6.28, alive: true };
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b); });
      g.arena.append(el);
      return b;
    });
    drawProgress();
  }
  function tap(b) {
    if (!running || !b.alive) return;
    const expected = seq.a + need * seq.b;
    const r = b.el.getBoundingClientRect(); const ar = g.arena.getBoundingClientRect();
    const ok = b.v === expected;
    const alive = g.hit(ok, r.left - ar.left + 10, r.top - ar.top);
    if (ok) {
      b.alive = false;
      b.el.classList.add('pop');
      const burst = h('span', { class: 'burst' });
      burst.style.left = `${r.left - ar.left + r.width / 2}px`; burst.style.top = `${r.top - ar.top + r.height / 3}px`;
      g.arena.append(burst); setTimeout(() => burst.remove(), 500);
      setTimeout(() => b.el.remove(), 250);
      need++;
      drawProgress();
      if (need === 5) {
        const roundsDone = Math.round(g.state.correct / 4);
        g.state.level = Math.min(roundsDone + 1, ROUNDS); g.drawHud();
        if (roundsDone >= ROUNDS) { stop(); setTimeout(() => g.gameOver(true), 600); return; }
        g.floatText('Barisan lengkap! 🎉', ar.width / 2 - 80, ar.height / 2, 'level');
        setTimeout(newRound, 900);
      }
    } else {
      b.el.classList.remove('wiggle'); void b.el.offsetWidth; b.el.classList.add('wiggle');
      if (!alive) { stop(); setTimeout(() => g.gameOver(false), 600); }
    }
  }
  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    const H = g.arena.clientHeight;
    for (const b of balloons) {
      if (!b.alive) continue;
      b.y -= b.sp * dt; b.ph += dt * 2;
      if (b.y < -90) b.y = H + 20 + rng() * 120;
      b.el.style.transform = `translate(${b.x - 32 + Math.sin(b.ph) * 10}px, ${b.y}px)`;
    }
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function start() { running = true; last = 0; newRound(); raf = requestAnimationFrame(loop); }
  g = shell(root, game, start);
  g.arena.prepend(h('div', { class: 'sky' }, h('span', { class: 'cloud c1' }), h('span', { class: 'cloud c2' })), progress);
  g.showStart();
  return () => { stop(); g.music.stop(); };
}

// ======================================================= rute
export function render(root, { id } = {}) {
  const game = GAMES.find((x) => x.id === id);
  if (!game) { go('/practice'); return undefined; }
  root.classList.add('game-page');
  if (id === 'katak') return katak(root, game);
  if (id === 'tangkap') return tangkap(root, game);
  return balon(root, game);
}

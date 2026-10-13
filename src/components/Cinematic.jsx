import React, { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------
 * Suasana (scene) per fase game. Latar berganti mulus (cross-fade)
 * ketika fase berubah.
 * ------------------------------------------------------------------ */
export function sceneForPhase(phase, winner) {
  switch (phase) {
    case 'NIGHT_INTRO':
    case 'NIGHT_CUPID':
    case 'NIGHT_DOPPELGANGER':
    case 'NIGHT_WEREWOLF':
    case 'NIGHT_GUARDIAN':
    case 'NIGHT_SHERIFF':
    case 'NIGHT_SEER':
    case 'NIGHT_WITCH':
      return 'night';
    case 'HUNTER_REVENGE': return 'blood';
    case 'DOPPELGANGER_REVEAL': return 'mystic';
    case 'MORNING':
    case 'DISCUSSION': return 'dawn';
    case 'VOTING': return 'dusk';
    case 'GAME_OVER':
      if (winner === 'WARGA') return 'win-good';
      if (winner === 'WEREWOLF') return 'win-evil';
      return 'win-neutral';
    default: return 'lobby'; // HOME, SETUP, ROLE_SUMMARY, ROLE_REVEAL
  }
}

const SCENES = ['lobby', 'night', 'dawn', 'dusk', 'blood', 'mystic', 'win-good', 'win-evil', 'win-neutral'];

// Pseudo-random deterministik agar partikel tidak "melompat" saat re-render
const seeded = (n) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const FIREFLIES = Array.from({ length: 14 }, (_, i) => ({ x: seeded(i + 1) * 100, y: 20 + seeded(i + 40) * 70, d: 7 + seeded(i + 80) * 8, s: seeded(i + 120) * -10, z: 3 + seeded(i + 160) * 4 }));
const EMBERS = Array.from({ length: 18 }, (_, i) => ({ x: seeded(i + 200) * 100, d: 6 + seeded(i + 240) * 7, s: seeded(i + 280) * -12, z: 2 + seeded(i + 320) * 4 }));
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({ x: seeded(i + 400) * 100, d: 5 + seeded(i + 440) * 5, s: seeded(i + 480) * -9, h: 35 + Math.floor(seeded(i + 520) * 140) }));

export function CinematicBackdrop() {
  return (
    <div className="wf-bg" aria-hidden="true">
      {SCENES.map(s => <div key={s} className={`wf-sky wf-sky-${s}`} />)}
      <div className="wf-stars wf-stars-a" />
      <div className="wf-stars wf-stars-b" />
      <div className="wf-moon" />
      <div className="wf-sun" />
      <div className="wf-fog wf-fog-a" />
      <div className="wf-fog wf-fog-b" />
      <div className="wf-layer wf-flies">{FIREFLIES.map((f, i) => <span key={i} style={{ left: `${f.x}%`, top: `${f.y}%`, '--d': `${f.d}s`, animationDelay: `${f.s}s`, width: f.z, height: f.z }} />)}</div>
      <div className="wf-layer wf-embers">{EMBERS.map((e, i) => <span key={i} style={{ left: `${e.x}%`, '--d': `${e.d}s`, animationDelay: `${e.s}s`, width: e.z, height: e.z }} />)}</div>
      <div className="wf-layer wf-confetti">{CONFETTI.map((c, i) => <span key={i} style={{ left: `${c.x}%`, '--d': `${c.d}s`, animationDelay: `${c.s}s`, '--h': c.h }} />)}</div>
      <div className="wf-vignette" />
      <div className="wf-grain" />
    </div>
  );
}

/* ------------------------------------------------------------------
 * Kartu judul sinematik (letterbox + teks) saat fase penting berganti.
 * Tidak menghalangi klik (pointer-events: none) dan dilewati jika
 * pengguna memilih "reduce motion".
 * ------------------------------------------------------------------ */
function cardFor(phase, night, day, winner) {
  switch (phase) {
    case 'NIGHT_INTRO': return { icon: '🌙', title: `MALAM ${night}`, sub: 'Desa terlelap. Semua pemain, tutup mata.', tone: 'night' };
    case 'MORNING': return { icon: '☀️', title: `PAGI HARI ${day}`, sub: 'Matahari terbit di atas desa.', tone: 'dawn' };
    case 'DISCUSSION': return { icon: '🗣️', title: 'WAKTU DISKUSI', sub: 'Saatnya mencari serigala di antara kita.', tone: 'dawn' };
    case 'VOTING': return { icon: '⚖️', title: 'WAKTU VOTING', sub: 'Tentukan siapa yang harus digantung.', tone: 'dusk' };
    case 'HUNTER_REVENGE': return { icon: '🏹', title: 'BALAS DENDAM', sub: 'Sang Hunter menarik pelatuk terakhirnya.', tone: 'blood' };
    case 'GAME_OVER':
      if (winner === 'WARGA') return { icon: '👑', title: 'WARGA MENANG', sub: 'Desa selamat dari terkaman serigala.', tone: 'good' };
      if (winner === 'WEREWOLF') return { icon: '🐺', title: 'WEREWOLF MENANG', sub: 'Desa jatuh ke dalam kegelapan.', tone: 'blood' };
      if (winner === 'LOVERS') return { icon: '💘', title: 'LOVERS MENANG', sub: 'Cinta mengalahkan segalanya.', tone: 'love' };
      return { icon: '🃏', title: 'JESTER MENANG', sub: 'Tawa terakhir milik sang badut.', tone: 'love' };
    default: return null;
  }
}

export function PhaseTitleCard({ phase, night, day, winner }) {
  const [card, setCard] = useState(null);
  const prevKey = useRef(undefined);

  useEffect(() => {
    const key = `${phase}|${night}|${day}`;
    if (prevKey.current === undefined) { prevKey.current = key; return; } // jangan tampil saat pertama dibuka
    if (prevKey.current === key) return;
    prevKey.current = key;
    const cfg = cardFor(phase, night, day, winner);
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!cfg || reduce) { setCard(null); return; }
    setCard({ ...cfg, id: key + '|' + Date.now() });
    const t = setTimeout(() => setCard(null), 2300);
    return () => clearTimeout(t);
  }, [phase, night, day, winner]);

  if (!card) return null;
  return (
    <div key={card.id} className={`wf-title wf-title-${card.tone}`} aria-live="polite">
      <div className="wf-title-inner">
        <div className="wf-title-icon">{card.icon}</div>
        <h2 className="wf-title-text">{card.title}</h2>
        <div className="wf-title-line" />
        <p className="wf-title-sub">{card.sub}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * CSS (dibatasi di dalam .wf-app agar tidak mengganggu halaman lain)
 * ------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap');

.wf-app { isolation: isolate;
  --stars:0; --moon:0; --sun:0; --fog:0; --flies:0; --embers:0; --confetti:0; --vig:.55; --fly:#fde68a; --vigc:0,0,0; }
.wf-app[data-scene="lobby"]      { --stars:.85; --moon:.75; --fog:.5;  --flies:.6; --vig:.6;  --fly:#fde68a; }
.wf-app[data-scene="night"]      { --stars:1;   --moon:1;   --fog:.85; --flies:.9; --vig:.78; --fly:#bef264; }
.wf-app[data-scene="dawn"]       { --stars:0;   --sun:1;    --fog:.25; --flies:.55;--vig:.35; --fly:#fde68a; }
.wf-app[data-scene="dusk"]       { --stars:.5;  --moon:.45; --fog:.4;  --embers:.8;--vig:.7;  --vigc:40,0,0; }
.wf-app[data-scene="blood"]      { --stars:.2;  --moon:.6;  --fog:.5;  --embers:1; --vig:.95; --vigc:90,0,10; }
.wf-app[data-scene="mystic"]     { --stars:.9;  --moon:.6;  --fog:.95; --flies:1;  --vig:.8;  --fly:#a5b4fc; }
.wf-app[data-scene="win-good"]   { --sun:.9;    --confetti:1; --fog:.15; --vig:.35; }
.wf-app[data-scene="win-evil"]   { --stars:.4;  --moon:1;   --fog:.9;  --embers:1; --vig:1;    --vigc:90,0,10; }
.wf-app[data-scene="win-neutral"]{ --stars:.5;  --confetti:1; --flies:.8; --vig:.5; --fly:#f9a8d4; }

/* ---------- latar ---------- */
.wf-bg { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
.wf-bg > * { position: absolute; }
.wf-sky { inset: 0; opacity: 0; transition: opacity 1.6s ease; }
.wf-app[data-scene="lobby"] .wf-sky-lobby, .wf-app[data-scene="night"] .wf-sky-night, .wf-app[data-scene="dawn"] .wf-sky-dawn,
.wf-app[data-scene="dusk"] .wf-sky-dusk, .wf-app[data-scene="blood"] .wf-sky-blood, .wf-app[data-scene="mystic"] .wf-sky-mystic,
.wf-app[data-scene="win-good"] .wf-sky-win-good, .wf-app[data-scene="win-evil"] .wf-sky-win-evil,
.wf-app[data-scene="win-neutral"] .wf-sky-win-neutral { opacity: 1; }
.wf-sky-lobby       { background: linear-gradient(180deg,#0b1020 0%,#1a1038 55%,#2a1030 100%); }
.wf-sky-night       { background: linear-gradient(180deg,#02040c 0%,#07122b 50%,#0c1a3a 100%); }
.wf-sky-dawn        { background: linear-gradient(180deg,#2b2350 0%,#6d3a58 48%,#c9783f 100%); }
.wf-sky-dusk        { background: linear-gradient(180deg,#1a0f2e 0%,#5a1a3a 55%,#c2562a 100%); }
.wf-sky-blood       { background: linear-gradient(180deg,#12020a 0%,#3a0613 60%,#6a0c1c 100%); }
.wf-sky-mystic      { background: linear-gradient(180deg,#0a0820 0%,#241450 60%,#3b1e70 100%); }
.wf-sky-win-good    { background: linear-gradient(180deg,#0b2a2a 0%,#14532d 55%,#b8891a 120%); }
.wf-sky-win-evil    { background: linear-gradient(180deg,#0a0204 0%,#2a0508 55%,#5a0a10 100%); }
.wf-sky-win-neutral { background: linear-gradient(180deg,#2a0a2a 0%,#5b1a5b 60%,#be185d 120%); }

.wf-stars { inset: 0; opacity: var(--stars); transition: opacity 1.6s ease; }
.wf-stars-a { background-image:
  radial-gradient(1px 1px at 20px 30px,#fff,transparent), radial-gradient(1.5px 1.5px at 90px 60px,#cfe8ff,transparent),
  radial-gradient(1px 1px at 160px 120px,#fff,transparent), radial-gradient(1px 1px at 40px 150px,#ffe4f0,transparent);
  background-size: 200px 200px; animation: wf-twinkle 4s ease-in-out infinite; }
.wf-stars-b { background-image:
  radial-gradient(1.5px 1.5px at 70px 40px,#fff,transparent), radial-gradient(1px 1px at 230px 90px,#d6e4ff,transparent),
  radial-gradient(1px 1px at 130px 220px,#fff,transparent);
  background-size: 300px 300px; animation: wf-twinkle 6s ease-in-out -2s infinite; }
@keyframes wf-twinkle { 0%,100%{ filter: brightness(.55);} 50%{ filter: brightness(1.35);} }

.wf-moon { top: 7%; right: 9%; width: clamp(70px,14vw,140px); aspect-ratio: 1; border-radius: 50%;
  background:
    radial-gradient(circle at 62% 38%, rgba(0,0,0,.09) 0 7%, transparent 8%),
    radial-gradient(circle at 38% 64%, rgba(0,0,0,.07) 0 10%, transparent 11%),
    radial-gradient(circle at 35% 35%, #fffdf0 0%, #f1ead0 40%, #cfc7a0 72%, #a69f7a 100%);
  box-shadow: 0 0 60px 20px rgba(255,248,210,.22), 0 0 170px 70px rgba(150,170,255,.16);
  opacity: var(--moon); transition: opacity 1.6s ease, filter 1.6s ease; animation: wf-float 10s ease-in-out infinite; }
.wf-app[data-scene="blood"] .wf-moon, .wf-app[data-scene="win-evil"] .wf-moon { filter: sepia(1) saturate(5) hue-rotate(-38deg); }
@keyframes wf-float { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-10px);} }

.wf-sun { left: 50%; bottom: -16vmin; width: 74vmin; height: 74vmin; margin-left: -37vmin; border-radius: 50%;
  background: radial-gradient(circle,#fff6c8 0%,#ffd47a 28%,rgba(255,170,80,.38) 52%,transparent 70%);
  opacity: var(--sun); transform: translateY(calc((1 - var(--sun)) * 34vmin));
  transition: opacity 1.8s ease, transform 2.2s cubic-bezier(.2,.7,.2,1); }
.wf-sun::before { content:''; position:absolute; inset:-12%; border-radius:50%;
  background: radial-gradient(circle, rgba(255,210,120,.35), transparent 65%); animation: wf-pulse 6s ease-in-out infinite; }
@keyframes wf-pulse { 0%,100%{ transform: scale(.96); opacity:.7;} 50%{ transform: scale(1.06); opacity:1;} }

.wf-fog { left: -50%; width: 200%; opacity: var(--fog); transition: opacity 1.6s ease; }
.wf-fog-a { bottom: 0; height: 42%;
  background: radial-gradient(ellipse at 30% 65%, rgba(185,195,235,.2), transparent 60%), radial-gradient(ellipse at 78% 55%, rgba(150,160,215,.16), transparent 60%);
  animation: wf-drift 46s linear infinite alternate; }
.wf-fog-b { bottom: 14%; height: 34%;
  background: radial-gradient(ellipse at 20% 50%, rgba(170,180,225,.13), transparent 60%), radial-gradient(ellipse at 65% 60%, rgba(200,205,240,.1), transparent 60%);
  animation: wf-drift 70s linear -20s infinite alternate-reverse; }
@keyframes wf-drift { from{ transform: translateX(0);} to{ transform: translateX(25%);} }

.wf-layer { inset: 0; transition: opacity 1.6s ease; }
.wf-flies { opacity: var(--flies); }
.wf-flies span { position: absolute; border-radius: 50%; background: var(--fly); box-shadow: 0 0 10px 3px var(--fly);
  animation: wf-fly var(--d) ease-in-out infinite; }
@keyframes wf-fly { 0%,100%{ transform: translate(0,0); opacity:.15;} 25%{ opacity:1;} 50%{ transform: translate(30px,-26px); opacity:.35;} 75%{ transform: translate(-22px,-48px); opacity:1;} }
.wf-embers { opacity: var(--embers); }
.wf-embers span { position: absolute; bottom: -12px; border-radius: 50%; background: #fb923c; box-shadow: 0 0 8px 2px rgba(251,146,60,.8);
  animation: wf-rise var(--d) linear infinite; }
@keyframes wf-rise { 0%{ transform: translate(0,0); opacity:0;} 10%{ opacity:1;} 100%{ transform: translate(40px,-105vh); opacity:0;} }
.wf-confetti { opacity: var(--confetti); }
.wf-confetti span { position: absolute; top: -14px; width: 7px; height: 13px; background: hsl(var(--h) 90% 60%); border-radius: 2px;
  animation: wf-fall var(--d) linear infinite; }
@keyframes wf-fall { 0%{ transform: translateY(0) rotate(0);} 100%{ transform: translateY(108vh) rotate(720deg);} }

.wf-vignette { inset: 0; opacity: var(--vig); transition: opacity 1.6s ease;
  background: radial-gradient(ellipse at center, transparent 42%, rgba(var(--vigc),.88) 100%); }
.wf-app[data-scene="blood"] .wf-vignette { animation: wf-heartbeat 1.7s ease-in-out infinite; }
@keyframes wf-heartbeat { 0%,100%{ filter: brightness(1);} 12%{ filter: brightness(1.9);} 24%{ filter: brightness(1);} 36%{ filter: brightness(1.6);} }
.wf-grain { inset: 0; opacity: .07; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }

/* ---------- tipografi & interaksi ---------- */
.wf-app h1, .wf-app h2 { font-family: 'Cinzel','Cormorant Garamond',Georgia,serif; letter-spacing: .06em; }
.wf-app h1 { text-shadow: 0 0 26px rgba(248,113,113,.35); }
.wf-app button { transition: transform .18s ease, box-shadow .25s ease, filter .25s ease, background-color .2s ease, border-color .2s ease; }
.wf-app button:not(:disabled):hover { transform: translateY(-1px); filter: brightness(1.1); }
.wf-app button:not(:disabled):active { transform: translateY(1px) scale(.985); }
.wf-app button.shadow-xl:not(:disabled):hover { box-shadow: 0 0 30px rgba(251,191,36,.22), 0 12px 28px rgba(0,0,0,.45); }
.wf-app .rounded-3xl { backdrop-filter: blur(8px) saturate(1.1); }
.wf-app header { backdrop-filter: blur(10px); }

/* ---------- transisi halaman ---------- */
@keyframes wf-enter { from { opacity:0; transform: translateY(18px) scale(.985); filter: blur(8px);} to { opacity:1; transform:none; filter:none;} }
@keyframes wf-rise-in { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform:none;} }
@keyframes wf-pop { from { opacity:0; transform: translateY(10px) scale(.92);} to { opacity:1; transform:none;} }
@keyframes wf-slide { from { opacity:0; transform: translateX(-26px);} to { opacity:1; transform:none;} }
@keyframes wf-deathflash { 0%{ background-color: rgba(239,68,68,.55);} 100%{ background-color: rgba(69,10,10,.6);} }
.wf-app main { animation: wf-enter .75s cubic-bezier(.2,.7,.2,1) backwards; }
.wf-app .animate-fadeIn { animation: wf-rise-in .6s ease-out backwards; }
.wf-app .grid > button { animation: wf-pop .5s cubic-bezier(.2,.9,.3,1.25) backwards; }
.wf-app .grid > button:nth-child(2){animation-delay:.04s} .wf-app .grid > button:nth-child(3){animation-delay:.08s}
.wf-app .grid > button:nth-child(4){animation-delay:.12s} .wf-app .grid > button:nth-child(5){animation-delay:.16s}
.wf-app .grid > button:nth-child(6){animation-delay:.2s}  .wf-app .grid > button:nth-child(7){animation-delay:.24s}
.wf-app .grid > button:nth-child(8){animation-delay:.28s} .wf-app .grid > button:nth-child(9){animation-delay:.32s}
.wf-app .grid > button:nth-child(10){animation-delay:.36s} .wf-app .grid > button:nth-child(11){animation-delay:.4s}
.wf-app .grid > button:nth-child(n+12){animation-delay:.44s}

.wf-stagger > * { animation: wf-slide .6s cubic-bezier(.2,.8,.2,1) backwards, wf-deathflash 1.4s ease-out backwards; animation-delay: .55s, .55s; }
.wf-stagger > *:nth-child(2){animation-delay:.95s,.95s} .wf-stagger > *:nth-child(3){animation-delay:1.35s,1.35s}
.wf-stagger > *:nth-child(4){animation-delay:1.75s,1.75s} .wf-stagger > *:nth-child(n+5){animation-delay:2.1s,2.1s}

.wf-flip { animation: wf-flip .95s cubic-bezier(.2,.8,.2,1) backwards; box-shadow: 0 0 60px rgba(255,255,255,.08); }
@keyframes wf-flip { from { transform: perspective(900px) rotateY(88deg) scale(.9); opacity:0; filter: brightness(2.2);}
  60% { transform: perspective(900px) rotateY(-8deg) scale(1.02); opacity:1;} to { transform: perspective(900px) rotateY(0) scale(1); filter:none;} }
.wf-glow { animation: wf-glow 3.4s ease-in-out infinite; }
@keyframes wf-glow { 0%,100%{ box-shadow: 0 0 22px rgba(248,113,113,.25);} 50%{ box-shadow: 0 0 52px rgba(248,113,113,.55), 0 0 90px rgba(168,85,247,.25);} }
.wf-shimmer { background-size: 220% auto; animation: wf-shimmer 7s linear infinite; }
@keyframes wf-shimmer { from { background-position: 0% center;} to { background-position: 220% center;} }

/* ---------- kartu judul sinematik ---------- */
.wf-title { position: fixed; inset: 0; z-index: 55; pointer-events: none; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, rgba(0,0,0,.7), rgba(0,0,0,.93)); animation: wf-title-fade 2.3s ease both; }
.wf-title::before, .wf-title::after { content:''; position:absolute; left:0; right:0; height: 11vh; background:#000; }
.wf-title::before { top:0; animation: wf-bar-top .7s cubic-bezier(.2,.8,.2,1) both; }
.wf-title::after { bottom:0; animation: wf-bar-bottom .7s cubic-bezier(.2,.8,.2,1) both; }
.wf-title-inner { text-align:center; padding: 0 24px; }
.wf-title-icon { font-size: clamp(40px,9vw,64px); animation: wf-title-icon 1.2s ease both; filter: drop-shadow(0 0 24px rgba(255,255,255,.35)); }
.wf-title-text { margin: 10px 0 12px; font-size: clamp(26px,7vw,52px); font-weight: 900; color: #fff; animation: wf-title-text 1.1s cubic-bezier(.2,.8,.2,1) .1s both; }
.wf-title-line { height: 1px; width: 0; margin: 0 auto 12px; background: linear-gradient(90deg,transparent,#fbbf24,transparent); animation: wf-line 1.2s ease .35s forwards; }
.wf-title-sub { color: #cbd5e1; font-size: clamp(12px,3.2vw,16px); letter-spacing: .08em; animation: wf-rise-in .9s ease .7s both; }
.wf-title-night .wf-title-text { text-shadow: 0 0 30px rgba(129,140,248,.6); }
.wf-title-dawn .wf-title-text { text-shadow: 0 0 30px rgba(251,191,36,.6); }
.wf-title-dusk .wf-title-text, .wf-title-blood .wf-title-text { text-shadow: 0 0 30px rgba(239,68,68,.7); }
.wf-title-good .wf-title-text { text-shadow: 0 0 30px rgba(52,211,153,.7); }
.wf-title-love .wf-title-text { text-shadow: 0 0 30px rgba(244,114,182,.7); }
@keyframes wf-title-fade { 0%{ opacity:0;} 16%{ opacity:1;} 76%{ opacity:1;} 100%{ opacity:0;} }
@keyframes wf-title-text { from { letter-spacing:.7em; filter: blur(12px); opacity:0;} to { letter-spacing:.14em; filter:none; opacity:1;} }
@keyframes wf-title-icon { from { transform: scale(.4) rotate(-20deg); opacity:0;} to { transform: none; opacity:1;} }
@keyframes wf-line { to { width: min(320px,70vw);} }
@keyframes wf-bar-top { from { transform: translateY(-100%);} to { transform: none;} }
@keyframes wf-bar-bottom { from { transform: translateY(100%);} to { transform: none;} }

/* ---------- hormati preferensi "kurangi gerakan" ---------- */
@media (prefers-reduced-motion: reduce) {
  .wf-app *, .wf-app *::before, .wf-app *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
  .wf-title { display: none; }
}
`;

export function CinematicStyles() {
  return <style>{CSS}</style>;
}

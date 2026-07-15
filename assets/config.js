/* ─────────────────────────────────────────────────────────────
   TRACKS — edit this array. Audio is served from R2 (AUDIO_BASE).
   Upload each mp3 to the bucket bound to https://audio.trishul.re
   Every field feeds the UI and the CC attribution block.
   ───────────────────────────────────────────────────────────── */
const AUDIO_BASE = "https://audio.trishul.re/Music/";

const TRACKS = [
  {
    title: "Adagio For Broken Strings", artist: " Varazslo, Vutt'un", bpm: 180,
    file: "Adagio_For_Broken_Strings.mp3",
    source: "Naturaiz Records"
  },
  {
    title: "Black Yoga", artist: "Necropsycho", bpm: 153,
    file: "Black_Yoga.mp3",
    source: "Yellow Sunshine Explosion"
  },
  {
    title: "Elohim Namah", artist: "Depuratus", bpm: 150,
    file: "Elohim_Namah.mp3",
    source: "Abstract Meditation Crew"
  },
  {
    title: "Mother Of Everything", artist: "Varaboro", bpm: 180,
    file: "Mother_Of_Everything.mp3",
    source: "Self-Release"
  },
  {
    title: "Giove", artist: "Sectio Aurea", bpm: 176,
    file: "Giove.mp3",
    source: "Argot Digamma Music"
  },
  {
    title: "You Are Not A Fish", artist: "Der Sandmann", bpm: 180,
    file: "You_Are_Not_A_Fish.mp3",
    source: "ANOMALISTIC REC"
  },
  {
    title: "Papillon Noir", artist: "Oroboro", bpm: 194.7,
    file: "Papillon_Noir.mp3",
    source: "Self-Release"
  },
].map(t => ({ ...t, src: `${AUDIO_BASE}/${t.file}` }));

/* ── player ── */
const audio = new Audio();
audio.crossOrigin = "anonymous";   // needed if serving mp3s from another origin (R2 must send CORS headers)
audio.preload = "metadata";
audio.volume = 0.8;

let idx = -1, ac = null, analyser = null, freq = null, srcNode = null, rafId = null;

const $ = id => document.getElementById(id);
const rowsEl = $('rows'), fillEl = $('fill'), knobEl = $('knob');
const playIcon = $('playIcon');
const PLAY = "M8 5v14l11-7z";
const PAUSE = "M6 5h4v14H6zm8 0h4v14h-4z";

/* build tracklist — textContent only, no untrusted innerHTML */
TRACKS.forEach((t, i) => {
  const row = document.createElement('div');
  row.className = 'row'; row.dataset.i = i;

  const n = document.createElement('span'); n.className = 'n';
  n.textContent = String(i + 1).padStart(2, '0');

  const meta = document.createElement('span'); meta.className = 'meta';
  const tt = document.createElement('span'); tt.className = 'tt'; tt.textContent = t.title;
  const aa = document.createElement('span'); aa.className = 'aa'; aa.textContent = t.artist;
  meta.append(tt, aa);

  const bpm = document.createElement('span'); bpm.className = 'bpm';
  bpm.textContent = t.bpm;

  row.append(n, meta, bpm);
  row.onclick = () => load(i, true);
  rowsEl.appendChild(row);
});

(function buildCredit() {
  const c = $('credit');
  const head = document.createElement('div');
  head.textContent = 'Non-commercial use · credit preserved per licence:';
  c.appendChild(head);
  TRACKS.forEach(t => {
    const line = document.createElement('div');
    line.textContent = `${t.artist} — “${t.title}” · ${t.license} · via ${t.source}`;
    c.appendChild(line);
  });
  const link = document.createElement('a');
  link.href = 'https://trishul.re';
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.textContent = 'trishul.re';
  const foot = document.createElement('div');
  foot.append(link, document.createTextNode(' — har har mahadev'));
  c.appendChild(foot);
})();

function fmt(s) { if (isNaN(s)) return "0:00"; const m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ":" + String(r).padStart(2, '0'); }

function initAudioGraph() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  analyser = ac.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.72;
  freq = new Uint8Array(analyser.frequencyBinCount);
  srcNode = ac.createMediaElementSource(audio);
  srcNode.connect(analyser);
  analyser.connect(ac.destination);
}

function load(i, autoplay) {
  idx = i;
  const t = TRACKS[i];
  audio.src = t.src;
  $('idle').hidden = true; $('np').hidden = false;
  $('npTitle').textContent = t.title;
  $('npArtist').textContent = `${t.artist} · ${t.bpm} bpm · ${t.license}`;
  [...rowsEl.children].forEach(r => r.classList.toggle('active', +r.dataset.i === i));
  if (autoplay) play();
}

async function play() {
  if (idx === -1) return load(0, true);
  initAudioGraph();
  if (ac.state === 'suspended') await ac.resume();
  try { await audio.play(); } catch (e) { /* blocked until gesture */ }
}
function pause() { audio.pause(); }

$('play').onclick = () => audio.paused ? play() : pause();
$('prev').onclick = () => load((idx <= 0 ? TRACKS.length : idx) - 1, true);
$('next').onclick = () => load((idx + 1) % TRACKS.length, true);

audio.addEventListener('play', () => { playIcon.setAttribute('d', PAUSE); $('play').setAttribute('aria-label', 'pause'); if (!rafId) draw(); });
audio.addEventListener('pause', () => { playIcon.setAttribute('d', PLAY); $('play').setAttribute('aria-label', 'play'); });
audio.addEventListener('ended', () => $('next').click());
audio.addEventListener('loadedmetadata', () => $('dur').textContent = fmt(audio.duration));
audio.addEventListener('timeupdate', () => {
  const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  fillEl.style.width = p + '%'; knobEl.style.left = p + '%';
  $('cur').textContent = fmt(audio.currentTime);
  $('track').setAttribute('aria-valuenow', Math.round(p));
});

/* seek */
const trackEl = $('track');
function seekTo(clientX) {
  const r = trackEl.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  if (audio.duration) audio.currentTime = p * audio.duration;
}
trackEl.addEventListener('click', e => seekTo(e.clientX));
trackEl.addEventListener('keydown', e => {
  if (!audio.duration) return;
  if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
  if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
});

$('vol').addEventListener('input', e => audio.volume = e.target.value / 100);

/* keyboard: space = play/pause */
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') { e.preventDefault(); audio.paused ? play() : pause(); }
});

/* ── the prabhamandala: radial spectrum, still centre, ring of fire ── */
const cv = $('viz'), cx = cv.getContext('2d');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CX = 240, CY = 240, R0 = 74;   // inner radius (the still centre)

function draw() {
  rafId = requestAnimationFrame(draw);
  cx.clearRect(0, 0, 480, 480);

  let level = 0;
  if (analyser) { analyser.getByteFrequencyData(freq); }

  const bins = 96;
  const step = (Math.PI * 2) / bins;
  for (let i = 0; i < bins; i++) {
    const fi = Math.floor((i < bins / 2 ? i : bins - 1 - i) / (bins / 2) * (analyser ? freq.length * 0.7 : 1));
    const v = analyser ? freq[fi] / 255 : 0;
    level += v;
    const len = R0 + v * v * 96 + 4;
    const a = -Math.PI / 2 + i * step;
    const x0 = CX + Math.cos(a) * R0, y0 = CY + Math.sin(a) * R0;
    const x1 = CX + Math.cos(a) * len, y1 = CY + Math.sin(a) * len;
    const g = cx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#5a1414');
    g.addColorStop(1, v > 0.55 ? '#e23b3b' : '#9e1d1d');
    cx.strokeStyle = g;
    cx.lineWidth = 2.4;
    cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke();
  }
  level = level / bins;

  const pulse = reduce ? 0 : level * 10;
  cx.beginPath();
  cx.arc(CX, CY, R0 - 8 + pulse, 0, Math.PI * 2);
  cx.strokeStyle = 'rgba(158,29,29,' + (0.35 + level * 0.5) + ')';
  cx.lineWidth = 1.5; cx.stroke();

  cx.beginPath();
  cx.arc(CX, CY, 4 + pulse * 0.4, 0, Math.PI * 2);
  cx.fillStyle = '#e23b3b';
  cx.fill();

  if (audio.paused && level < 0.01) { cancelAnimationFrame(rafId); rafId = null; drawIdle(); }
}
function drawIdle() {
  cx.clearRect(0, 0, 480, 480);
  const bins = 96, step = (Math.PI * 2) / bins;
  for (let i = 0; i < bins; i++) {
    const a = -Math.PI / 2 + i * step;
    const x0 = CX + Math.cos(a) * R0, y0 = CY + Math.sin(a) * R0;
    const x1 = CX + Math.cos(a) * (R0 + 4), y1 = CY + Math.sin(a) * (R0 + 4);
    cx.strokeStyle = '#2a1010'; cx.lineWidth = 2.4; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke();
  }
  cx.beginPath(); cx.arc(CX, CY, R0 - 8, 0, Math.PI * 2);
  cx.strokeStyle = 'rgba(158,29,29,.25)'; cx.lineWidth = 1.5; cx.stroke();
  cx.beginPath(); cx.arc(CX, CY, 4, 0, Math.PI * 2); cx.fillStyle = '#9e1d1d'; cx.fill();
}
drawIdle();

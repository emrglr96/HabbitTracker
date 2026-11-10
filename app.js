/* Ceyda'nın Atölyesi: alışkanlık ve görev takibi. Veriler yalnızca bu cihazda saklanır. */
(() => {
'use strict';

/* ================= yardımcılar ================= */
const KEY = 'ceyda-bahce-v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAYS_LONG = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_S = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const pad = (n) => String(n).padStart(2, '0');
const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const mdow = (d) => (d.getDay() + 6) % 7; // Pazartesi = 0
const weekStart = (d) => addDays(d, -mdow(d));
const fmtShort = (d) => `${d.getDate()} ${MONTHS_S[d.getMonth()]}`;
const fmtLong = (d) => `${DAYS_LONG[mdow(d)]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const pct = (r) => `%${Math.round(r * 100)}`;

/* ================= sabitler ================= */
const XP_HABIT = 10;
const XP_PERFECT = 15;
const XP_BADGE = 25;
const XP_TODO = { s: 5, m: 10, l: 20 };
const SIZE_NAME = { s: 'Küçük', m: 'Orta', l: 'Büyük' };

const TINTS = ['#CFE6B8', '#BFE0EE', '#F9E3A0', '#FBD0AE', '#F8C6CF', '#DCCBF0', '#BDE8D8', '#E7C8AE'];
const EMOJIS = ['🌱', '💧', '📚', '🚶‍♀️', '🏃‍♀️', '🧘‍♀️', '🥗', '😴', '🦷', '💊', '✍️', '🎨', '🎸', '🎹', '🧶', '🪴', '📷', '🍳', '🧁', '☕', '🚴‍♀️', '🏊‍♀️', '💃', '🎧', '🎮', '🧩', '🌍', '🗣️', '💻', '🧹', '🛏️', '💰', '🙏', '💌', '🐈', '🐕', '🌸', '⭐', '🧴', '🍎', '📵', '📝', '🎬', '🧵', '🎤', '♟️', '🌞', '🫖'];

const STARTERS = [
  { emoji: '💧', name: 'Su iç', color: 1, kind: 'habit', freq: { type: 'daily' }, target: 8, unit: 'bardak' },
  { emoji: '📚', name: 'Kitap oku', color: 2, kind: 'habit', freq: { type: 'daily' }, target: 1, unit: '' },
  { emoji: '🚶‍♀️', name: 'Yürüyüş yap', color: 0, kind: 'habit', freq: { type: 'daily' }, target: 1, unit: '' },
  { emoji: '🧘‍♀️', name: 'Esneme hareketleri', color: 5, kind: 'habit', freq: { type: 'daily' }, target: 1, unit: '' },
  { emoji: '😴', name: 'Erken uyu', color: 6, kind: 'habit', freq: { type: 'daily' }, target: 1, unit: '' },
  { emoji: '✍️', name: 'Günlük yaz', color: 7, kind: 'habit', freq: { type: 'daily' }, target: 1, unit: '' },
  { emoji: '🎨', name: 'Resim yap', color: 4, kind: 'hobby', freq: { type: 'weekly', times: 2 }, target: 1, unit: '' },
  { emoji: '🧶', name: 'Örgü ör', color: 3, kind: 'hobby', freq: { type: 'weekly', times: 2 }, target: 1, unit: '' },
  { emoji: '🎸', name: 'Enstrüman çal', color: 2, kind: 'hobby', freq: { type: 'weekly', times: 3 }, target: 1, unit: '' },
  { emoji: '🪴', name: 'Çiçekleri sula', color: 0, kind: 'hobby', freq: { type: 'weekly', times: 2 }, target: 1, unit: '' },
];

// Zanaat unvanları: hangi seviyede hangi unvan
const RANKS = [
  { lvl: 1, name: 'Çırak' },
  { lvl: 3, name: 'Kalfa' },
  { lvl: 6, name: 'Usta' },
  { lvl: 10, name: 'Nakkaş' },
  { lvl: 15, name: 'Başusta' },
  { lvl: 22, name: 'Üstat' },
  { lvl: 30, name: 'Pîr' },
];
// Sırlar: vazonun ana rengi. Unvan yükseldikçe yenileri açılır.
const GLAZES = [
  { id: 'sedef', name: 'Sedef', lvl: 1, rgb: [0.93, 0.91, 0.85] },
  { id: 'seladon', name: 'Seladon', lvl: 3, rgb: [0.6, 0.76, 0.66] },
  { id: 'turkuaz', name: 'Turkuaz', lvl: 6, rgb: [0.1, 0.58, 0.6] },
  { id: 'kobalt', name: 'Kobalt', lvl: 10, rgb: [0.15, 0.26, 0.62] },
  { id: 'mercan', name: 'Mercan', lvl: 15, rgb: [0.8, 0.28, 0.2] },
  { id: 'gece', name: 'Gece', lvl: 22, rgb: [0.11, 0.1, 0.14] },
  { id: 'yaldiz', name: 'Yaldız', lvl: 30, rgb: [0.8, 0.62, 0.25] },
];
// Alışkanlık renklerinin vazoya karışan koyu tonları
const DEEP = [[0.5, 0.69, 0.41], [0.36, 0.66, 0.79], [0.9, 0.73, 0.24], [0.93, 0.56, 0.33], [0.9, 0.48, 0.56], [0.62, 0.48, 0.85], [0.3, 0.71, 0.63], [0.73, 0.52, 0.34]];
const css = (rgb) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(',')})`;

const BADGES = [
  { id: 'first', icon: '🏺', name: 'İlk Halka', desc: 'İlk alışkanlığını tamamla', test: (c) => c.totalDone >= 1 },
  { id: 'todo1', icon: '✅', name: 'Bir Çizik', desc: 'İlk görevini bitir', test: (c) => c.todosDone >= 1 },
  { id: 'perfect1', icon: '🌟', name: 'Kusursuz Gün', desc: 'Bir günde hepsini tamamla', test: (c) => c.perfectDays >= 1 },
  { id: 's3', icon: '✨', name: 'Kıvılcım', desc: '3 günlük seri', test: (c) => c.bestStreak >= 3 },
  { id: 's7', icon: '🔥', name: 'Alev Aldı', desc: '7 günlük seri', test: (c) => c.bestStreak >= 7 },
  { id: 's14', icon: '🏕️', name: 'Kamp Ateşi', desc: '14 günlük seri', test: (c) => c.bestStreak >= 14 },
  { id: 's30', icon: '🌋', name: 'Sönmeyen Ateş', desc: '30 günlük seri', test: (c) => c.bestStreak >= 30 },
  { id: 's100', icon: '👑', name: 'Efsane Alev', desc: '100 günlük seri', test: (c) => c.bestStreak >= 100 },
  { id: 'perfect7', icon: '🌈', name: 'Kusursuz Hafta', desc: 'Art arda 7 kusursuz gün', test: (c) => c.bestPerfectRun >= 7 },
  { id: 'd50', icon: '🎯', name: 'Elli Oldu', desc: '50 alışkanlık tamamla', test: (c) => c.totalDone >= 50 },
  { id: 'd250', icon: '💯', name: 'Durdurulamaz', desc: '250 alışkanlık tamamla', test: (c) => c.totalDone >= 250 },
  { id: 'todo25', icon: '🏹', name: 'Görev Avcısı', desc: '25 görev bitir', test: (c) => c.todosDone >= 25 },
  { id: 'hobby10', icon: '🎨', name: 'Hobi Sever', desc: 'Hobilerine 10 kez vakit ayır', test: (c) => c.hobbyDone >= 10 },
  { id: 'kintsugi', icon: '⚜️', name: 'Altın Damar', desc: 'Kaçan bir günden sonra geri dön', test: (c) => c.goldSeams >= 1 },
  { id: 'l5', icon: '🤲', name: 'Eli Kile Yatkın', desc: '5. seviyeye ulaş', test: (c) => c.level >= 5 },
  { id: 'l10', icon: '🖌️', name: 'Nakkaş Mührü', desc: '10. seviyeye ulaş', test: (c) => c.level >= 10 },
];

/* ================= durum ================= */
const blank = () => ({ v: 1, name: 'Ceyda', habits: [], todos: [], xpBank: 0, celebratedLevel: 1, badges: {}, glazes: {}, seenMonth: '', theme: 'auto', onboarded: false });

function normalize(raw) {
  const s = Object.assign(blank(), raw && typeof raw === 'object' ? raw : {});
  s.habits = (Array.isArray(s.habits) ? s.habits : []).filter((h) => h && h.id && h.name).map((h) => ({
    id: String(h.id), name: String(h.name), emoji: h.emoji || '🌱', color: clamp(h.color | 0, 0, TINTS.length - 1),
    kind: h.kind === 'hobby' ? 'hobby' : 'habit',
    freq: {
      type: ['daily', 'days', 'weekly'].includes(h.freq && h.freq.type) ? h.freq.type : 'daily',
      days: Array.isArray(h.freq && h.freq.days) ? h.freq.days.filter((n) => n >= 0 && n <= 6) : [0, 1, 2, 3, 4],
      times: clamp((h.freq && h.freq.times) | 0 || 3, 1, 6),
    },
    target: clamp(h.target | 0 || 1, 1, 99), unit: String(h.unit || ''),
    createdAt: /^\d{4}-\d{2}-\d{2}$/.test(h.createdAt) ? h.createdAt : dkey(today()),
    log: h.log && typeof h.log === 'object' ? h.log : {},
  }));
  s.todos = (Array.isArray(s.todos) ? s.todos : []).filter((t) => t && t.id && t.title).map((t) => ({
    id: String(t.id), title: String(t.title), due: t.due || null, size: XP_TODO[t.size] ? t.size : 'm',
    done: !!t.done, doneAt: t.done ? (t.doneAt || dkey(today())) : null, createdAt: t.createdAt || dkey(today()),
  }));
  s.badges = s.badges && typeof s.badges === 'object' ? s.badges : {};
  s.glazes = s.glazes && typeof s.glazes === 'object' ? s.glazes : {};
  s.seenMonth = typeof s.seenMonth === 'string' ? s.seenMonth : '';
  s.xpBank = Math.max(0, s.xpBank | 0);
  s.celebratedLevel = Math.max(1, s.celebratedLevel | 0);
  s.name = String(s.name || 'Ceyda').slice(0, 24);
  if (!['auto', 'light', 'dark'].includes(s.theme)) s.theme = 'auto';
  return s;
}

let storageOk = true;
function load() {
  try { return normalize(JSON.parse(localStorage.getItem(KEY))); }
  catch (e) { return blank(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }
  catch (e) { if (storageOk) { storageOk = false; toast('⚠️', 'Kaydedilemedi', 'Tarayıcı depolamaya izin vermiyor'); } }
}

let S = load();
const ui = { tab: 'today', day: today(), statsMode: 'week', statsOff: 0, pick: null, showDone: false, flash: null, vaseYm: null };
let memo = null;
let draft = null;

const findH = (id) => S.habits.find((h) => h.id === id);
const findT = (id) => S.todos.find((t) => t.id === id);

/* ================= alışkanlık mantığı ================= */
const cnt = (h, k) => h.log[k] || 0;
const isDone = (h, k) => cnt(h, k) >= h.target;
const isWeekly = (h) => h.freq.type === 'weekly';

// Sabit programlı alışkanlık o gün bekleniyor mu?
function isSched(h, d) {
  if (dkey(d) < h.createdAt) return false;
  if (h.freq.type === 'daily') return true;
  if (h.freq.type === 'days') return h.freq.days.includes(mdow(d));
  return false;
}
// O gün listede görünsün mü? (haftalık hedefliler her gün görünür)
function showsOn(h, d) {
  if (dkey(d) < h.createdAt) return false;
  return isWeekly(h) ? true : isSched(h, d);
}
function weekCount(h, ws) {
  let n = 0;
  for (let i = 0; i < 7; i++) if (isDone(h, dkey(addDays(ws, i)))) n++;
  return n;
}

// Güncel seri. Bugün henüz yapılmadıysa seri bozulmaz, dünden sayılır.
function streakOf(h) {
  const t = today();
  let n = 0;
  if (isWeekly(h)) {
    const firstWeek = weekStart(parse(h.createdAt));
    for (let ws = weekStart(t); ws >= firstWeek; ws = addDays(ws, -7)) {
      if (weekCount(h, ws) >= h.freq.times) n++;
      else if (ws.getTime() !== weekStart(t).getTime()) break;
    }
    return { n, unit: 'hafta' };
  }
  const first = parse(h.createdAt);
  for (let d = t; d >= first; d = addDays(d, -1)) {
    if (!isSched(h, d)) continue;
    if (isDone(h, dkey(d))) n++;
    else if (d.getTime() !== t.getTime()) break;
  }
  return { n, unit: 'gün' };
}
function bestStreakOf(h) {
  const t = today();
  let best = 0, run = 0;
  if (isWeekly(h)) {
    for (let ws = weekStart(parse(h.createdAt)); ws <= t; ws = addDays(ws, 7)) {
      if (weekCount(h, ws) >= h.freq.times) { run++; best = Math.max(best, run); } else run = 0;
    }
    return best;
  }
  for (let d = parse(h.createdAt); d <= t; d = addDays(d, 1)) {
    if (!isSched(h, d)) continue;
    if (isDone(h, dkey(d))) { run++; best = Math.max(best, run); } else run = 0;
  }
  return best;
}
const totalDoneOf = (h) => Object.keys(h.log).filter((k) => isDone(h, k)).length;

function freqLabel(h) {
  if (h.freq.type === 'daily') return 'Her gün';
  if (h.freq.type === 'weekly') return `Haftada ${h.freq.times} kez`;
  if (h.freq.days.length === 7) return 'Her gün';
  return [...h.freq.days].sort().map((i) => DAYS[i]).join(', ');
}

/* ================= XP, seviye, rozet ================= */
const needFor = (n) => (n - 1) * (40 + 10 * n); // n. seviyeye ulaşmak için gereken toplam XP
function levelInfo(xp) {
  let level = 1;
  while (xp >= needFor(level + 1)) level++;
  const base = needFor(level), next = needFor(level + 1);
  return { level, into: xp - base, span: next - base, pct: (xp - base) / (next - base), left: next - xp };
}
function rankOf(level) {
  let i = 0;
  RANKS.forEach((r, idx) => { if (level >= r.lvl) i = idx; });
  return i;
}
const ymOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const kilnTemp = (streak) => (streak > 0 ? Math.min(1280, 560 + streak * 36) : 0);

function derive() {
  if (memo) return memo;
  const t = today(), tk = dkey(t);
  const xp = {};
  const add = (k, v) => { xp[k] = (xp[k] || 0) + v; };
  const active = new Set();
  let totalDone = 0, hobbyDone = 0, bestStreak = 0;

  for (const h of S.habits) {
    for (const k in h.log) {
      if (h.log[k] >= h.target) { add(k, XP_HABIT); totalDone++; active.add(k); if (h.kind === 'hobby') hobbyDone++; }
    }
    if (!isWeekly(h)) bestStreak = Math.max(bestStreak, bestStreakOf(h));
  }

  // Kusursuz günler: o gün beklenen bütün alışkanlıklar tamam
  const fixed = S.habits.filter((h) => !isWeekly(h));
  const perfect = new Set();
  let bestPerfectRun = 0, run = 0, goldSeams = 0, pendingMiss = 0;
  if (fixed.length) {
    const first = fixed.reduce((m, h) => (h.createdAt < m ? h.createdAt : m), tk);
    for (let d = parse(first); d <= t; d = addDays(d, 1)) {
      const k = dkey(d);
      const sc = fixed.filter((h) => isSched(h, d));
      if (!sc.length) continue;
      if (active.has(k)) { goldSeams += pendingMiss; pendingMiss = 0; } else if (k !== tk) pendingMiss++;
      if (sc.every((h) => isDone(h, k))) { perfect.add(k); add(k, XP_PERFECT); run++; bestPerfectRun = Math.max(bestPerfectRun, run); }
      else if (k !== tk) run = 0;
    }
  }

  let todosDone = 0;
  for (const td of S.todos) if (td.done) { add(td.doneAt, XP_TODO[td.size]); todosDone++; }
  for (const id in S.badges) add(S.badges[id], XP_BADGE);

  // Genel seri: en az bir alışkanlığın tamamlandığı art arda günler
  let streak = 0;
  for (let d = t, i = 0; i < 3660; d = addDays(d, -1), i++) {
    if (active.has(dkey(d))) streak++;
    else if (i !== 0) break;
  }
  let bestDayRun = 0, r = 0, prev = null;
  [...active].sort().forEach((k) => {
    r = prev && dkey(addDays(parse(prev), 1)) === k ? r + 1 : 1;
    bestDayRun = Math.max(bestDayRun, r); prev = k;
  });
  bestStreak = Math.max(bestStreak, bestDayRun);

  const total = Object.values(xp).reduce((a, b) => a + b, 0) + S.xpBank;
  const lvl = levelInfo(total);
  memo = {
    xp, total, lvl, perfect, streak, litToday: active.has(tk),
    ctx: { totalDone, hobbyDone, bestStreak, perfectDays: perfect.size, bestPerfectRun, todosDone, goldSeams, level: lvl.level },
  };
  return memo;
}

function checkBadges() {
  const fresh = [];
  for (let pass = 0; pass < 3; pass++) {
    memo = null;
    const c = derive().ctx;
    let any = false;
    for (const b of BADGES) {
      if (!S.badges[b.id] && b.test(c)) { S.badges[b.id] = dkey(today()); fresh.push(b); any = true; }
    }
    if (!any) break;
  }
  memo = null;
  return fresh;
}

// Her değişiklikten sonra: rozetleri denetle, kaydet, çiz, kutla
function after() {
  const fresh = checkBadges();
  save();
  render();
  if (fresh.length) setTimeout(() => { fresh.forEach((b) => toast(b.icon, `Rozet kazandın: ${b.name}`, `+${XP_BADGE} XP`)); buzz(15); }, 600);
  const lv = derive().lvl.level;
  if (lv > S.celebratedLevel) {
    const from = S.celebratedLevel;
    S.celebratedLevel = lv; save();
    setTimeout(() => levelUp(from, lv), 750);
  }
}

/* ================= günlük ve dönem istatistikleri ================= */
function dayInfo(d) {
  const k = dkey(d);
  let sched = 0, done = 0;
  for (const h of S.habits) {
    if (isWeekly(h)) { if (isDone(h, k)) { sched++; done++; } }
    else if (isSched(h, d)) { sched++; if (isDone(h, k)) done++; }
  }
  return { k, d, sched, done, rate: sched ? done / sched : null };
}
function periodStats(start, end) {
  const t = today(), D = derive();
  const days = [];
  let sched = 0, done = 0, perfect = 0, xp = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const future = d > t;
    const info = future ? { k: dkey(d), d, sched: 0, done: 0, rate: null } : dayInfo(d);
    info.future = future;
    info.xp = D.xp[info.k] || 0;
    info.perfect = D.perfect.has(info.k);
    days.push(info);
    sched += info.sched; done += info.done; xp += info.xp;
    if (info.perfect) perfect++;
  }
  const sk = dkey(start), ek = dkey(end);
  const todos = S.todos.filter((x) => x.done && x.doneAt >= sk && x.doneAt <= ek).length;
  return { days, sched, done, rate: sched ? done / sched : null, perfect, xp, todos };
}
// Bir alışkanlığın dönem içindeki karnesi
function habitPeriod(h, start, end) {
  const t = today();
  const last = end > t ? t : end;
  const first = parse(h.createdAt) > start ? parse(h.createdAt) : start;
  let done = 0, exp = 0;
  for (let d = start; d <= last; d = addDays(d, 1)) {
    const k = dkey(d);
    if (isWeekly(h)) { if (isDone(h, k)) done++; }
    else if (isSched(h, d)) { exp++; if (isDone(h, k)) done++; }
  }
  if (isWeekly(h)) {
    const span = Math.round((last - first) / 864e5) + 1;
    exp = span > 0 ? Math.max(1, Math.round((h.freq.times * span) / 7)) : 0;
    if (span > 0 && Math.round((end - start) / 864e5) <= 6) exp = h.freq.times;
  }
  return { done, exp, rate: exp ? Math.min(1, done / exp) : null };
}

/* ================= çizimler ================= */
const ICON = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function flame(size, lit, animate) {
  return `<svg class="flame ${lit ? (animate ? 'lit' : '') : 'off'}" viewBox="0 0 24 28" width="${size}" height="${Math.round(size * 28 / 24)}" aria-hidden="true"><path class="f-out" d="M12 1c1 5 7 8 7 16a7 7 0 0 1-14 0c0-4 2-6 3-9 1 2 2 3 3 3 0-4 0-7 1-10z"/><path class="f-in" d="M12 13c1 3 3.500 4 3.500 7a3.500 3.500 0 0 1-7 0c0-2 1.500-3 3.500-7z"/></svg>`;
}

/* ================= vazo ================= */
// Bir ayın günlerinden vazo modeli: her gün bir halka.
function vaseModel(y, m) {
  const t = today(), D = derive();
  const n = new Date(y, m + 1, 0).getDate();
  const cur = y === t.getFullYear() && m === t.getMonth();
  const upto = new Date(y, m, 1) > t ? 0 : cur ? t.getDate() : n;
  const ym = `${y}-${pad(m + 1)}`;
  const glaze = GLAZES.find((g) => g.id === S.glazes[ym]) || GLAZES[0];
  const rings = [];
  let lastActive = -1, sumRate = 0, rated = 0;
  for (let i = 0; i < upto; i++) {
    const d = new Date(y, m, i + 1), k = dkey(d);
    let sched = 0, done = 0;
    const mix = [0, 0, 0];
    for (const h of S.habits) {
      const dn = isDone(h, k);
      if (isWeekly(h)) { if (dn) sched++; } else if (isSched(h, d)) sched++;
      if (dn) { done++; const c = DEEP[h.color]; mix[0] += c[0]; mix[1] += c[1]; mix[2] += c[2]; }
    }
    const isT = cur && i === upto - 1;
    const rate = sched ? Math.min(1, done / sched) : null;
    const col = done ? glaze.rgb.map((g, q) => g * 0.74 + (mix[q] / done) * 0.26) : glaze.rgb.slice();
    const missed = sched > 0 && done === 0 && !isT;
    if (done) lastActive = i;
    if (rate != null && !(isT && !done)) { sumRate += rate; rated++; }
    rings.push({ f: rate == null ? null : missed ? 0.05 : rate, col, missed, perfect: D.perfect.has(k), wet: isT, gold: false, open: false });
  }
  let gold = 0, open = 0, perfect = 0;
  rings.forEach((r, i) => {
    if (r.missed) { if (i < lastActive) { r.gold = true; gold++; } else { r.open = true; open++; } }
    if (r.perfect) perfect++;
  });
  const shape = (y * 12 + m) % window.Vase.shapes.length;
  return { n, shape, rings, ym, glaze, gold, open, perfect, cur, upto, rate: rated ? sumRate / rated : null, has: lastActive >= 0, title: `${MONTHS[m]} ${y}`, shapeName: window.Vase.shapes[shape] };
}
const curModel = () => { const t = today(); return vaseModel(t.getFullYear(), t.getMonth()); };
function isDark() {
  const a = document.documentElement.getAttribute('data-theme');
  return a ? a === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
}
const fireLevel = (streak) => (streak > 0 ? 0.22 + 0.78 * Math.min(1, streak / 21) : 0);

const thumbCache = {};
function thumbFor(ym) {
  const [y, m] = ym.split('-').map(Number);
  const model = vaseModel(y, m - 1), dark = isDark();
  const key = ym + (dark ? 'd' : 'l') + model.glaze.id + model.rings.map((r) => `${r.f == null ? 'n' : Math.round(r.f * 20)}${r.gold ? 'g' : r.open ? 'o' : ''}${r.perfect ? 'p' : ''}${r.wet ? 'w' : ''}${Math.round(r.col[0] * 30)}${Math.round(r.col[2] * 30)}`).join('.');
  if (!thumbCache[key]) thumbCache[key] = window.Vase.thumb(model, 224, 292, { dark, fire: 0 });
  return thumbCache[key];
}
// Çizimden sonra: vazoyu sahneye yerleştir, küçük resimleri doldur
function mountVase() {
  if (!window.Vase) return;
  const slot = $('.vase-slot');
  if (slot) {
    const t = today();
    const [y, m] = ui.vaseYm && ui.tab === 'garden' ? ui.vaseYm.split('-').map(Number) : [t.getFullYear(), t.getMonth() + 1];
    const model = vaseModel(y, m - 1);
    window.Vase.mount(slot, model, { fire: fireLevel(derive().streak), dark: isDark(), label: `${model.title} vazosu, ${model.shapeName}. Döndürmek için sürükle.` });
  }
  document.querySelectorAll('img[data-thumb]').forEach((img) => { const src = thumbFor(img.dataset.thumb); if (src) img.src = src; });
}
// Vazosu olan aylar: ilk kayıttan bu aya
function vaseMonths() {
  const t = today();
  if (!S.habits.length) return [ymOf(t)];
  const first = S.habits.reduce((mn, h) => (h.createdAt < mn ? h.createdAt : mn), dkey(t));
  const out = [];
  let d = new Date(t.getFullYear(), t.getMonth(), 1);
  const stop = parse(first.slice(0, 8) + '01');
  for (let i = 0; i < 36 && d >= stop; i++) { out.push(ymOf(d)); d = new Date(d.getFullYear(), d.getMonth() - 1, 1); }
  return out;
}

/* ================= küçük etkiler ================= */
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* desteklenmiyor */ } }

// Bildirimler sırayla, birer birer gösterilir
const toastQ = [];
let toastBusy = false;
function toast(icon, title, sub) { toastQ.push([icon, title, sub]); pumpToast(); }
function pumpToast() {
  if (toastBusy || !toastQ.length) return;
  toastBusy = true;
  const [icon, title, sub] = toastQ.shift();
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="ti">${icon}</span><span>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => { el.remove(); toastBusy = false; pumpToast(); }, 260);
  }, toastQ.length ? 1700 : 2800);
}

function xpFloat(ev, text) {
  let x = ev && ev.clientX, y = ev && ev.clientY;
  if (!x && !y && ev && ev.target && ev.target.getBoundingClientRect) {
    const r = ev.target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top;
  }
  const el = document.createElement('div');
  el.className = 'xp-float';
  el.textContent = text;
  el.style.left = `${clamp(x || innerWidth / 2, 50, innerWidth - 50)}px`;
  el.style.top = `${(y || innerHeight / 2) - 20}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#confetti');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
  const ctx = cv.getContext('2d');
  const cols = ['#DDB04A', '#F2CD75', '#0B7F7C', '#2343A6', '#D9512C', '#F4EFE2'];
  const ps = Array.from({ length: 90 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.5, y: H * 0.38,
    vx: (Math.random() - 0.5) * 14 * dpr, vy: (-Math.random() * 13 - 4) * dpr,
    s: (5 + Math.random() * 6) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: cols[(Math.random() * cols.length) | 0], round: Math.random() < 0.4,
  }));
  const t0 = performance.now();
  (function frame(now) {
    const el = now - t0;
    ctx.clearRect(0, 0, W, H);
    if (el > 1900) return;
    for (const p of ps) {
      p.vy += 0.45 * dpr; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - el / 1900); ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  })(t0);
}

function overlay(html) {
  const el = document.createElement('div');
  el.className = 'levelup';
  el.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}<button class="btn block" data-act="close-levelup">Harika</button></div>`;
  document.body.appendChild(el);
  const b = $('button', el); if (b) b.focus();
}
function levelUp(from, to) {
  const rFrom = rankOf(from), rTo = rankOf(to), next = RANKS[rTo + 1];
  const fresh = GLAZES.filter((g) => g.lvl > from && g.lvl <= to).pop();
  let html;
  if (rTo > rFrom) {
    html = `<div class="eyebrow">Yeni unvan</div><h2>${RANKS[rTo].name}</h2>
      ${fresh ? `<div class="glaze on"><i style="--g:${css(fresh.rgb)}"></i>${fresh.name} sırı açıldı</div>` : ''}
      <p>Seviye ${to}. Elin kile alıştı, çark artık seni tanıyor.</p>`;
  } else {
    html = `<div class="eyebrow">Seviye atladın</div><div class="big-num num">${to}</div>
      <p>${next ? `${next.name} olmana ${next.lvl - to} seviye kaldı.` : 'Bu atölyenin pîri sensin.'}</p>`;
  }
  overlay(html);
  confetti(); buzz([30, 50, 30, 50, 60]);
}
// Ay döndüğünde: geçen ayın vazosu fırından çıkar
function monthReveal() {
  const now = ymOf(today()), prev = S.seenMonth;
  if (prev === now) return;
  S.seenMonth = now; save();
  if (!prev || prev > now || !window.Vase) return;
  const [y, m] = prev.split('-').map(Number);
  const model = vaseModel(y, m - 1);
  if (!model.has) return;
  const bits = [];
  if (model.rate != null) bits.push(`${pct(model.rate)} dolu`);
  if (model.perfect) bits.push(`${model.perfect} kusursuz gün`);
  if (model.gold) bits.push(`${model.gold} altın damar`);
  overlay(`<div class="eyebrow">Fırından çıktı</div><h2 style="font-size:32px">${MONTHS[m - 1]} vazosu</h2>
    <div class="reveal"><img src="${thumbFor(prev)}" alt="${model.title} vazosu"></div>
    <p>${model.shapeName}. ${bits.join(', ')}. Rafındaki yerini aldı, çarkta yeni bir ay başlıyor.</p>`);
  confetti();
}

function applyTheme() {
  const r = document.documentElement;
  if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
  const bg = getComputedStyle(r).getPropertyValue('--bg').trim();
  const m = $('#themeColor'); if (m && bg) m.setAttribute('content', bg);
}

/* ================= görünümler ================= */
function dueLabel(td) {
  if (!td.due) return 'Tarihsiz';
  const t = today(), tk = dkey(t);
  if (td.due === tk) return 'Bugün';
  if (td.due === dkey(addDays(t, 1))) return 'Yarın';
  if (td.due === dkey(addDays(t, -1))) return 'Dün';
  const d = parse(td.due);
  return `${DAYS[mdow(d)]} ${fmtShort(d)}`;
}

function habitCard(h, d) {
  const k = dkey(d), c = cnt(h, k), done = c >= h.target, st = streakOf(h);
  const subs = [`<span class="st ${st.n ? '' : 'zero'}">${flame(14, st.n > 0, false)}<span class="num">${st.n}</span> ${st.unit}</span>`];
  if (h.target > 1) subs.push(`<span class="num">${c}/${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>`);
  if (isWeekly(h)) subs.push(`<span class="num">Bu hafta ${weekCount(h, weekStart(d))}/${h.freq.times}</span>`);
  if (h.kind === 'hobby') subs.push('<span class="chip">Hobi</span>');
  const control = h.target > 1
    ? `<div class="counter">${c > 0 ? `<button class="minus" data-act="dec" data-id="${h.id}" aria-label="${esc(h.name)}: bir azalt">−</button>` : ''}<button class="ringbtn ${done ? 'on' : ''}" style="--p:${Math.min(100, (c / h.target) * 100)}" data-act="inc" data-id="${h.id}" aria-label="${esc(h.name)}: bir ekle"><span>${done ? ICON.check : '+1'}</span></button></div>`
    : `<button class="check ${done ? 'on' : ''}" data-act="toggle" data-id="${h.id}" aria-pressed="${done}" aria-label="${esc(h.name)}: ${done ? 'geri al' : 'tamamla'}">${ICON.check}</button>`;
  return `<article class="habit ${done ? 'is-done' : ''} ${ui.flash === h.id ? 'just-done' : ''}" style="--tint:${TINTS[h.color]}">
    <button class="habit-open" data-act="edit-habit" data-id="${h.id}" aria-label="${esc(h.name)}: düzenle">
      <span class="emoji">${h.emoji}</span>
      <span class="grow"><span class="habit-name">${esc(h.name)}</span><span class="habit-sub">${subs.join('')}</span></span>
    </button>${control}
  </article>`;
}

function todoRow(td, showDue) {
  const tk = dkey(today());
  const chips = [];
  if (!td.done && td.due && td.due < tk) chips.push(`<span class="chip late">Gecikti · ${dueLabel(td)}</span>`);
  else if (showDue && !td.done) chips.push(`<span class="chip">${dueLabel(td)}</span>`);
  chips.push(`<span class="chip gold num">${td.done ? '' : '+'}${XP_TODO[td.size]} XP</span>`);
  return `<div class="todo ${td.done ? 'is-done' : ''} ${ui.flash === td.id ? 'just-done' : ''}">
    <button class="tick" data-act="toggle-todo" data-id="${td.id}" aria-pressed="${td.done}" aria-label="${esc(td.title)}: ${td.done ? 'geri al' : 'tamamla'}"><i>${ICON.check}</i></button>
    <button class="todo-body" data-act="edit-todo" data-id="${td.id}"><span class="todo-title">${esc(td.title)}</span><span class="todo-meta">${chips.join('')}</span></button>
  </div>`;
}

const PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round"/></svg>';

const quickForm = (id) => `<form class="quick" data-form="quick-todo" autocomplete="off">
  <input class="field" id="${id}" name="title" placeholder="Yeni görev yaz" maxlength="120" enterkeyhint="done" aria-label="Yeni görev">
  <button class="btn" type="submit" aria-label="Görevi ekle"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>
</form>`;

function kilnChip(D) {
  const temp = kilnTemp(D.streak);
  return `<div class="kiln" role="img" aria-label="Seri ${D.streak} gün${temp ? `, fırın ${temp} derece` : ', fırın soğuk'}">${flame(22, D.streak > 0, D.litToday)}<b>${D.streak}</b><span><small>gün seri</small><small class="num">${temp ? `fırın ${temp}°` : 'fırın soğuk'}</small></span></div>`;
}
function rankFoot(D, tag) {
  const r = RANKS[rankOf(D.lvl.level)];
  const inner = `<span class="lvl-row"><span class="lvl-title">${r.name} <i>· Seviye ${D.lvl.level}</i></span><span class="xp-meta num">${D.lvl.into} / ${D.lvl.span} XP</span></span>
    <span class="xpbar"><i style="width:${Math.round(D.lvl.pct * 100)}%"></i></span>`;
  return tag === 'button'
    ? `<button class="stage-foot" data-act="tab" data-tab="garden" aria-label="Atölye: ${r.name}, seviye ${D.lvl.level}">${inner}</button>`
    : `<div class="stage-foot">${inner}</div>`;
}
function stageHero(D) {
  const M = curModel();
  return `<section class="stage">
    <div class="vase-slot"></div>
    <div class="plate"><span class="eyebrow">${MONTHS[today().getMonth()]} vazosu</span><b>${M.shapeName}</b><span class="num">${M.upto}. halka / ${M.n}</span></div>
    ${kilnChip(D)}
    ${rankFoot(D, 'button')}
  </section>`;
}

function renderToday() {
  const D = derive(), t = today(), tk = dkey(t), d = ui.day, k = dkey(d), isT = k === tk;
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const list = S.habits.filter((h) => showsOn(h, d));
  const doneN = list.filter((h) => isDone(h, k)).length;

  const ws = weekStart(t);
  let strip = '';
  for (let i = 0; i < 7; i++) {
    const x = addDays(ws, i), xk = dkey(x), fut = x > t;
    const info = fut ? { rate: null } : dayInfo(x);
    const p = info.rate == null ? 0 : Math.round(info.rate * 100);
    strip += `<button class="wday ${xk === k ? 'sel' : ''} ${xk === tk ? 'today' : ''} ${p === 100 ? 'full' : ''}" data-act="day" data-k="${xk}" ${fut ? 'disabled' : ''} aria-label="${fmtLong(x)}${fut ? '' : `, ${pct(p / 100)} tamamlandı`}" aria-pressed="${xk === k}">
      <span class="dname">${DAYS[i]}</span><span class="ring" style="--p:${p}"><span>${x.getDate()}</span></span></button>`;
  }

  let habitsHtml;
  if (!S.habits.length) {
    habitsHtml = `<div class="empty dashed"><h3>Çark boş dönüyor</h3><p>Bir alışkanlık ya da hobi ekle. İşaretlediğin her gün vazona bir halka olur.</p><button class="btn sm" data-act="new-habit">Alışkanlık ekle</button></div>`;
  } else if (!list.length) {
    habitsHtml = `<div class="empty dashed"><p>${isT ? 'Bugün için planlı alışkanlık yok. Keyfine bak.' : 'Bu gün için planlı alışkanlık yoktu.'}</p></div>`;
  } else {
    habitsHtml = list.map((h) => habitCard(h, d)).join('');
    if (doneN === list.length) habitsHtml += `<p class="small muted" style="text-align:center;padding-top:2px">${isT ? 'Bugünün halkası tam genişliğinde.' : 'Bu günün halkası tam.'}</p>`;
  }

  let todos;
  if (isT) {
    const open = S.todos.filter((x) => !x.done && x.due && x.due <= tk).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
    todos = open.concat(S.todos.filter((x) => x.done && x.doneAt === tk));
  } else {
    todos = S.todos.filter((x) => x.done && x.doneAt === k);
  }
  const todoDone = todos.filter((x) => x.done).length;
  const todosHtml = todos.length
    ? `<div class="todo-list">${todos.map((x) => todoRow(x, false)).join('')}</div>`
    : `<div class="empty dashed"><p>${isT ? 'Bugün için görev yok. Aklına geleni yukarıya yaz.' : 'Bu gün tamamlanan görev yok.'}</p></div>`;

  return `
  <header class="hello">
    <div class="grow"><p class="eyebrow date">${fmtLong(t)}</p><h1>${greet}, <em>${esc(S.name)}</em></h1></div>
  </header>
  ${stageHero(D)}
  <div class="week" role="group" aria-label="Bu hafta">${strip}</div>
  <section class="section">
    <div class="sec-head"><h2>${isT ? 'Alışkanlıklar' : fmtLong(d)}</h2>
      ${isT ? `<span class="row">${list.length ? `<span class="count num">${doneN}/${list.length}</span>` : ''}<button class="add-mini" data-act="new-habit" aria-label="Alışkanlık ekle">${PLUS}</button></span>` : '<button class="link-btn" data-act="go-today">Bugüne dön</button>'}</div>
    ${habitsHtml}
  </section>
  <section class="section">
    <div class="sec-head"><h2>${isT ? 'Bugünün görevleri' : 'Tamamlanan görevler'}</h2>${todos.length ? `<span class="count num">${todoDone}/${todos.length}</span>` : ''}</div>
    ${isT ? quickForm('quickToday') : ''}
    ${todosHtml}
  </section>`;
}

function renderHabits() {
  const t = today();
  const card = (h) => {
    const st = streakOf(h);
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const x = addDays(t, -i), xk = dkey(x);
      dots += `<i class="${isDone(h, xk) ? 'on' : (isWeekly(h) || !isSched(h, x)) ? 'off' : ''}"></i>`;
    }
    const sub = [`<span>${freqLabel(h)}</span>`];
    if (h.target > 1) sub.push(`<span>Günde ${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>`);
    return `<article class="habit" style="--tint:${TINTS[h.color]}">
      <button class="habit-open" data-act="edit-habit" data-id="${h.id}" aria-label="${esc(h.name)}: düzenle">
        <span class="emoji">${h.emoji}</span>
        <span class="grow"><span class="habit-name">${esc(h.name)}</span><span class="habit-sub">${sub.join('<span aria-hidden="true">·</span>')}</span>
          <span class="dots7" style="margin-top:7px" role="img" aria-label="Son 7 gün">${dots}</span></span>
        <span class="streak-col">${flame(26, st.n > 0, false)}<b class="num">${st.n}</b><small>${st.unit}</small></span>
      </button>
    </article>`;
  };
  const habits = S.habits.filter((h) => h.kind === 'habit'), hobbies = S.habits.filter((h) => h.kind === 'hobby');
  const group = (title, arr) => arr.length ? `<section class="section"><div class="sec-head"><h2>${title}</h2><span class="count num">${arr.length}</span></div>${arr.map(card).join('')}</section>` : '';
  const body = S.habits.length
    ? group('Alışkanlıklar', habits) + group('Hobiler', hobbies) + '<p class="hint" style="text-align:center">Kutucuklar son 7 günü gösterir. Düzenlemek için karta dokun.</p>'
    : `<div class="empty dashed"><h3>Henüz kil yok</h3><p>Su içmek, kitap okumak, resim yapmak… Takip etmek istediğin ilk şeyi ekle.</p><button class="btn sm" data-act="new-habit">Alışkanlık ekle</button></div>`;
  return `<header class="page-head"><div><h1>Alışkanlıklar</h1><p class="sub">${S.habits.length ? `${habits.length} alışkanlık, ${hobbies.length} hobi` : 'Alışkanlıkların ve hobilerin burada durur'}</p></div><button class="btn sm" data-act="new-habit">${PLUS}Ekle</button></header>${body}`;
}

function renderTodos() {
  const t = today(), tk = dkey(t), tmk = dkey(addDays(t, 1));
  const open = S.todos.filter((x) => !x.done);
  const byDue = (a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0);
  const groups = [
    ['Gecikenler', open.filter((x) => x.due && x.due < tk).sort(byDue), false],
    ['Bugün', open.filter((x) => x.due === tk), false],
    ['Yarın', open.filter((x) => x.due === tmk), false],
    ['Yaklaşanlar', open.filter((x) => x.due && x.due > tmk).sort(byDue), true],
    ['Tarihsiz', open.filter((x) => !x.due), false],
  ];
  let body = groups.filter((g) => g[1].length).map(([title, arr, showDue]) =>
    `<section class="section"><div class="sec-head"><h2>${title}</h2><span class="count num">${arr.length}</span></div><div class="todo-list">${arr.map((x) => todoRow(x, showDue)).join('')}</div></section>`).join('');
  const done = S.todos.filter((x) => x.done).sort((a, b) => (a.doneAt < b.doneAt ? 1 : a.doneAt > b.doneAt ? -1 : 0));
  if (!open.length) {
    body += `<div class="empty dashed"><h3>${done.length ? 'Liste tertemiz' : 'Henüz görev yok'}</h3><p>${done.length ? 'Açık görevin kalmadı. Yeni bir şey çıkarsa yukarıya yaz.' : 'Yukarıya yaz, Enter\'a bas. Büyük görevler daha çok XP kazandırır.'}</p></div>`;
  }
  if (done.length) {
    body += `<section class="section"><div class="sec-head"><h2>Tamamlananlar</h2><button class="link-btn" data-act="toggle-done">${ui.showDone ? 'Gizle' : `Göster (${done.length})`}</button></div>
      ${ui.showDone ? `<div class="todo-list">${done.slice(0, 40).map((x) => todoRow(x, false)).join('')}</div>` : ''}</section>`;
  }
  return `<header class="page-head"><div><h1>Görevler</h1><p class="sub">${open.length ? `${open.length} açık görev` : 'Yapılacaklar listen'}</p></div><button class="btn sm ghost" data-act="new-todo">Tarihli ekle</button></header>${quickForm('quickTodos')}${body}`;
}

function renderStats() {
  const t = today(), tk = dkey(t), week = ui.statsMode === 'week';
  let start, end, pStart, pEnd, title, prevName;
  if (week) {
    start = addDays(weekStart(t), 7 * ui.statsOff); end = addDays(start, 6);
    pStart = addDays(start, -7); pEnd = addDays(start, -1);
    title = ui.statsOff === 0 ? 'Bu hafta' : ui.statsOff === -1 ? 'Geçen hafta' : `${fmtShort(start)} – ${fmtShort(end)}`;
    prevName = 'önceki haftaya göre';
  } else {
    start = new Date(t.getFullYear(), t.getMonth() + ui.statsOff, 1); end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    pStart = new Date(start.getFullYear(), start.getMonth() - 1, 1); pEnd = addDays(start, -1);
    title = `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    prevName = 'önceki aya göre';
  }
  const P = periodStats(start, end), Q = periodStats(pStart, pEnd);
  const elapsed = P.days.filter((x) => !x.future);

  const head = `<header class="page-head"><div><h1>Analiz</h1><p class="sub">Emeğinin karşılığı burada görünür</p></div></header>
  <div class="seg" role="tablist"><button role="tab" aria-selected="${week}" class="${week ? 'on' : ''}" data-act="stats-mode" data-v="week">Haftalık</button><button role="tab" aria-selected="${!week}" class="${week ? '' : 'on'}" data-act="stats-mode" data-v="month">Aylık</button></div>
  <div class="period"><button class="nav-btn" data-act="stats-nav" data-v="-1" aria-label="Önceki dönem">${ICON.left}</button>
    <h2>${title}${week && ui.statsOff >= -1 ? `<span class="small muted" style="display:block;font-family:var(--font-body);font-weight:700">${fmtShort(start)} – ${fmtShort(end)}</span>` : ''}</h2>
    <button class="nav-btn" data-act="stats-nav" data-v="1" aria-label="Sonraki dönem" ${ui.statsOff >= 0 ? 'disabled' : ''}>${ICON.right}</button></div>`;

  if (!S.habits.length && !S.todos.length) {
    return head + `<div class="empty dashed"><h3>Henüz veri yok</h3><p>Birkaç alışkanlık ekleyip işaretlemeye başla. Haftalık ve aylık özetin burada birikecek.</p><button class="btn sm" data-act="new-habit">Alışkanlık ekle</button></div>`;
  }

  let delta = '';
  if (P.rate != null && Q.rate != null) {
    const diff = Math.round(P.rate * 100) - Math.round(Q.rate * 100);
    delta = diff === 0 ? `${prevName} aynı` : `<span class="${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)} puan</span> ${prevName}`;
  }
  const tiles = `<div class="tiles">
    <div class="tile"><div class="lab">Tamamlama</div><div class="val">${P.rate == null ? '–' : pct(P.rate)}</div><div class="delta">${delta || `${P.done}/${P.sched} işaret`}</div></div>
    <div class="tile"><div class="lab">Kazanılan XP</div><div class="val">${P.xp}</div><div class="delta">${week ? 'Önceki hafta' : 'Önceki ay'} ${Q.xp}</div></div>
    <div class="tile"><div class="lab">Biten görev</div><div class="val">${P.todos}</div><div class="delta">${week ? 'Önceki hafta' : 'Önceki ay'} ${Q.todos}</div></div>
    <div class="tile"><div class="lab">Kusursuz gün</div><div class="val">${P.perfect}<small> / ${elapsed.length} gün</small></div><div class="delta">Hepsinin tamamlandığı günler</div></div>
  </div>`;

  const pick = P.days.find((x) => x.k === ui.pick && !x.future);
  const scored = elapsed.filter((x) => x.rate != null);
  const best = scored.length ? scored.reduce((a, b) => (b.rate > a.rate ? b : a)) : null;
  const dayNote = (x) => `<b>${DAYS_LONG[mdow(x.d)]}, ${fmtShort(x.d)}</b>: ${x.sched ? `${x.done}/${x.sched} alışkanlık (${pct(x.rate)})` : 'planlı alışkanlık yok'}, +${x.xp} XP`;
  const note = pick ? dayNote(pick) : best && best.rate > 0 ? `En iyi gün <b>${DAYS_LONG[mdow(best.d)]}, ${fmtShort(best.d)}</b> (${pct(best.rate)}). Ayrıntı için bir güne dokun.` : 'Ayrıntı için bir güne dokun.';

  let main;
  if (week) {
    const bars = P.days.map((x) => {
      const h = x.rate == null ? 0 : Math.round(x.rate * 100);
      const bar = x.future ? '' : `<span class="bar ${h === 0 ? 'zero' : ''}" style="height:${h}%"></span>`;
      return `<button class="bar-col ${x.k === ui.pick ? 'sel' : ''} ${x.k === tk ? 'is-today' : ''}" data-act="pick" data-k="${x.k}" ${x.future ? 'disabled' : ''} aria-label="${DAYS_LONG[mdow(x.d)]}: ${x.future ? 'henüz gelmedi' : x.rate == null ? 'plan yok' : pct(x.rate)}"><span class="plot">${bar}</span><span class="x">${DAYS[mdow(x.d)]}</span></button>`;
    }).join('');
    main = `<section class="card panel"><h3>Günlere göre tamamlama</h3>
      <div class="barchart"><div class="grid"><i data-l="%100" style="top:0"></i><i data-l="%50" style="top:50%"></i><i class="base" data-l="%0" style="top:100%"></i></div><div class="bars">${bars}</div></div>
      <p class="chart-note">${note}</p></section>`;

    if (S.habits.length) {
      const rows = S.habits.filter((h) => dkey(end) >= h.createdAt).map((h) => {
        const hp = habitPeriod(h, start, end);
        const cells = P.days.map((x) => {
          let c;
          if (x.future) c = 'fut';
          else if (isDone(h, x.k)) c = 'on';
          else if (isWeekly(h) || !isSched(h, x.d)) c = 'off';
          else c = x.k === tk ? 'pend' : 'miss';
          return `<span class="cell ${c}">${c === 'on' ? ICON.check : ''}</span>`;
        }).join('');
        return `<span class="nm">${h.emoji} ${esc(h.name)}</span>${cells}<span class="tot">${hp.done}/${hp.exp}</span>`;
      }).join('');
      main += `<section class="card panel"><h3>Alışkanlık çizelgesi</h3>
        ${rows ? `<div class="hgrid"><span></span>${DAYS.map((x) => `<span class="hd">${x[0]}</span>`).join('')}<span></span>${rows}</div>` : '<p class="hint">Bu hafta henüz alışkanlık yoktu.</p>'}</section>`;
    }
  } else {
    let cells = DAYS.map((x) => `<span class="hd">${x}</span>`).join('') + '<span></span>'.repeat(mdow(start));
    cells += P.days.map((x) => {
      let c;
      if (x.future) c = 'fut';
      else if (x.rate == null) c = 'none';
      else c = x.rate >= 1 ? 'h4' : x.rate >= 0.7 ? 'h3' : x.rate >= 0.4 ? 'h2' : x.rate > 0 ? 'h1' : 'h0';
      return `<button class="hc ${c} ${x.k === ui.pick ? 'sel' : ''} ${x.k === tk ? 'is-today' : ''}" data-act="pick" data-k="${x.k}" ${x.future ? 'disabled' : ''} aria-label="${fmtShort(x.d)}: ${x.future ? 'henüz gelmedi' : x.rate == null ? 'plan yok' : pct(x.rate)}">${x.d.getDate()}</button>`;
    }).join('');
    const VM = vaseModel(start.getFullYear(), start.getMonth());
    const vbits = [];
    if (VM.perfect) vbits.push(`${VM.perfect} kusursuz gün`);
    if (VM.gold) vbits.push(`${VM.gold} altın damar`);
    if (VM.open) vbits.push(`${VM.open} açık çatlak`);
    main = `<section class="card month-vase"><div class="thumb"><img data-thumb="${VM.ym}" alt="${VM.title} vazosu"></div>
      <div class="grow"><span class="eyebrow">${VM.cur ? 'Çarktaki vazo' : 'Raftaki vazo'}</span><h3>${MONTHS[start.getMonth()]} · ${VM.shapeName}</h3><p class="small muted">${vbits.length ? vbits.join(', ') : 'Her gün bir halka. Silüet bu ayın grafiği.'}</p></div></section>
    <section class="card panel"><h3>Ay takvimi</h3><div class="heat">${cells}</div>
      <div class="heat-legend"><span>Az</span><i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i><i style="background:var(--heat-4)"></i><span>Çok</span></div>
      <p class="chart-note">${note}</p></section>`;

    const hs = S.habits.map((h) => ({ h, p: habitPeriod(h, start, end) })).filter((x) => x.p.rate != null).sort((a, b) => b.p.rate - a.p.rate);
    if (hs.length) {
      main += `<section class="card panel"><h3>Alışkanlık başarısı</h3>${hs.map(({ h, p }) =>
        `<div class="hbar-row"><span class="nm">${h.emoji} ${esc(h.name)}</span><span class="v"><b>${pct(p.rate)}</b> · ${p.done}/${p.exp}</span><div class="hbar"><i style="width:${Math.round(p.rate * 100)}%"></i></div></div>`).join('')}</section>`;
    }

    const weeks = [];
    for (let w = weekStart(start); w <= end; w = addDays(w, 7)) {
      const a = w < start ? start : w, b = addDays(w, 6) > end ? end : addDays(w, 6);
      const xp = P.days.filter((x) => x.d >= a && x.d <= b).reduce((s, x) => s + x.xp, 0);
      weeks.push({ a, b, xp, future: a > t });
    }
    const maxXp = Math.max(1, ...weeks.map((w) => w.xp));
    main += `<section class="card panel"><h3>Haftalara göre XP</h3><div class="barchart" style="padding-left:0;height:150px"><div class="grid" style="left:0"><i class="base" style="top:100%"></i></div><div class="bars" style="left:0">${weeks.map((w) => {
      const h = Math.round((w.xp / maxXp) * 84);
      return `<div class="bar-col gold"><span class="plot">${w.future ? '' : `<span class="top" style="bottom:calc(${h}% + 4px)">${w.xp}</span><span class="bar ${w.xp ? '' : 'zero'}" style="height:${h}%"></span>`}</span><span class="x">${w.a.getDate() === w.b.getDate() ? w.a.getDate() : `${w.a.getDate()}–${w.b.getDate()}`}</span></div>`;
    }).join('')}</div></div><p class="hint" style="margin-top:8px">Çubukların altındaki sayılar ayın günleridir.</p></section>`;
  }

  // Öne çıkanlar
  const ins = [];
  if (best && best.rate > 0) ins.push(['☀️', `En iyi gün: <b>${DAYS_LONG[mdow(best.d)]}${week ? '' : ', ' + fmtShort(best.d)}</b> (${pct(best.rate)})`]);
  const hp = S.habits.map((h) => ({ h, p: habitPeriod(h, start, end), st: streakOf(h) })).filter((x) => x.p.rate != null);
  if (hp.length) {
    const top = hp.reduce((a, b) => (b.p.rate > a.p.rate ? b : a)), low = hp.reduce((a, b) => (b.p.rate < a.p.rate ? b : a));
    if (top.p.rate > 0) ins.push([top.h.emoji, `En düzenli: <b>${esc(top.h.name)}</b> (${pct(top.p.rate)})`]);
    if (hp.length > 1 && low.h.id !== top.h.id && low.p.rate < 0.6) ins.push([low.h.emoji, `Biraz ilgi bekliyor: <b>${esc(low.h.name)}</b> (${pct(low.p.rate)})`]);
    const hot = hp.reduce((a, b) => (b.st.n > a.st.n ? b : a));
    if (hot.st.n >= 2) ins.push(['🔥', `En uzun güncel seri: <b>${esc(hot.h.name)}</b>, ${hot.st.n} ${hot.st.unit}`]);
  }
  const insHtml = ins.length ? `<section class="card panel"><h3>Öne çıkanlar</h3><div class="insights">${ins.map(([ic, tx]) => `<div class="insight"><span class="ic">${ic}</span><span>${tx}</span></div>`).join('')}</div></section>` : '';

  return head + tiles + main + insHtml;
}

function renderGarden() {
  const D = derive(), lv = D.lvl, c = D.ctx, t = today(), nowYm = ymOf(t);
  const months = vaseMonths();
  const ym = ui.vaseYm && months.includes(ui.vaseYm) ? ui.vaseYm : nowYm;
  const [vy, vm] = ym.split('-').map(Number);
  const M = vaseModel(vy, vm - 1);
  const rIdx = rankOf(lv.level);
  const bits = [];
  if (M.rate != null) bits.push(`<span class="chip num">${pct(M.rate)} dolu</span>`);
  if (M.perfect) bits.push(`<span class="chip num">${M.perfect} kusursuz gün</span>`);
  if (M.gold) bits.push(`<span class="chip gold num">${M.gold} altın damar</span>`);
  if (M.open) bits.push(`<span class="chip late num">${M.open} açık çatlak</span>`);
  const glazes = GLAZES.map((g) => {
    const locked = lv.level < g.lvl;
    return `<button class="glaze ${M.glaze.id === g.id ? 'on' : ''} ${locked ? 'locked' : ''}" data-act="glaze" data-v="${g.id}" ${locked ? 'disabled' : ''} aria-pressed="${M.glaze.id === g.id}" aria-label="${g.name}${locked ? `, seviye ${g.lvl} olunca açılır` : ''}"><i style="--g:${css(g.rgb)}"></i>${g.name}${locked ? `<small>Seviye ${g.lvl}</small>` : ''}</button>`;
  }).join('');
  const shelf = months.map((x) => {
    const [y, m] = x.split('-').map(Number);
    return `<button class="shelf-item ${x === ym ? 'on' : ''}" data-act="shelf" data-v="${x}" aria-pressed="${x === ym}"><div class="thumb"><img data-thumb="${x}" alt=""></div><div class="nm">${MONTHS[m - 1]}</div><div class="ds">${x === nowYm ? 'çarkta' : y}</div></button>`;
  }).join('');
  const ranks = RANKS.map((r, i) => `<div class="rank ${i === rIdx ? 'cur' : ''} ${i > rIdx ? 'locked' : ''}"><b>${r.name}</b><span>Seviye ${r.lvl}</span></div>`).join('');
  const earned = BADGES.filter((b) => S.badges[b.id]).length;
  const badges = BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? '' : 'locked'}"><div class="medal">${b.icon}</div><div class="nm">${b.name}</div><div class="ds">${b.desc}</div></div>`).join('');
  const themeBtn = (v, tx) => `<button class="${S.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}" aria-pressed="${S.theme === v}">${tx}</button>`;
  return `<header class="page-head"><div><h1>Atölye</h1><p class="sub">Her gün bir halka, her ay bir vazo</p></div></header>
  <section class="stage big">
    <div class="vase-slot"></div>
    <div class="plate"><span class="eyebrow">${M.cur ? 'Çarkta' : 'Rafta'}</span><b>${M.title}</b><span class="num">${M.shapeName} · ${M.upto} / ${M.n} halka</span></div>
    ${kilnChip(D)}
    ${rankFoot(D, 'div')}
  </section>
  <div class="row" style="flex-wrap:wrap;gap:6px;justify-content:center">${bits.join('') || '<span class="hint">Vazoyu parmağınla döndürebilirsin.</span>'}${M.cur ? '' : '<button class="link-btn" data-act="shelf" data-v="">Bu aya dön</button>'}</div>
  <section class="section"><div class="sec-head"><h2>Raf</h2><span class="count num">${months.length} vazo</span></div><div class="shelf">${shelf}</div></section>
  <section class="section"><div class="sec-head"><h2>Vazo nasıl okunur?</h2></div>
    <div class="card pad legend">
      <div><i class="lg-wide"></i><span><b>Geniş halka.</b> O gün alışkanlıkların çoğu tamam.</span></div>
      <div><i class="lg-thin"></i><span><b>Dar halka.</b> Eksik kalan bir gün. Vazo orada incelir.</span></div>
      <div><i class="lg-gold"></i><span><b>Altın damar.</b> Kaçan bir gün çatlak bırakır. Geri döndüğünde altınla onarılır.</span></div>
      <div><i class="lg-pearl"></i><span><b>İnci çizgisi.</b> Kusursuz gün, hepsi tamam.</span></div>
      <div><i class="lg-clay"></i><span><b>Islak kil.</b> Bugünün halkası. İşaretledikçe yükselir.</span></div>
    </div>
  </section>
  <section class="section"><div class="sec-head"><h2>Sır</h2><span class="count">${M.cur ? 'bu ayın rengi' : MONTHS[vm - 1]}</span></div>
    <div class="card pad"><div class="glazes">${glazes}</div><p class="hint" style="margin-top:10px">Halkaların tonu, o gün yaptığın alışkanlıkların renginden gelir.</p></div>
  </section>
  <section class="section"><div class="sec-head"><h2>Unvanlar</h2></div><div class="ranks">${ranks}</div></section>
  <div class="tiles">
    <div class="tile"><div class="lab">Toplam XP</div><div class="val">${D.total}</div><div class="delta num">Sonraki seviyeye ${lv.left}</div></div>
    <div class="tile"><div class="lab">Seri</div><div class="val">${flame(22, D.streak > 0, false)} ${D.streak}<small> gün</small></div><div class="delta num">En uzun ${c.bestStreak} gün</div></div>
  </div>
  <section class="section"><div class="sec-head"><h2>Rozetler</h2><span class="count num">${earned}/${BADGES.length}</span></div><div class="badges">${badges}</div></section>
  <section class="section"><div class="sec-head"><h2>XP nasıl kazanılır?</h2></div>
    <div class="card pad stack small">
      <div class="row"><span class="chip gold num">+${XP_HABIT} XP</span><span>Tamamlanan her alışkanlık ya da hobi</span></div>
      <div class="row"><span class="chip gold num">+${XP_PERFECT} XP</span><span>Günün bütün alışkanlıkları bitince</span></div>
      <div class="row"><span class="chip gold num">+5 / 10 / 20</span><span>Küçük, orta ve büyük görevler</span></div>
      <div class="row"><span class="chip gold num">+${XP_BADGE} XP</span><span>Kazanılan her rozet</span></div>
    </div>
  </section>
  <section class="section"><div class="sec-head"><h2>Ayarlar</h2></div>
    <div class="card pad stack" style="gap:18px">
      <div class="setting"><label for="setName">Adın</label><input class="field" id="setName" value="${esc(S.name)}" maxlength="24" autocomplete="off"></div>
      <div class="setting"><span class="lab2">Görünüm</span><div class="seg">${themeBtn('auto', 'Otomatik')}${themeBtn('light', 'Çini beyazı')}${themeBtn('dark', 'Gece atölyesi')}</div></div>
      <div class="setting"><span class="lab2">Yedek</span>
        <div class="row"><button class="btn ghost sm grow" data-act="export">Yedeği indir</button><button class="btn ghost sm grow" data-act="import">Yedekten yükle</button></div>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
        <p class="hint">Veriler yalnızca bu telefonda durur. Telefon değiştirmeden önce yedek al.</p></div>
      <div class="setting"><span class="lab2">Ana ekrana ekle</span><p class="hint">iPhone'da Safari'nin Paylaş menüsünden, Android'de Chrome menüsünden "Ana Ekrana Ekle"yi seç. Uygulama gibi açılır ve internetsiz de çalışır.</p></div>
      <button class="btn danger sm" data-act="reset">Her şeyi sıfırla</button>
    </div>
  </section>`;
}

const VIEWS = { today: renderToday, habits: renderHabits, todos: renderTodos, stats: renderStats, garden: renderGarden };

function render(enter) {
  const v = $('#view');
  v.innerHTML = VIEWS[ui.tab]();
  ui.flash = null;
  mountVase();
  if (enter) { v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
  document.querySelectorAll('#tabbar button').forEach((b) => {
    const on = b.dataset.tab === ui.tab;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

/* ================= alttan açılan paneller ================= */
let pendingConfirm = null;

function setSheet(html) {
  const host = $('#sheetHost');
  const cur = $('.sheet', host);
  if (!host.hidden && cur) {
    const body = $('.sheet-body', cur), top = body ? body.scrollTop : 0;
    cur.innerHTML = html;
    const nb = $('.sheet-body', cur); if (nb) nb.scrollTop = top;
    return;
  }
  host.innerHTML = `<div class="scrim" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  host.hidden = false;
  document.body.classList.add('locked');
}
function closeSheet() {
  const host = $('#sheetHost');
  host.hidden = true; host.innerHTML = '';
  document.body.classList.remove('locked');
  draft = null; pendingConfirm = null;
  if (!S.onboarded) { S.onboarded = true; save(); }
}
const sheetHead = (title) => `<div class="sheet-head"><h2>${title}</h2><button class="x-btn" data-act="close-sheet" aria-label="Kapat">${ICON.x}</button></div>`;
const segBtn = (act, f, v, cur, tx) => `<button class="${cur === v ? 'on' : ''}" data-act="${act}" data-f="${f}" data-v="${v}" aria-pressed="${cur === v}">${tx}</button>`;

function shake(sel) {
  const el = $(sel); if (!el) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.focus();
}

function confirmSheet(o) {
  pendingConfirm = o.onYes;
  setSheet(`${sheetHead(o.title)}<div class="sheet-body"><p class="muted">${o.text}</p></div>
    <div class="sheet-foot"><button class="btn ghost" data-act="close-sheet">Vazgeç</button><button class="btn ${o.danger ? 'danger' : ''}" style="flex:1;width:auto;padding:0 20px" data-act="confirm-yes">${o.yes}</button></div>`);
}

/* ---- alışkanlık formu ---- */
function openHabitForm(id) {
  const h = id ? findH(id) : null;
  draft = h
    ? { form: 'habit', id: h.id, name: h.name, emoji: h.emoji, color: h.color, kind: h.kind, ftype: h.freq.type, days: [...h.freq.days], times: h.freq.times, mode: h.target > 1 ? 'counter' : 'check', target: h.target > 1 ? h.target : 8, unit: h.unit, emojiOpen: false, touched: true }
    : { form: 'habit', id: null, name: '', emoji: '🌱', color: S.habits.length % TINTS.length, kind: 'habit', ftype: 'daily', days: [0, 1, 2, 3, 4], times: 3, mode: 'check', target: 8, unit: '', emojiOpen: false, touched: false };
  drawHabitForm();
  if (!h) setTimeout(() => { const el = $('#hfName'); if (el) el.focus(); }, 320);
}
function drawHabitForm() {
  const d = draft, editing = !!d.id;
  let stats = '';
  if (editing) {
    const h = findH(d.id), st = streakOf(h);
    stats = `<div class="mini-stats"><div><b>${st.n}</b><span>güncel seri (${st.unit})</span></div><div><b>${bestStreakOf(h)}</b><span>en uzun seri</span></div><div><b>${totalDoneOf(h)}</b><span>toplam</span></div></div>`;
  }
  let freqExtra = '';
  if (d.ftype === 'days') freqExtra = `<div class="daypick">${DAYS.map((x, i) => `<button class="${d.days.includes(i) ? 'on' : ''}" data-act="hf-day" data-v="${i}" aria-pressed="${d.days.includes(i)}">${x}</button>`).join('')}</div>`;
  if (d.ftype === 'weekly') freqExtra = `<div class="stepper"><button data-act="hf-step" data-f="times" data-v="-1" aria-label="Azalt">−</button><output>${d.times}</output><button data-act="hf-step" data-f="times" data-v="1" aria-label="Artır">+</button><span class="muted">kez, hangi gün olduğu fark etmez</span></div>`;
  const modeExtra = d.mode === 'counter'
    ? `<div class="stepper"><button data-act="hf-step" data-f="target" data-v="-1" aria-label="Azalt">−</button><output>${d.target}</output><button data-act="hf-step" data-f="target" data-v="1" aria-label="Artır">+</button>
        <input class="field" id="hfUnit" data-bind="unit" value="${esc(d.unit)}" placeholder="birim, örn. bardak" maxlength="14" autocomplete="off" aria-label="Birim"></div>
       <p class="hint">Gün içinde birden çok kez yapılanlar için. Her dokunuş sayacı bir artırır.</p>`
    : '';
  setSheet(`${sheetHead(editing ? 'Düzenle' : 'Yeni alışkanlık')}
  <div class="sheet-body">
    ${stats}
    <div class="setting"><label for="hfName">Adı</label>
      <div class="name-row"><button class="emoji-btn" style="--tint:${TINTS[d.color]}" data-act="hf-emoji-toggle" aria-label="Simge seç" aria-expanded="${d.emojiOpen}">${d.emoji}</button>
        <input class="field" id="hfName" data-bind="name" value="${esc(d.name)}" placeholder="Örn. Kitap oku" maxlength="40" autocomplete="off" enterkeyhint="done"></div>
      ${d.emojiOpen ? `<div class="emoji-grid">${EMOJIS.map((e) => `<button data-act="hf-emoji" data-v="${e}" class="${e === d.emoji ? 'on' : ''}" aria-label="${e}">${e}</button>`).join('')}</div>` : ''}
    </div>
    <div class="setting"><span class="lab2">Tür</span><div class="seg">${segBtn('hf-set', 'kind', 'habit', d.kind, 'Alışkanlık')}${segBtn('hf-set', 'kind', 'hobby', d.kind, 'Hobi')}</div></div>
    <div class="setting"><span class="lab2">Ne sıklıkla?</span><div class="seg">${segBtn('hf-set', 'ftype', 'daily', d.ftype, 'Her gün')}${segBtn('hf-set', 'ftype', 'days', d.ftype, 'Belirli günler')}${segBtn('hf-set', 'ftype', 'weekly', d.ftype, 'Haftada…')}</div>${freqExtra}</div>
    <div class="setting"><span class="lab2">Nasıl işaretlensin?</span><div class="seg">${segBtn('hf-set', 'mode', 'check', d.mode, 'Tek dokunuş')}${segBtn('hf-set', 'mode', 'counter', d.mode, 'Sayaç')}</div>${modeExtra}</div>
    <div class="setting"><span class="lab2">Renk</span><div class="swatches">${TINTS.map((c, i) => `<button class="swatch ${d.color === i ? 'on' : ''}" style="--tint:${c}" data-act="hf-color" data-v="${i}" aria-label="Renk ${i + 1}" aria-pressed="${d.color === i}"></button>`).join('')}</div></div>
  </div>
  <div class="sheet-foot">${editing ? `<button class="btn danger" data-act="hf-delete" aria-label="Sil">${ICON.trash}</button>` : ''}<button class="btn" data-act="hf-save">${editing ? 'Kaydet' : 'Ekle'}</button></div>`);
}
function saveHabit() {
  const d = draft, name = d.name.trim();
  if (!name) { shake('#hfName'); return; }
  if (d.ftype === 'days' && !d.days.length) { toast('📅', 'En az bir gün seç'); return; }
  const fields = {
    name, emoji: d.emoji, color: d.color, kind: d.kind,
    freq: { type: d.ftype, days: [...d.days].sort(), times: d.times },
    target: d.mode === 'counter' ? clamp(d.target, 2, 99) : 1,
    unit: d.mode === 'counter' ? d.unit.trim() : '',
  };
  if (d.id) Object.assign(findH(d.id), fields);
  else S.habits.push(Object.assign({ id: uid(), createdAt: dkey(today()), log: {} }, fields));
  const isNew = !d.id;
  closeSheet();
  after();
  if (isNew) toast(fields.emoji, 'Eklendi', name);
}

/* ---- görev formu ---- */
function openTodoForm(id) {
  const td = id ? findT(id) : null, tk = dkey(today()), tmk = dkey(addDays(today(), 1));
  draft = td
    ? { form: 'todo', id: td.id, title: td.title, dueMode: !td.due ? 'none' : td.due === tk ? 'today' : td.due === tmk ? 'tomorrow' : 'date', date: td.due || tk, size: td.size }
    : { form: 'todo', id: null, title: '', dueMode: 'today', date: tk, size: 'm' };
  drawTodoForm();
  if (!td) setTimeout(() => { const el = $('#tfTitle'); if (el) el.focus(); }, 320);
}
function drawTodoForm() {
  const d = draft, editing = !!d.id;
  setSheet(`${sheetHead(editing ? 'Görevi düzenle' : 'Yeni görev')}
  <div class="sheet-body">
    <div class="setting"><label for="tfTitle">Ne yapılacak?</label><input class="field" id="tfTitle" data-bind="title" value="${esc(d.title)}" placeholder="Örn. Faturayı öde" maxlength="120" autocomplete="off" enterkeyhint="done"></div>
    <div class="setting"><span class="lab2">Ne zaman?</span><div class="seg wrap">${segBtn('tf-set', 'dueMode', 'today', d.dueMode, 'Bugün')}${segBtn('tf-set', 'dueMode', 'tomorrow', d.dueMode, 'Yarın')}${segBtn('tf-set', 'dueMode', 'date', d.dueMode, 'Tarih seç')}${segBtn('tf-set', 'dueMode', 'none', d.dueMode, 'Tarihsiz')}</div>
      ${d.dueMode === 'date' ? `<input class="field" type="date" id="tfDate" data-bind="date" value="${esc(d.date)}" aria-label="Tarih">` : ''}</div>
    <div class="setting"><span class="lab2">Ne kadar büyük?</span><div class="seg">${['s', 'm', 'l'].map((s) => segBtn('tf-set', 'size', s, d.size, `${SIZE_NAME[s]} · +${XP_TODO[s]} XP`)).join('')}</div></div>
  </div>
  <div class="sheet-foot">${editing ? `<button class="btn danger" data-act="tf-delete" aria-label="Sil">${ICON.trash}</button>` : ''}<button class="btn" data-act="tf-save">${editing ? 'Kaydet' : 'Ekle'}</button></div>`);
}
function saveTodo() {
  const d = draft, title = d.title.trim();
  if (!title) { shake('#tfTitle'); return; }
  const t = today();
  const due = d.dueMode === 'none' ? null : d.dueMode === 'today' ? dkey(t) : d.dueMode === 'tomorrow' ? dkey(addDays(t, 1)) : (/^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : dkey(t));
  if (d.id) Object.assign(findT(d.id), { title, due, size: d.size });
  else S.todos.push({ id: uid(), title, due, size: d.size, done: false, doneAt: null, createdAt: dkey(t) });
  closeSheet();
  after();
}

/* ---- ilk açılış ---- */
function openOnboarding() {
  draft = { form: 'onboard', sel: [0, 1, 2] };
  drawOnboarding();
}
function drawOnboarding() {
  setSheet(`${sheetHead(`Hoş geldin, ${esc(S.name)}`)}
  <div class="sheet-body">
    <p class="manifesto">Burası senin atölyen. Her gün çarkta <em>bir halka</em> çevirirsin. Günün ne kadar doluysa halka o kadar geniş olur. Ay bittiğinde ortaya bir vazo çıkar ve hiçbiri diğerine benzemez. Bir gün kaçarsa çatlak kalır, ama döndüğünde <em>altınla onarılır</em>.</p>
    <div class="setting"><span class="lab2">Başlamak için birkaçını seç</span>
      <div class="starters">${STARTERS.map((s, i) => `<button class="starter ${draft.sel.includes(i) ? 'on' : ''}" data-act="ob-pick" data-v="${i}" aria-pressed="${draft.sel.includes(i)}"><span>${s.emoji}</span>${s.name}</button>`).join('')}</div>
      <p class="hint">Hepsini sonradan değiştirebilir, kendi alışkanlıklarını ekleyebilirsin.</p></div>
  </div>
  <div class="sheet-foot"><button class="btn ghost" data-act="close-sheet">Kendim eklerim</button><button class="btn" data-act="ob-go">Çarkı döndür</button></div>`);
}

/* ================= işlemler ================= */
function bumpHabit(id, delta, ev) {
  const h = findH(id); if (!h) return;
  const k = dkey(ui.day), before = cnt(h, k), wasDone = before >= h.target;
  const wasPerfect = derive().perfect.has(k);
  const openBefore = window.Vase ? curModel().open : 0;
  const c = h.target === 1 ? (before ? 0 : 1) : clamp(before + delta, 0, 999);
  if (c) h.log[k] = c; else delete h.log[k];
  const nowDone = c >= h.target;
  if (nowDone && !wasDone) ui.flash = id;
  after();
  if (window.Vase && c !== before) window.Vase.kick();
  if (nowDone && !wasDone) {
    xpFloat(ev, `+${XP_HABIT} XP`); buzz(14);
    if (window.Vase && openBefore > 0 && curModel().open < openBefore) toast('⚜️', 'Çatlak altınla onarıldı', 'Kaçan gün artık vazonun en güzel yeri');
    if (!wasPerfect && derive().perfect.has(k)) {
      setTimeout(() => { toast('🌟', 'Kusursuz gün', `Halkana inci çizgisi çekildi, +${XP_PERFECT} XP`); confetti(); buzz([20, 40, 20]); }, 380);
    }
  } else if (c > before) buzz(8);
}

function toggleTodo(id, ev) {
  const td = findT(id); if (!td) return;
  td.done = !td.done;
  td.doneAt = td.done ? dkey(today()) : null;
  if (td.done) ui.flash = id;
  after();
  if (td.done) { xpFloat(ev, `+${XP_TODO[td.size]} XP`); buzz(14); }
}

function switchTab(tab) {
  if (!VIEWS[tab]) return;
  ui.tab = tab; ui.pick = null; ui.vaseYm = null;
  if (tab === 'today') ui.day = today();
  render(true);
  window.scrollTo(0, 0);
}

const ACT = {
  tab: (el) => switchTab(el.dataset.tab),
  day: (el) => { ui.day = parse(el.dataset.k); render(); },
  'go-today': () => { ui.day = today(); render(); },
  toggle: (el, e) => bumpHabit(el.dataset.id, 1, e),
  inc: (el, e) => bumpHabit(el.dataset.id, 1, e),
  dec: (el, e) => bumpHabit(el.dataset.id, -1, e),
  'toggle-todo': (el, e) => toggleTodo(el.dataset.id, e),
  'toggle-done': () => { ui.showDone = !ui.showDone; render(); },
  'new-habit': () => openHabitForm(),
  'new-todo': () => openTodoForm(),
  'edit-habit': (el) => openHabitForm(el.dataset.id),
  'edit-todo': (el) => openTodoForm(el.dataset.id),
  'close-sheet': () => closeSheet(),
  'close-levelup': (el) => { const box = el.closest('.levelup'); if (box) box.remove(); },
  'confirm-yes': () => { const fn = pendingConfirm; closeSheet(); if (fn) fn(); },

  'hf-set': (el) => {
    const f = el.dataset.f, v = el.dataset.v;
    draft[f] = v;
    if (f === 'ftype') draft.touched = true;
    if (f === 'kind' && !draft.touched && !draft.id) draft.ftype = v === 'hobby' ? 'weekly' : 'daily';
    drawHabitForm();
  },
  'hf-day': (el) => { const i = +el.dataset.v, at = draft.days.indexOf(i); if (at >= 0) draft.days.splice(at, 1); else draft.days.push(i); drawHabitForm(); },
  'hf-step': (el) => {
    const f = el.dataset.f, dv = +el.dataset.v;
    draft[f] = f === 'times' ? clamp(draft.times + dv, 1, 6) : clamp(draft.target + dv, 2, 99);
    drawHabitForm();
  },
  'hf-color': (el) => { draft.color = +el.dataset.v; drawHabitForm(); },
  'hf-emoji-toggle': () => { draft.emojiOpen = !draft.emojiOpen; drawHabitForm(); },
  'hf-emoji': (el) => { draft.emoji = el.dataset.v; draft.emojiOpen = false; drawHabitForm(); },
  'hf-save': () => saveHabit(),
  'hf-delete': () => {
    const h = findH(draft.id); if (!h) return;
    confirmSheet({
      title: 'Silinsin mi?', text: `"${esc(h.name)}" ve geçmiş kayıtları silinecek. Kazandığın XP sende kalır.`, yes: 'Sil', danger: true,
      onYes: () => { S.xpBank += totalDoneOf(h) * XP_HABIT; S.habits = S.habits.filter((x) => x.id !== h.id); after(); toast('🍂', 'Silindi', h.name); },
    });
  },

  'tf-set': (el) => { draft[el.dataset.f] = el.dataset.v; drawTodoForm(); },
  'tf-save': () => saveTodo(),
  'tf-delete': () => {
    const td = findT(draft.id); if (!td) return;
    if (td.done) S.xpBank += XP_TODO[td.size];
    S.todos = S.todos.filter((x) => x.id !== td.id);
    closeSheet(); after(); toast('🍂', 'Görev silindi', td.title);
  },

  'ob-pick': (el) => { const i = +el.dataset.v, at = draft.sel.indexOf(i); if (at >= 0) draft.sel.splice(at, 1); else draft.sel.push(i); drawOnboarding(); },
  'ob-go': () => {
    const picks = [...draft.sel].sort((a, b) => a - b).map((i) => STARTERS[i]);
    const tk = dkey(today());
    picks.forEach((s) => S.habits.push({ id: uid(), name: s.name, emoji: s.emoji, color: s.color, kind: s.kind, freq: { type: s.freq.type, days: [0, 1, 2, 3, 4], times: s.freq.times || 3 }, target: s.target, unit: s.unit, createdAt: tk, log: {} }));
    closeSheet(); after();
    if (picks.length) toast('🏺', 'Çark dönmeye hazır', 'İlk alışkanlığını işaretle, ilk halkanı çevir');
  },

  'stats-mode': (el) => { ui.statsMode = el.dataset.v; ui.statsOff = 0; ui.pick = null; render(); },
  'stats-nav': (el) => { ui.statsOff = Math.min(0, ui.statsOff + +el.dataset.v); ui.pick = null; render(); },
  pick: (el) => { ui.pick = ui.pick === el.dataset.k ? null : el.dataset.k; render(); },

  theme: (el) => { S.theme = el.dataset.v; save(); applyTheme(); render(); },
  glaze: (el) => { const g = GLAZES.find((x) => x.id === el.dataset.v); if (!g || derive().lvl.level < g.lvl) return; S.glazes[ui.vaseYm || ymOf(today())] = g.id; save(); render(); if (window.Vase) window.Vase.kick(); },
  shelf: (el) => { ui.vaseYm = el.dataset.v || null; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  export: () => {
    try {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `atolye-yedek-${dkey(today())}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('💾', 'Yedek indirildi');
    } catch (e) { toast('⚠️', 'Yedek alınamadı', 'Tarayıcı indirmeye izin vermedi'); }
  },
  import: () => { const f = $('#importFile'); if (f) f.click(); },
  reset: () => confirmSheet({
    title: 'Her şey silinsin mi?', text: 'Bütün alışkanlıklar, görevler, seviyen ve rozetlerin silinecek. Bu işlem geri alınamaz. Emin değilsen önce yedek al.', yes: 'Sıfırla', danger: true,
    onYes: () => { S = blank(); memo = null; save(); applyTheme(); ui.tab = 'today'; render(true); openOnboarding(); },
  }),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) fn(el, e);
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  const input = f.querySelector('input'), title = input.value.trim();
  if (!title) { input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); return; }
  const id = input.id;
  S.todos.push({ id: uid(), title, due: dkey(today()), size: 'm', done: false, doneAt: null, createdAt: dkey(today()) });
  after();
  const again = document.getElementById(id); if (again) again.focus();
});

document.addEventListener('input', (e) => {
  const b = e.target.dataset && e.target.dataset.bind;
  if (b && draft) draft[b] = e.target.value;
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const lv = $('.levelup'); if (lv) { lv.remove(); return; }
    if (!$('#sheetHost').hidden) closeSheet();
    return;
  }
  if (e.key === 'Enter' && draft && e.target.matches && e.target.matches('#hfName, #hfUnit')) { e.preventDefault(); saveHabit(); }
  else if (e.key === 'Enter' && draft && e.target.id === 'tfTitle') { e.preventDefault(); saveTodo(); }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'setName') {
    S.name = e.target.value.trim().slice(0, 24) || 'Ceyda';
    save(); e.target.value = S.name;
  } else if (e.target.id === 'importFile') {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      let obj = null;
      try { obj = JSON.parse(rd.result); } catch (err) { obj = null; }
      if (!obj || !Array.isArray(obj.habits) || !Array.isArray(obj.todos)) { toast('⚠️', 'Bu dosya okunamadı', 'Atölye yedeği olan .json dosyasını seç'); return; }
      confirmSheet({
        title: 'Yedek yüklensin mi?', text: `Yedekte ${obj.habits.length} alışkanlık ve ${obj.todos.length} görev var. Şu anki verilerin yerine bunlar gelecek.`, yes: 'Yükle',
        onYes: () => { S = normalize(obj); S.onboarded = true; memo = null; save(); applyTheme(); render(true); toast('🌿', 'Yedek yüklendi'); },
      });
    };
    rd.readAsText(file);
    e.target.value = '';
  }
});

// Gün değiştiyse (uygulama arka planda kaldıysa) ekranı tazele
let lastDay = dkey(today());
function refreshIfNewDay() {
  const k = dkey(today());
  if (k !== lastDay) { lastDay = k; ui.day = today(); memo = null; render(); monthReveal(); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshIfNewDay(); });
setInterval(refreshIfNewDay, 60000);
if (window.matchMedia) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const onScheme = () => { applyTheme(); render(); };
  if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);
}

/* ================= başlangıç ================= */
applyTheme();
// Geçmişte kazanılmış seviyeleri yeniden kutlama
S.celebratedLevel = Math.max(S.celebratedLevel, 1);
render();
if (!S.onboarded && !S.habits.length && !S.todos.length) openOnboarding();
else monthReveal();
if (!S.seenMonth) { S.seenMonth = ymOf(today()); save(); }

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* çevrimdışı destek isteğe bağlı */ }); });
}

})();

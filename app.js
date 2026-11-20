/* Ceyda'nın Planı: alışkanlıklar, görevler, 14 günde bir tekrar eden ev işleri rutini ve takvim. Veriler yalnızca bu cihazda saklanır. */
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
const SIZE_OK = { s: 1, m: 1, l: 1 };
const ROUTINE_COLORS = 5;
// Eski sürümde tür adıyla saklanan rutinler renge çevrilir
const OLD_TAG = { 'Oda döngüsü': 0, 'Periyodik': 1, 'Küçük iş': 2 };

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

// Hazır plan: Ceyda'nın "2 Haftalık Ev İşleri Planı" dosyasından.
// Sürüm numarası artınca listeye yeni eklenenler telefona bir kez yüklenir.
// start: ev işleri rutininin ilk günü. startV artınca bu tarih telefona bir kez uygulanır.
// routines.days: 14 günlük rutinin günleri (1–14). every: 2 ise ayda bir.
// routines.color: işin türünü ayırt eden renk. 0 odalar, 1 düzenli işler, 2 ufak işler.
const PRESET = {
  version: 1,
  start: '2026-11-21',
  startV: 1,
  routines: [
    { id: 'r-oda-yatak', color: 0, size: 'l', days: [1, 7, 13], title: 'Yatak odası + koridor + merdiven', note: 'Süpür, komodinler' },
    { id: 'r-oda-mutfak', color: 0, size: 'l', days: [2, 8, 14], title: 'Mutfak', note: 'Süpür, tezgâh, kahve köşesi, lavabo' },
    { id: 'r-oda-banyo', color: 0, size: 'l', days: [3, 9], title: 'Büyük banyo + alt kat tuvaleti', note: 'Kabin, tuvaletler, ayna, lavabo' },
    { id: 'r-oda-salon', color: 0, size: 'l', days: [4, 10], title: 'Salon + antre + merdiven', note: 'Süpür, sehpa, kumandalar, ayakkabılık' },
    { id: 'r-oda-hobi', color: 0, size: 'l', days: [5, 11], title: 'Hobi odası + ebeveyn banyosu + tırmalamalar', note: 'Süpür, ütü alanı, kabin, tuvalet, ayna, tırmalama ve kedi yatakları' },

    { id: 'r-kum', color: 1, size: 'm', days: [1, 3, 5, 7, 9, 11, 13], title: 'Kumu temizle + kedi odasını süpür' },
    { id: 'r-camasir', color: 1, size: 'm', days: [2, 5, 8, 11, 14], title: 'Çamaşır', note: 'Yıka, kurut, katla' },
    { id: 'r-tara', color: 1, size: 'm', days: [3, 6, 9, 12], title: 'Kedileri tara' },
    { id: 'r-nevresim', color: 1, size: 'm', days: [1, 8], title: 'Nevresimi değiştir' },
    { id: 'r-havlu', color: 1, size: 'm', days: [1, 8], title: 'Havluları değiştir' },
    { id: 'r-kap', color: 1, size: 'm', days: [4, 10], title: 'Mama ve su kaplarını yıka' },
    { id: 'r-canta', color: 1, size: 'm', days: [6, 12], title: 'Çantanın içini boşalt' },
    { id: 'r-gardirop', color: 1, size: 'm', days: [7, 13], title: 'Gardırobu düzenle' },
    { id: 'r-kozmetik', color: 1, size: 'm', days: [12], every: 2, title: 'Tarihi geçmiş kozmetikleri at' },

    { id: 'r-k-sunger', color: 2, size: 's', days: [1], title: 'Bulaşık süngerini değiştir' },
    { id: 'r-k-baharat', color: 2, size: 's', days: [2], title: 'Baharatlığı düzenle' },
    { id: 'r-k-kapi', color: 2, size: 's', days: [3], title: 'Kapı kollarını ve ışık düğmelerini sil' },
    { id: 'r-k-salonkitap', color: 2, size: 's', days: [4], title: 'Salon kitaplığını düzenle' },
    { id: 'r-k-gider', color: 2, size: 's', days: [5], title: 'Lavabo giderini temizle' },
    { id: 'r-k-erzakdolap', color: 2, size: 's', days: [6], title: 'Büyük erzak dolabını toparla' },
    { id: 'r-k-buzdolabi', color: 2, size: 's', days: [7], title: 'Buzdolabındaki eski yiyecekleri at' },
    { id: 'r-k-erzak', color: 2, size: 's', days: [8], title: 'Erzak kontrolü + alışveriş listesi' },
    { id: 'r-k-poset', color: 2, size: 's', days: [9], title: 'Poşet ve saklama kaplarını ayıkla' },
    { id: 'r-k-ustdolap', color: 2, size: 's', days: [10], title: 'Üst dolapları toparla' },
    { id: 'r-k-hobikitap', color: 2, size: 's', days: [11], title: 'Hobi odası kitaplığını düzenle' },
    { id: 'r-k-masa', color: 2, size: 's', days: [13], title: 'Çalışma masasını düzenle' },
    { id: 'r-k-altdolap', color: 2, size: 's', days: [14], title: 'Alt dolapları toparla' },
  ],
  // Tek seferlik işler: ilk döngünün belirtilen gününe düşer
  todos: [
    { id: 'once-kedi-dolabi', cday: 12, size: 'l', title: 'Kedi odasındaki dolabı ayıkla', note: 'Tek seferlik' },
  ],
  // days: haftanın günleri, 0 Pazartesi … 6 Pazar. Boşsa her gün.
  habits: [
    { id: 'p-kitap', group: 'Kişisel', emoji: '📚', color: 2, name: 'Kitap oku' },
    { id: 'p-su', group: 'Kişisel', emoji: '💧', color: 1, name: 'Su iç', target: 2, unit: 'termos', note: '2 Stanley termos, toplam 2 L' },
    { id: 'p-sabah', group: 'Cilt bakımı', emoji: '🌞', color: 3, name: 'Sabah cilt bakımı', note: 'Köpüren jel → Nem Terapisi → Hydro Boost göz kremi → 345 Relief Cream → Garnier SPF50+' },
    { id: 'p-aksam', group: 'Cilt bakımı', emoji: '🌙', color: 5, name: 'Akşam cilt bakımı', note: 'Köpüren jel → günün ekstrası → Hydro Boost göz kremi → 345 Relief Cream' },
    { id: 'p-retinol', group: 'Cilt bakımı', emoji: '🧪', color: 4, name: 'Retinol B3', days: [0], note: 'Akşam ekstrası. 1–3. hafta sadece Pazartesi, 4. haftadan itibaren Perşembe de' },
    { id: 'p-kagit', group: 'Cilt bakımı', emoji: '🧖‍♀️', color: 6, name: 'Kâğıt maske', days: [1, 4], note: 'Akşam ekstrası' },
    { id: 'p-ped', group: 'Cilt bakımı', emoji: '🧴', color: 7, name: 'Kremi tonik ped', days: [2], note: 'Akşam ekstrası' },
    { id: 'p-kil', group: 'Cilt bakımı', emoji: '🧖‍♀️', color: 0, name: 'Thalia kil maskesi', days: [5], note: 'Akşam ekstrası' },
    { id: 'p-yuruyus', group: 'Spor', emoji: '🚶‍♀️', color: 0, name: 'Hafif: yürüyüş / eliptik', days: [0, 4] },
    { id: 'p-pt', group: 'Spor', emoji: '🏋️‍♀️', color: 3, name: 'PT ile ağırlık', days: [1, 3] },
    { id: 'p-esneme', group: 'Spor', emoji: '🧘‍♀️', color: 5, name: 'Hafif: esneme ve mobilite', days: [2] },
    { id: 'p-emre', group: 'Spor', emoji: '💪', color: 1, name: 'Emre ile ağırlık', days: [5] },
    { id: 'p-sacmaske', group: 'Saç', emoji: '💆‍♀️', color: 4, name: 'Saç maskesi', days: [2], note: 'Duşta' },
    { id: 'p-yagmaske', group: 'Saç', emoji: '💆‍♀️', color: 2, name: 'Yağ maskesi', days: [6] },
    { id: 'e-mama', group: 'Ev, her gün', emoji: '🐈', color: 7, name: 'Mama ve su kontrolü' },
    { id: 'e-yatak', group: 'Ev, her gün', emoji: '🛏️', color: 5, name: 'Yatağı topla' },
    { id: 'e-yastik', group: 'Ev, her gün', emoji: '🛋️', color: 2, name: 'Yastıkları düzelt, battaniyeyi katla' },
    { id: 'e-bulasik', group: 'Ev, her gün', emoji: '🍽️', color: 1, name: 'Bulaşık' },
    { id: 'e-cop', group: 'Ev, her gün', emoji: '🗑️', color: 0, name: 'Çöpü çıkar' },
  ],
  // Gün sayaçları: başlangıç tarihinden bugüne kaçıncı gün
  counters: [
    { id: 'c-sigarasiz', emoji: '🚭', title: 'Sigarasız', start: '2026-10-17' },
  ],
};

/* ================= durum ================= */
const blank = () => ({ v: 1, name: 'Ceyda', habits: [], todos: [], routines: [], counters: [], events: [], cycleStart: PRESET.start, startV: 0, gen: {}, presetV: 0, theme: 'auto', onboarded: false });

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
    note: String(h.note || ''), group: String(h.group || ''),
    createdAt: /^\d{4}-\d{2}-\d{2}$/.test(h.createdAt) ? h.createdAt : dkey(today()),
    log: h.log && typeof h.log === 'object' ? h.log : {},
  }));
  s.todos = (Array.isArray(s.todos) ? s.todos : []).filter((t) => t && t.id && t.title).map((t) => ({
    id: String(t.id), title: String(t.title), due: t.due || null, size: SIZE_OK[t.size] ? t.size : 'm',
    done: !!t.done, doneAt: t.done ? (t.doneAt || dkey(today())) : null, createdAt: t.createdAt || dkey(today()),
    rid: t.rid ? String(t.rid) : null, occ: t.occ || null, note: String(t.note || ''),
  }));
  s.cycleStart = /^\d{4}-\d{2}-\d{2}$/.test(s.cycleStart) ? s.cycleStart : PRESET.start;
  s.startV = s.startV | 0;
  s.routines = (Array.isArray(s.routines) ? s.routines : []).filter((r) => r && r.id && r.title).map((r) => {
    let days = Array.isArray(r.days) ? r.days : [];
    if (r.week !== undefined) {
      // eski biçim (hafta + haftanın günü) → döngü günü
      const st = parse(s.cycleStart), out = [];
      for (let i = 0; i < 14; i++) if (days.includes(mdow(addDays(st, i))) && (r.week === 0 || r.week === Math.floor(i / 7) + 1)) out.push(i + 1);
      days = out;
    }
    return {
      id: String(r.id), title: String(r.title), note: String(r.note || ''),
      color: Number.isInteger(r.color) && r.color >= 0 && r.color < ROUTINE_COLORS ? r.color : (OLD_TAG[r.tag] != null ? OLD_TAG[r.tag] : null),
      days: days.filter((n) => n >= 1 && n <= 14), every: r.every === 2 ? 2 : 1, size: SIZE_OK[r.size] ? r.size : 'm',
    };
  });
  s.counters = (Array.isArray(s.counters) ? s.counters : []).filter((c) => c && c.id && c.title && /^\d{4}-\d{2}-\d{2}$/.test(c.start)).map((c) => ({
    id: String(c.id), title: String(c.title), emoji: String(c.emoji || '📅'), start: c.start,
  }));
  s.events = (Array.isArray(s.events) ? s.events : []).filter((e) => e && e.id && e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.date)).map((e) => ({
    id: String(e.id), title: String(e.title), date: e.date, time: /^\d{2}:\d{2}$/.test(e.time) ? e.time : '',
    kind: e.kind === 'plan' ? 'plan' : 'special', yearly: !!e.yearly, note: String(e.note || ''),
  }));
  s.gen = s.gen && typeof s.gen === 'object' ? s.gen : {};
  s.presetV = s.presetV | 0;
  delete s.badges; delete s.xpBank; delete s.celebratedLevel;
  delete s.glazes; delete s.seenMonth;
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
const ui = { tab: 'today', day: today(), statsMode: 'week', statsOff: 0, pick: null, showDone: false, flash: null, view: 'day', setup: 'habits', planWeek: null, showLater: false, calOff: 0, calDay: null };
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

const totalDoneOf = (h) => Object.keys(h.log).filter((k) => isDone(h, k)).length;

function freqLabel(h) {
  if (h.freq.type === 'daily') return 'Her gün';
  if (h.freq.type === 'weekly') return `Haftada ${h.freq.times} kez`;
  if (h.freq.days.length === 7) return 'Her gün';
  return [...h.freq.days].sort().map((i) => DAYS[i]).join(', ');
}

/* ================= türetilen veriler ================= */
// Kusursuz günler: o gün beklenen bütün alışkanlıklar tamam
function perfectSet() {
  if (memo) return memo;
  const t = today(), tk = dkey(t), out = new Set();
  const fixed = S.habits.filter((h) => !isWeekly(h));
  if (fixed.length) {
    const first = fixed.reduce((m, h) => (h.createdAt < m ? h.createdAt : m), tk);
    for (let d = parse(first); d <= t; d = addDays(d, 1)) {
      const k = dkey(d), sc = fixed.filter((h) => isSched(h, d));
      if (sc.length && sc.every((h) => isDone(h, k))) out.add(k);
    }
  }
  memo = out;
  return out;
}
// Her değişiklikten sonra: kaydet ve çiz
function after() {
  memo = null;
  save();
  render();
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
  const t = today(), perfectDays = perfectSet();
  const doneBy = {};
  S.todos.forEach((x) => { if (x.done) doneBy[x.doneAt] = (doneBy[x.doneAt] || 0) + 1; });
  const days = [];
  let sched = 0, done = 0, perfect = 0, todos = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const future = d > t;
    const info = future ? { k: dkey(d), d, sched: 0, done: 0, rate: null } : dayInfo(d);
    info.future = future;
    info.tasks = doneBy[info.k] || 0;
    info.perfect = perfectDays.has(info.k);
    days.push(info);
    sched += info.sched; done += info.done; todos += info.tasks;
    if (info.perfect) perfect++;
  }
  return { days, sched, done, rate: sched ? done / sched : null, perfect, todos };
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

/* ================= 14 günlük ev işleri rutini ================= */
// Rutin: iki haftalık döngüde belirli günlerde tekrar eden iş.
// Her tekrar, o günün görevi olarak listeye düşer; ertelenebilir, öne alınabilir, tamamlanabilir.
const GEN_AHEAD = 13;
// Rutin 14 gün sürer ve bitince baştan başlar: başlangıç günü 1. gün, 14. günden sonra yine 1. gün.
const CYCLE = 14;
const cycleDay = (d) => Math.round((d - parse(S.cycleStart)) / 864e5); // eksi ise rutin henüz başlamadı
const cycleNo = (d) => { const n = cycleDay(d); return n < 0 ? 0 : (n % CYCLE) + 1; }; // 1–14, başlamadıysa 0
// İçinde bulunulan (ya da ilk) döngünün 1. günü
function cycleBase(d) {
  const n = cycleDay(d);
  return n < 0 ? parse(S.cycleStart) : addDays(parse(S.cycleStart), Math.floor(n / CYCLE) * CYCLE);
}
function routineOn(r, d) {
  const n = cycleDay(d);
  if (n < 0) return false;
  return r.days.includes((n % CYCLE) + 1) && Math.floor(n / CYCLE) % (r.every || 1) === 0;
}
// Gün sayacı: başlangıç günü 1. gün sayılır, her gün kendiliğinden bir artar
const counterDay = (c) => Math.round((today() - parse(c.start)) / 864e5) + 1;
const SINCE = ['tan', 'tan', 'tan', 'dan', 'tan', 'dan', 'dan', 'tan', 'den', 'den', 'dan', 'tan'];
const sinceLabel = (k) => { const d = parse(k); return `${d.getDate()} ${MONTHS[d.getMonth()]}'${SINCE[d.getMonth()]} beri`; };

// Bugünden başlayarak 14 günün rutin görevlerini üretir. Üretilen her tekrar bir kez üretilir.
function syncRoutines() {
  const t = today(), tk = dkey(t);
  for (const key in S.gen) if (key.slice(-10) < tk) delete S.gen[key];
  let n = 0;
  for (let i = 0; i <= GEN_AHEAD; i++) {
    const d = addDays(t, i), k = dkey(d);
    for (const r of S.routines) {
      if (!routineOn(r, d)) continue;
      const key = `${r.id}|${k}`;
      if (S.gen[key]) continue;
      S.gen[key] = 1;
      S.todos.push({ id: uid(), title: r.title, due: k, size: r.size, done: false, doneAt: null, createdAt: tk, rid: r.id, occ: k });
      n++;
    }
  }
  if (n) memo = null;
  return n;
}
// Rutin değişince: bugünden sonraki tamamlanmamış tekrarlarını sil, yeniden üret
function rebuildRoutine(rid) {
  const tk = dkey(today());
  S.todos = S.todos.filter((x) => !(x.rid === rid && !x.done && x.occ >= tk));
  for (const key in S.gen) if (key.startsWith(rid + '|')) delete S.gen[key];
  S.todos.forEach((x) => { if (x.rid === rid && x.occ >= tk) S.gen[`${rid}|${x.occ}`] = 1; });
  memo = null;
}
function rebuildAllRoutines() { S.routines.forEach((r) => rebuildRoutine(r.id)); }
// Hazır planı ve başlangıç gününü bir kez uygular; bir şey değiştiyse true döner.
function applyPreset() {
  let changed = false;
  if ((S.startV | 0) < PRESET.startV) {
    S.cycleStart = PRESET.start; S.startV = PRESET.startV;
    rebuildAllRoutines();
    changed = true;
  }
  if ((S.presetV | 0) < PRESET.version) {
    const tk = dkey(today());
    const haveR = new Set(S.routines.map((r) => r.id));
    PRESET.routines.forEach((r) => {
      if (!haveR.has(r.id)) S.routines.push({ id: r.id, title: r.title, note: r.note || '', color: r.color == null ? null : r.color, days: r.days.slice(), every: r.every === 2 ? 2 : 1, size: r.size || 'm' });
    });
    const haveH = new Set(S.habits.map((h) => h.id)), names = new Set(S.habits.map((h) => h.name.toLocaleLowerCase('tr')));
    PRESET.habits.forEach((h) => {
      if (haveH.has(h.id) || names.has(h.name.toLocaleLowerCase('tr'))) return;
      S.habits.push({
        id: h.id, name: h.name, emoji: h.emoji, color: h.color | 0, kind: 'habit',
        freq: { type: h.days ? 'days' : 'daily', days: h.days ? h.days.slice() : [0, 1, 2, 3, 4], times: 3 },
        target: h.target || 1, unit: h.unit || '', note: h.note || '', group: h.group || '', createdAt: tk, log: {},
      });
    });
    const haveT = new Set(S.todos.map((t) => t.id));
    (PRESET.todos || []).forEach((t) => {
      if (haveT.has(t.id)) return;
      const due = dkey(addDays(parse(S.cycleStart), t.cday - 1));
      S.todos.push({ id: t.id, title: t.title, note: t.note || '', due: due < tk ? tk : due, size: t.size || 'm', done: false, doneAt: null, createdAt: tk, rid: null, occ: null });
    });
    const haveC = new Set(S.counters.map((c) => c.id));
    (PRESET.counters || []).forEach((c) => { if (!haveC.has(c.id)) S.counters.push({ id: c.id, title: c.title, emoji: c.emoji, start: c.start }); });
    S.presetV = PRESET.version;
    memo = null;
    changed = true;
  }
  return changed;
}
// Alışkanlıkları gruba göre toplar; grupsuzlar türüne göre ayrılır
function groupHabits(list) {
  const out = [], at = {};
  list.forEach((h) => {
    const g = h.group || (h.kind === 'hobby' ? 'Hobiler' : 'Alışkanlıklar');
    if (at[g] == null) { at[g] = out.length; out.push([g, []]); }
    out[at[g]][1].push(h);
  });
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

function applyTheme() {
  const r = document.documentElement;
  if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
  const bg = getComputedStyle(r).getPropertyValue('--bg').trim();
  const m = $('#themeColor'); if (m && bg) m.setAttribute('content', bg);
}

/* ================= takvim kayıtları ================= */
const EVENT_KIND = { special: ['🎉', 'Özel gün'], plan: ['📌', 'Plan'] };
// Bir güne düşen özel günler ve planlar (her yıl tekrar edenler dahil)
function eventsOn(k) {
  return S.events
    .filter((e) => e.date === k || (e.yearly && e.date <= k && e.date.slice(5) === k.slice(5)))
    .sort((a, b) => ((a.time || '99') < (b.time || '99') ? -1 : 1));
}
// O gün için henüz göreve dönüşmemiş rutinler (14 günden ötesi)
function projected(d) {
  if (d < today()) return [];
  const k = dkey(d);
  return S.routines.filter((r) => routineOn(r, d) && !S.gen[`${r.id}|${k}`]);
}
function upcomingEvents(limit) {
  const t = today(), out = [];
  for (let i = 0; i <= 120 && out.length < limit; i++) {
    const d = addDays(t, i), k = dkey(d);
    eventsOn(k).forEach((e) => { if (out.length < limit) out.push({ e, d, k, i }); });
  }
  return out;
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
const PLUS = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round"/></svg>';
const SWIPE_HINT = '<p class="hint swipe-hint">Sola kaydır: ertele. Sağa kaydır: bugüne al.</p>';

function habitCard(h, d) {
  const k = dkey(d), c = cnt(h, k), done = c >= h.target;
  const subs = [];
  if (h.target > 1) subs.push(`<span class="num">${c}/${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>`);
  if (isWeekly(h)) subs.push(`<span class="num">Bu hafta ${weekCount(h, weekStart(d))}/${h.freq.times}</span>`);
  if (h.kind === 'hobby') subs.push('<span class="chip">Hobi</span>');
  const control = h.target > 1
    ? `<div class="counter">${c > 0 ? `<button class="minus" data-act="dec" data-id="${h.id}" aria-label="${esc(h.name)}: bir azalt">−</button>` : ''}<button class="ringbtn ${done ? 'on' : ''}" style="--p:${Math.min(100, (c / h.target) * 100)}" data-act="inc" data-id="${h.id}" aria-label="${esc(h.name)}: bir ekle"><span>${done ? ICON.check : '+1'}</span></button></div>`
    : `<button class="check ${done ? 'on' : ''}" data-act="toggle" data-id="${h.id}" aria-pressed="${done}" aria-label="${esc(h.name)}: ${done ? 'geri al' : 'tamamla'}">${ICON.check}</button>`;
  return `<article class="habit ${done ? 'is-done' : ''} ${ui.flash === h.id ? 'just-done' : ''}" style="--tint:${TINTS[h.color]}">
    <button class="habit-open" data-act="edit-habit" data-id="${h.id}" aria-label="${esc(h.name)}: düzenle">
      <span class="emoji">${h.emoji}</span>
      <span class="grow"><span class="habit-name">${esc(h.name)}</span>${subs.length ? `<span class="habit-sub">${subs.join('')}</span>` : ''}${h.note ? `<span class="habit-note">${esc(h.note)}</span>` : ''}</span>
    </button>${control}
  </article>`;
}
function habitGroups(list, d) {
  const k = dkey(d), heads = list.some((h) => h.group);
  return groupHabits(list).map(([title, arr]) => (heads ? `<p class="group-head"><span>${esc(title)}</span><span class="num">${arr.filter((h) => isDone(h, k)).length}/${arr.length}</span></p>` : '') + arr.map((h) => habitCard(h, d)).join('')).join('');
}

function todoRow(td, showDue) {
  const tk = dkey(today());
  const chips = [];
  if (!td.done && td.due && td.due < tk) chips.push(`<span class="chip late">Gecikti · ${dueLabel(td)}</span>`);
  else if (showDue && !td.done) chips.push(`<span class="chip">${dueLabel(td)}</span>`);
  const rt = td.rid ? S.routines.find((x) => x.id === td.rid) : null;
  const note = (rt && rt.note) || td.note;
  const tint = rt && rt.color != null ? ` tinted c${rt.color}` : '';
  const canL = !td.done, canR = !td.done && td.due !== tk;
  return `<div class="swipe" data-id="${td.id}" data-l="${canL ? 1 : 0}" data-r="${canR ? 1 : 0}">
    <div class="swipe-bg" aria-hidden="true"><span class="sb-r">☀️ Bugüne al</span><span class="sb-l">${td.due && td.due > tk ? 'Bir gün ertele' : 'Yarına ertele'} 🌙</span></div>
    <div class="todo ${td.done ? 'is-done' : ''} ${ui.flash === td.id ? 'just-done' : ''}${tint}">
      <button class="tick" data-act="toggle-todo" data-id="${td.id}" aria-pressed="${td.done}" aria-label="${esc(td.title)}: ${td.done ? 'geri al' : 'tamamla'}"><i>${ICON.check}</i></button>
      <button class="todo-body" data-act="edit-todo" data-id="${td.id}"><span class="todo-title">${esc(td.title)}</span>${note ? `<span class="todo-note">${esc(note)}</span>` : ''}${chips.length ? `<span class="todo-meta">${chips.join('')}</span>` : ''}</button>
    </div>
  </div>`;
}
const todoList = (arr, showDue) => `<div class="todo-list">${arr.map((x) => todoRow(x, showDue)).join('')}</div>`;

function eventRow(e, k) {
  const [ic, nm] = EVENT_KIND[e.kind] || EVENT_KIND.plan;
  const years = e.yearly && k ? +k.slice(0, 4) - +e.date.slice(0, 4) : 0;
  return `<button class="event-row ${e.kind}" data-act="edit-event" data-id="${e.id}" aria-label="${esc(e.title)}: düzenle">
    <span class="ev-ic">${ic}</span>
    <span class="grow"><span class="todo-title">${esc(e.title)}</span>${e.note ? `<span class="todo-note">${esc(e.note)}</span>` : ''}
      <span class="todo-meta"><span class="chip">${nm}</span>${e.time ? `<span class="chip num">${esc(e.time)}</span>` : ''}${e.yearly ? `<span class="chip">Her yıl${years > 0 ? ` · ${years}. yıl` : ''}</span>` : ''}</span></span>
  </button>`;
}
const eventList = (arr, k) => (arr.length ? `<div class="todo-list events">${arr.map((e) => eventRow(e, k)).join('')}</div>` : '');

const quickForm = (id) => `<form class="quick" data-form="quick-todo" autocomplete="off">
  <input class="field" id="${id}" name="title" placeholder="Yeni görev yaz" maxlength="120" enterkeyhint="done" aria-label="Yeni görev">
  <button class="btn" type="submit" aria-label="Görevi ekle"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>
</form>`;

function countersRow() {
  if (!S.counters.length) return '';
  return `<div class="counters">${S.counters.map((c) => {
    const n = counterDay(c);
    return `<button class="counter-pill" data-act="edit-counter" data-id="${c.id}" aria-label="${esc(c.title)}: düzenle"><span class="ce">${esc(c.emoji)}</span><span><b class="num">${n > 0 ? `${n}. gün` : `${1 - n} gün sonra`}</b><small>${esc(c.title)}${n > 0 ? ' · ' + sinceLabel(c.start) : ''}</small></span></button>`;
  }).join('')}</div>`;
}

// Tek çatı: günün görevleri, alışkanlıkları ve sonraki günler aynı ekranda
function renderToday() {
  if (ui.view === 'setup') return renderSetup();
  const t = today(), tk = dkey(t), d = ui.day, k = dkey(d), isT = k === tk, tmk = dkey(addDays(t, 1));
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const byDue = (a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0);

  const habits = S.habits.filter((h) => showsOn(h, d));
  const doneH = habits.filter((h) => isDone(h, k)).length;
  const tasks = isT
    ? S.todos.filter((x) => !x.done && x.due && x.due <= tk).sort(byDue).concat(S.todos.filter((x) => x.done && x.doneAt === tk))
    : S.todos.filter((x) => x.done && x.doneAt === k);
  const doneT = tasks.filter((x) => x.done).length;
  const total = habits.length + tasks.length, done = doneH + doneT;

  const ws = weekStart(t);
  let strip = '';
  for (let i = 0; i < 7; i++) {
    const x = addDays(ws, i), xk = dkey(x), fut = x > t;
    const info = fut ? { rate: null } : dayInfo(x);
    const p = info.rate == null ? 0 : Math.round(info.rate * 100);
    strip += `<button class="wday ${xk === k ? 'sel' : ''} ${xk === tk ? 'today' : ''} ${p === 100 ? 'full' : ''}" data-act="day" data-k="${xk}" ${fut ? 'disabled' : ''} aria-label="${fmtLong(x)}${fut ? '' : `, alışkanlıkların ${pct(p / 100)} kadarı tamam`}" aria-pressed="${xk === k}">
      <span class="dname">${DAYS[i]}</span><span class="ring" style="--p:${p}"><span>${x.getDate()}</span></span></button>`;
  }

  const ev = eventsOn(k);
  const evHtml = ev.length ? `<section class="section"><div class="sec-head"><h2>${isT ? 'Bugün takvimde' : 'O gün takvimde'}</h2></div>${eventList(ev, k)}</section>` : '';

  const tasksHtml = tasks.length ? todoList(tasks, false)
    : `<div class="empty dashed"><p>${isT ? 'Bugün için görev yok. Aklına geleni yukarıya yaz.' : 'Bu gün tamamlanan görev yok.'}</p></div>`;
  let habitsHtml;
  if (!S.habits.length) habitsHtml = `<div class="empty dashed"><h3>Henüz alışkanlık yok</h3><p>Her gün ya da belirli günlerde tekrar eden şeyleri buraya ekle.</p><button class="btn sm" data-act="new-habit">Alışkanlık ekle</button></div>`;
  else if (!habits.length) habitsHtml = `<div class="empty dashed"><p>${isT ? 'Bugün için planlı alışkanlık yok.' : 'Bu gün için planlı alışkanlık yoktu.'}</p></div>`;
  else habitsHtml = habitGroups(habits, d);

  let rest = '';
  if (isT) {
    const open = S.todos.filter((x) => !x.done);
    const tom = open.filter((x) => x.due === tmk), tomEv = eventsOn(tmk);
    if (tom.length || tomEv.length) {
      rest += `<section class="section"><div class="sec-head"><h2>Yarın</h2><span class="count num">${tom.length + tomEv.length}</span></div>${eventList(tomEv, tmk)}${tom.length ? todoList(tom, false) + '<p class="hint swipe-hint">Yarının işini bugün yapmak için sağa kaydır.</p>' : ''}</section>`;
    }
    // Sonraki günler: görevler ve takvim kayıtları gün gün
    const later = open.filter((x) => x.due && x.due > tmk).sort(byDue);
    const byDay = {};
    later.forEach((x) => { (byDay[x.due] = byDay[x.due] || { todos: [], ev: [] }).todos.push(x); });
    for (let i = 2; i <= 30; i++) {
      const dk2 = dkey(addDays(t, i)), e2 = eventsOn(dk2);
      if (e2.length) (byDay[dk2] = byDay[dk2] || { todos: [], ev: [] }).ev = e2;
    }
    const keys = Object.keys(byDay).sort();
    if (keys.length) {
      const n = keys.reduce((a, x) => a + byDay[x].todos.length + byDay[x].ev.length, 0);
      const daysHtml = ui.showLater ? keys.map((x) => {
        const dd = parse(x);
        return `<div class="day-head"><b>${DAYS_LONG[mdow(dd)]}</b><span class="num">${fmtShort(dd)}</span></div>${eventList(byDay[x].ev, x)}${byDay[x].todos.length ? todoList(byDay[x].todos, false) : ''}`;
      }).join('') : '';
      rest += `<section class="section"><div class="sec-head"><h2>Sonraki günler</h2><button class="link-btn" data-act="toggle-later">${ui.showLater ? 'Gizle' : `Göster (${n})`}</button></div>${daysHtml}</section>`;
    }
    const undated = open.filter((x) => !x.due);
    if (undated.length) rest += `<section class="section"><div class="sec-head"><h2>Tarihsiz</h2><span class="count num">${undated.length}</span></div>${todoList(undated, false)}</section>`;
    const finished = S.todos.filter((x) => x.done && x.doneAt !== tk).sort((a, b) => (a.doneAt < b.doneAt ? 1 : a.doneAt > b.doneAt ? -1 : 0));
    if (finished.length) {
      rest += `<section class="section"><div class="sec-head"><h2>Tamamlananlar</h2><button class="link-btn" data-act="toggle-done">${ui.showDone ? 'Gizle' : `Göster (${finished.length})`}</button></div>${ui.showDone ? todoList(finished.slice(0, 40), false) : ''}</section>`;
    }
  }

  return `
  <header class="page-head">
    <div class="grow"><p class="eyebrow">${fmtLong(t)}</p><h1>${greet}, ${esc(S.name)}</h1></div>
    <button class="btn sm ghost" data-act="view" data-v="setup">Düzenle</button>
  </header>
  <div class="week" role="group" aria-label="Bu hafta">${strip}</div>
  ${isT ? '' : `<div class="row" style="justify-content:space-between"><b>${fmtLong(d)}</b><button class="link-btn" data-act="go-today">Bugüne dön</button></div>`}
  <div class="progress" role="img" aria-label="${done} / ${total} tamamlandı">
    <div class="prog-top"><b class="num">${done} / ${total}</b><span>${isT ? 'bugün tamamlanan' : 'o gün tamamlanan'}</span></div>
    <div class="xpbar"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i></div>
  </div>
  ${isT ? countersRow() : ''}
  ${evHtml}
  <section class="section">
    <div class="sec-head"><h2>${isT ? 'Görevler' : 'Tamamlanan görevler'}</h2><span class="row">${tasks.length ? `<span class="count num">${doneT}/${tasks.length}</span>` : ''}${isT ? `<button class="add-mini" data-act="new-todo" aria-label="Tarihli görev ekle">${PLUS}</button>` : ''}</span></div>
    ${isT ? quickForm('quickToday') : ''}
    ${tasksHtml}
    ${isT && tasks.some((x) => !x.done) ? SWIPE_HINT : ''}
  </section>
  <section class="section">
    <div class="sec-head"><h2>Alışkanlıklar</h2><span class="row">${habits.length ? `<span class="count num">${doneH}/${habits.length}</span>` : ''}<button class="add-mini" data-act="new-habit" aria-label="Alışkanlık ekle">${PLUS}</button></span></div>
    ${habitsHtml}
  </section>
  ${rest}`;
}

// Düzenleme: bütün alışkanlıklar ve 14 günlük plan
function renderSetup() {
  const t = today(), plan = ui.setup === 'plan';
  const head = `<header class="page-head"><div class="grow"><button class="link-btn back" data-act="view" data-v="day">‹ Bugün</button><h1>Düzenle</h1></div><button class="btn sm ghost" data-act="${plan ? 'new-routine' : 'new-habit'}">${plan ? 'İş ekle' : 'Alışkanlık ekle'}</button></header>
  <div class="seg"><button class="${plan ? '' : 'on'}" data-act="setup" data-v="habits" aria-pressed="${!plan}">Alışkanlıklar</button><button class="${plan ? 'on' : ''}" data-act="setup" data-v="plan" aria-pressed="${plan}">Ev işleri rutini</button></div>`;
  if (plan) return head + renderPlan();
  const card = (h) => {
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const x = addDays(t, -i), xk = dkey(x);
      dots += `<i class="${isDone(h, xk) ? 'on' : (isWeekly(h) || !isSched(h, x)) ? 'off' : ''}"></i>`;
    }
    const hp = habitPeriod(h, addDays(t, -29), t);
    const sub = [`<span>${freqLabel(h)}</span>`];
    if (h.target > 1) sub.push(`<span>Günde ${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>`);
    return `<article class="habit" style="--tint:${TINTS[h.color]}">
      <button class="habit-open" data-act="edit-habit" data-id="${h.id}" aria-label="${esc(h.name)}: düzenle">
        <span class="emoji">${h.emoji}</span>
        <span class="grow"><span class="habit-name">${esc(h.name)}</span><span class="habit-sub">${sub.join('<span aria-hidden="true">·</span>')}</span>
          <span class="dots7" style="margin-top:7px" role="img" aria-label="Son 7 gün">${dots}</span></span>
        <span class="rate-col"><b class="num">${hp.rate == null ? '–' : pct(hp.rate)}</b><small>30 gün</small></span>
      </button>
    </article>`;
  };
  const body = S.habits.length
    ? groupHabits(S.habits).map(([title, arr]) => `<section class="section"><div class="sec-head"><h2>${esc(title)}</h2><span class="count num">${arr.length}</span></div>${arr.map(card).join('')}</section>`).join('') + '<p class="hint" style="text-align:center">Kutucuklar son 7 günü gösterir. Düzenlemek için karta dokun.</p>'
    : `<div class="empty dashed"><h3>Henüz alışkanlık yok</h3><p>Su içmek, kitap okumak, spor… Takip etmek istediğin ilk şeyi ekle.</p></div>`;
  return head + body;
}

function renderPlan() {
  const t = today(), c = cycleNo(t), base = cycleBase(t);
  const cyc = c ? Math.floor(cycleDay(t) / CYCLE) : 0;
  const half = ui.planWeek || (c > 7 ? 2 : 1);
  const span = (a) => { const b = addDays(a, 6); return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MONTHS_S[a.getMonth()]}` : `${fmtShort(a)}–${fmtShort(b)}`; };
  let days = '';
  for (let cd = (half - 1) * 7 + 1; cd <= half * 7; cd++) {
    const d = addDays(base, cd - 1);
    const items = S.routines.filter((r) => r.days.includes(cd)).sort((a, b) => (a.color == null ? 9 : a.color) - (b.color == null ? 9 : b.color));
    days += `<section class="plan-day ${dkey(d) === dkey(t) ? 'is-today' : ''}">
      <div class="plan-head"><b>${DAYS_LONG[mdow(d)]}, ${fmtShort(d)}</b><span class="muted small num">${cd}. gün</span><span class="grow"></span><button class="add-mini" data-act="new-routine" data-d="${cd}" aria-label="${cd}. güne iş ekle">${PLUS}</button></div>
      ${items.length ? `<div class="todo-list">${items.map((r) => `<button class="plan-item${r.color != null ? ` tinted c${r.color}` : ''}" data-act="edit-routine" data-id="${r.id}"><span class="grow">${esc(r.title)}${r.note ? `<span class="todo-note">${esc(r.note)}</span>` : ''}</span>${r.every === 2 ? `<span class="chip">${cyc % 2 === 0 ? 'Ayda bir' : 'Ayda bir, bu sefer yok'}</span>` : ''}</button>`).join('')}</div>` : '<p class="plan-empty">Boş gün</p>'}
    </section>`;
  }
  const status = c ? `Bugün rutinin ${c}. günü` : cycleDay(t) === -1 ? 'Ev işleri rutini yarın başlıyor' : `Ev işleri rutini ${fmtLong(base)} günü başlıyor`;
  return `<div class="card pad stack">
    <div><b>${status}</b><span class="hint" style="display:block">Rutin 14 gün sürer, bitince baştan başlar. Her günün işleri o günün görevlerine kendiliğinden eklenir.</span></div>
    <div class="setting"><label for="cycleDate">Rutinin ilk günü</label><input class="field" type="date" id="cycleDate" value="${esc(S.cycleStart)}"></div>
  </div>
  <div class="seg">${[1, 2].map((x) => `<button class="${half === x ? 'on' : ''}" data-act="plan-week" data-v="${x}" aria-pressed="${half === x}">${x === 1 ? 'İlk hafta' : 'İkinci hafta'} · ${span(addDays(base, (x - 1) * 7))}</button>`).join('')}</div>
  ${days}`;
}

function renderCal() {
  const t = today(), tk = dkey(t);
  const first = new Date(t.getFullYear(), t.getMonth() + ui.calOff, 1);
  const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const sel = ui.calDay || tk, sd = parse(sel);
  const due = {};
  S.todos.forEach((x) => { if (x.due) { const o = due[x.due] || (due[x.due] = { n: 0, open: 0 }); o.n++; if (!x.done) o.open++; } });

  let cells = DAYS.map((x) => `<span class="hd">${x}</span>`).join('') + '<span></span>'.repeat(mdow(first));
  for (let i = 1; i <= dim; i++) {
    const d = new Date(first.getFullYear(), first.getMonth(), i), k = dkey(d);
    const ev = eventsOn(k), pr = projected(d).length;
    const n = (due[k] ? due[k].n : 0) + pr, open = (due[k] ? due[k].open : 0) + pr;
    const parts = [];
    if (ev.length) parts.push(`${ev.length} takvim kaydı`);
    if (n) parts.push(`${n} görev`);
    cells += `<button class="cal-cell ${k === tk ? 'is-today' : ''} ${k === sel ? 'sel' : ''} ${d < t ? 'past' : ''}" data-act="cal-day" data-k="${k}" aria-pressed="${k === sel}" aria-label="${fmtLong(d)}${parts.length ? ', ' + parts.join(', ') : ''}">
      <span class="cn num">${i}</span><span class="cm">${ev.some((e) => e.kind === 'special') ? '<i class="m-sp"></i>' : ''}${ev.some((e) => e.kind === 'plan') ? '<i class="m-pl"></i>' : ''}${n ? `<i class="m-task ${open ? '' : 'done'}"></i>` : ''}</span></button>`;
  }

  const ev = eventsOn(sel), todos = S.todos.filter((x) => x.due === sel).sort((a, b) => a.done - b.done), proj = projected(sd);
  const habits = S.habits.filter((h) => showsOn(h, sd));
  const projHtml = proj.length ? `<div class="todo-list">${proj.map((r) => `<div class="todo proj${r.color != null ? ` tinted c${r.color}` : ''}"><span class="tick"><i></i></span><span class="todo-body"><span class="todo-title">${esc(r.title)}</span>${r.note ? `<span class="todo-note">${esc(r.note)}</span>` : ''}<span class="todo-meta"><span class="chip">Günü gelince listeye düşer</span></span></span></div>`).join('')}</div>` : '';
  const habitChips = habits.length
    ? `<div class="hchips">${habits.map((h) => `<span class="hchip ${sd <= t && isDone(h, sel) ? 'on' : ''}">${h.emoji} ${esc(h.name)}</span>`).join('')}</div>`
    : '<p class="hint">Bu gün için planlı alışkanlık yok.</p>';
  const up = upcomingEvents(6);

  return `<header class="page-head"><div><h1>Takvim</h1><p class="sub">Özel günler, ek planlar ve günün işleri</p></div><button class="btn sm" data-act="new-event" data-k="${sel}">${PLUS}Ekle</button></header>
  <div class="period"><button class="nav-btn" data-act="cal-nav" data-v="-1" aria-label="Önceki ay">${ICON.left}</button>
    <h2>${MONTHS[first.getMonth()]} ${first.getFullYear()}</h2>
    <button class="nav-btn" data-act="cal-nav" data-v="1" aria-label="Sonraki ay">${ICON.right}</button></div>
  <section class="card pad">
    <div class="cal">${cells}</div>
    <div class="cal-legend"><span><i class="m-sp"></i>Özel gün</span><span><i class="m-pl"></i>Plan</span><span><i class="m-task"></i>Görev</span>${ui.calOff !== 0 || sel !== tk ? '<button class="link-btn" data-act="cal-today">Bugüne dön</button>' : ''}</div>
  </section>
  <div class="row" style="justify-content:space-between;padding:0 2px"><h2 class="cal-title">${fmtLong(sd)}${sd.getFullYear() !== t.getFullYear() ? ' ' + sd.getFullYear() : ''}</h2></div>
  <section class="section">
    <div class="sec-head"><h2>Özel günler ve planlar</h2><button class="add-mini" data-act="new-event" data-k="${sel}" aria-label="Bu güne özel gün ya da plan ekle">${PLUS}</button></div>
    ${ev.length ? eventList(ev, sel) : '<div class="empty dashed"><p>Bu güne eklenmiş bir şey yok. Doğum günü, randevu, misafir, gezi gibi şeyleri buraya ekleyebilirsin.</p></div>'}
  </section>
  <section class="section">
    <div class="sec-head"><h2>Görevler</h2><span class="row">${todos.length + proj.length ? `<span class="count num">${todos.length + proj.length}</span>` : ''}<button class="add-mini" data-act="new-todo" data-k="${sel}" aria-label="Bu güne görev ekle">${PLUS}</button></span></div>
    ${todos.length ? todoList(todos, false) : ''}${projHtml}${todos.length + proj.length ? '' : '<div class="empty dashed"><p>Bu gün için görev yok.</p></div>'}
  </section>
  <section class="section"><div class="sec-head"><h2>Alışkanlıklar</h2>${habits.length ? `<span class="count num">${habits.length}</span>` : ''}</div>${habitChips}</section>
  ${up.length ? `<section class="section"><div class="sec-head"><h2>Yaklaşanlar</h2></div><div class="todo-list">${up.map(({ e, d, k, i }) => `<button class="event-row ${e.kind}" data-act="cal-day" data-k="${k}"><span class="ev-ic">${(EVENT_KIND[e.kind] || EVENT_KIND.plan)[0]}</span><span class="grow"><span class="todo-title">${esc(e.title)}</span><span class="todo-note">${fmtLong(d)}${e.time ? ' · ' + esc(e.time) : ''}</span></span><span class="chip num">${i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : `${i} gün`}</span></button>`).join('')}</div></section>` : ''}`;
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

  const head = `<header class="page-head"><div><h1>Analiz</h1><p class="sub">Haftalık ve aylık özet</p></div></header>
  <div class="seg" role="tablist"><button role="tab" aria-selected="${week}" class="${week ? 'on' : ''}" data-act="stats-mode" data-v="week">Haftalık</button><button role="tab" aria-selected="${!week}" class="${week ? '' : 'on'}" data-act="stats-mode" data-v="month">Aylık</button></div>
  <div class="period"><button class="nav-btn" data-act="stats-nav" data-v="-1" aria-label="Önceki dönem">${ICON.left}</button>
    <h2>${title}${week && ui.statsOff >= -1 ? `<span class="small muted" style="display:block;font-weight:600">${fmtShort(start)} – ${fmtShort(end)}</span>` : ''}</h2>
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
    <div class="tile"><div class="lab">Alışkanlık işareti</div><div class="val">${P.done}<small> / ${P.sched}</small></div><div class="delta">${week ? 'Önceki hafta' : 'Önceki ay'} ${Q.done}</div></div>
    <div class="tile"><div class="lab">Biten görev</div><div class="val">${P.todos}</div><div class="delta">${week ? 'Önceki hafta' : 'Önceki ay'} ${Q.todos}</div></div>
    <div class="tile"><div class="lab">Kusursuz gün</div><div class="val">${P.perfect}<small> / ${elapsed.length} gün</small></div><div class="delta">Hepsinin tamamlandığı günler</div></div>
  </div>`;

  const pick = P.days.find((x) => x.k === ui.pick && !x.future);
  const scored = elapsed.filter((x) => x.rate != null);
  const best = scored.length ? scored.reduce((a, b) => (b.rate > a.rate ? b : a)) : null;
  const dayNote = (x) => `<b>${DAYS_LONG[mdow(x.d)]}, ${fmtShort(x.d)}</b>: ${x.sched ? `${x.done}/${x.sched} alışkanlık (${pct(x.rate)})` : 'planlı alışkanlık yok'}, ${x.tasks} görev`;
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
    main = `<section class="card panel"><h3>Ay takvimi</h3><div class="heat">${cells}</div>
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
      const n = P.days.filter((x) => x.d >= a && x.d <= b).reduce((s, x) => s + x.done + x.tasks, 0);
      weeks.push({ a, b, n, future: a > t });
    }
    const maxN = Math.max(1, ...weeks.map((w) => w.n));
    main += `<section class="card panel"><h3>Haftalara göre tamamlanan</h3><div class="barchart" style="padding-left:0;height:150px"><div class="grid" style="left:0"><i class="base" style="top:100%"></i></div><div class="bars" style="left:0">${weeks.map((w) => {
      const h = Math.round((w.n / maxN) * 84);
      return `<div class="bar-col gold"><span class="plot">${w.future ? '' : `<span class="top" style="bottom:calc(${h}% + 4px)">${w.n}</span><span class="bar ${w.n ? '' : 'zero'}" style="height:${h}%"></span>`}</span><span class="x">${w.a.getDate() === w.b.getDate() ? w.a.getDate() : `${w.a.getDate()}–${w.b.getDate()}`}</span></div>`;
    }).join('')}</div></div><p class="hint" style="margin-top:8px">Alışkanlık işaretleri ve biten görevler birlikte. Altındaki sayılar ayın günleridir.</p></section>`;
  }

  // Öne çıkanlar
  const ins = [];
  if (best && best.rate > 0) ins.push(['☀️', `En iyi gün: <b>${DAYS_LONG[mdow(best.d)]}${week ? '' : ', ' + fmtShort(best.d)}</b> (${pct(best.rate)})`]);
  const hp = S.habits.map((h) => ({ h, p: habitPeriod(h, start, end) })).filter((x) => x.p.rate != null);
  if (hp.length) {
    const top = hp.reduce((a, b) => (b.p.rate > a.p.rate ? b : a)), low = hp.reduce((a, b) => (b.p.rate < a.p.rate ? b : a));
    if (top.p.rate > 0) ins.push([top.h.emoji, `En düzenli: <b>${esc(top.h.name)}</b> (${pct(top.p.rate)})`]);
    if (hp.length > 1 && low.h.id !== top.h.id && low.p.rate < 0.6) ins.push([low.h.emoji, `Biraz ilgi bekliyor: <b>${esc(low.h.name)}</b> (${pct(low.p.rate)})`]);
  }
  const insHtml = ins.length ? `<section class="card panel"><h3>Öne çıkanlar</h3><div class="insights">${ins.map(([ic, tx]) => `<div class="insight"><span class="ic">${ic}</span><span>${tx}</span></div>`).join('')}</div></section>` : '';

  return head + tiles + main + insHtml;
}

function renderSettings() {
  const themeBtn = (v, tx) => `<button class="${S.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}" aria-pressed="${S.theme === v}">${tx}</button>`;
  return `<header class="page-head"><div><h1>Ayarlar</h1><p class="sub">Görünüm, yedek ve diğerleri</p></div></header>
  <div class="card pad stack" style="gap:18px">
    <div class="setting"><label for="setName">Adın</label><input class="field" id="setName" value="${esc(S.name)}" maxlength="24" autocomplete="off"></div>
    <div class="setting"><span class="lab2">Görünüm</span><div class="seg">${themeBtn('auto', 'Otomatik')}${themeBtn('light', 'Açık')}${themeBtn('dark', 'Koyu')}</div></div>
    <div class="setting"><span class="lab2">Gün sayaçları</span><button class="btn ghost sm" data-act="new-counter">Gün sayacı ekle</button><p class="hint">Bir başlangıç gününden bugüne kaçıncı gün olduğunu gösterir. Bugün ekranının üstünde durur; dokununca düzenlenir ya da silinir.</p></div>
    <div class="setting"><span class="lab2">Yedek</span>
      <div class="row"><button class="btn ghost sm grow" data-act="export">Yedeği indir</button><button class="btn ghost sm grow" data-act="import">Yedekten yükle</button></div>
      <input type="file" id="importFile" accept="application/json,.json" hidden>
      <p class="hint">Veriler yalnızca bu telefonda durur. Telefon değiştirmeden önce yedek al.</p></div>
    <div class="setting"><span class="lab2">Ana ekrana ekle</span><p class="hint">iPhone'da Safari'nin Paylaş menüsünden, Android'de Chrome menüsünden "Ana Ekrana Ekle"yi seç. Uygulama gibi açılır ve internetsiz de çalışır.</p></div>
    <button class="btn danger sm" data-act="reset">Her şeyi sıfırla</button>
  </div>`;
}

const VIEWS = { today: renderToday, cal: renderCal, stats: renderStats, settings: renderSettings };

function render(enter) {
  const v = $('#view');
  v.innerHTML = VIEWS[ui.tab]();
  ui.flash = null;
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
    ? { form: 'habit', id: h.id, name: h.name, emoji: h.emoji, color: h.color, kind: h.kind, ftype: h.freq.type, days: [...h.freq.days], times: h.freq.times, mode: h.target > 1 ? 'counter' : 'check', target: h.target > 1 ? h.target : 8, unit: h.unit, note: h.note || '', group: h.group || '', emojiOpen: false, touched: true }
    : { form: 'habit', id: null, name: '', emoji: '🌱', color: S.habits.length % TINTS.length, kind: 'habit', ftype: 'daily', days: [0, 1, 2, 3, 4], times: 3, mode: 'check', target: 8, unit: '', note: '', group: '', emojiOpen: false, touched: false };
  drawHabitForm();
  if (!h) setTimeout(() => { const el = $('#hfName'); if (el) el.focus(); }, 320);
}
function drawHabitForm() {
  const d = draft, editing = !!d.id;
  let stats = '';
  if (editing) {
    const h = findH(d.id), t = today(), p7 = habitPeriod(h, addDays(t, -6), t), p30 = habitPeriod(h, addDays(t, -29), t);
    stats = `<div class="mini-stats"><div><b>${p7.rate == null ? '–' : pct(p7.rate)}</b><span>son 7 gün</span></div><div><b>${p30.rate == null ? '–' : pct(p30.rate)}</b><span>son 30 gün</span></div><div><b>${totalDoneOf(h)}</b><span>toplam işaret</span></div></div>`;
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
    <div class="setting"><label for="hfNote">Not</label><input class="field" id="hfNote" data-bind="note" value="${esc(d.note)}" placeholder="İsteğe bağlı. Örn. adımlar" maxlength="160" autocomplete="off"></div>
    <div class="setting"><label for="hfGroup">Grup</label><input class="field" id="hfGroup" data-bind="group" value="${esc(d.group)}" placeholder="İsteğe bağlı. Örn. Spor, Ev" maxlength="24" autocomplete="off" list="groupList"><datalist id="groupList">${[...new Set(S.habits.map((h) => h.group).filter(Boolean))].map((g) => `<option value="${esc(g)}">`).join('')}</datalist></div>
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
    note: d.note.trim(), group: d.group.trim(),
  };
  if (d.id) Object.assign(findH(d.id), fields);
  else S.habits.push(Object.assign({ id: uid(), createdAt: dkey(today()), log: {} }, fields));
  const isNew = !d.id;
  closeSheet();
  after();
  if (isNew) toast(fields.emoji, 'Eklendi', name);
}

/* ---- görev formu ---- */
function openTodoForm(id, dateKey) {
  const td = id ? findT(id) : null, tk = dkey(today()), tmk = dkey(addDays(today(), 1));
  draft = td
    ? { form: 'todo', id: td.id, title: td.title, dueMode: !td.due ? 'none' : td.due === tk ? 'today' : td.due === tmk ? 'tomorrow' : 'date', date: td.due || tk, size: td.size }
    : { form: 'todo', id: null, title: '', dueMode: !dateKey || dateKey === tk ? 'today' : dateKey === tmk ? 'tomorrow' : 'date', date: dateKey || tk, size: 'm' };
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

/* ---- rutin formu ---- */
function openRoutineForm(id, cday) {
  const r = id ? S.routines.find((x) => x.id === id) : null;
  draft = r
    ? { form: 'routine', id: r.id, title: r.title, note: r.note || '', days: [...r.days], size: r.size, every: r.every || 1, color: r.color }
    : { form: 'routine', id: null, title: '', note: '', days: cday ? [cday] : [], size: 'm', every: 1, color: null };
  drawRoutineForm();
  if (!r) setTimeout(() => { const el = $('#rfTitle'); if (el) el.focus(); }, 320);
}
function drawRoutineForm() {
  const d = draft, editing = !!d.id, base = cycleBase(today());
  const pick = (v, cur, act, tx) => `<button class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${tx}</button>`;
  setSheet(`${sheetHead(editing ? 'İşi düzenle' : 'Rutine iş ekle')}
  <div class="sheet-body">
    <div class="setting"><label for="rfTitle">Ne yapılacak?</label><input class="field" id="rfTitle" data-bind="title" value="${esc(d.title)}" placeholder="Örn. Nevresimi değiştir" maxlength="120" autocomplete="off" enterkeyhint="done"></div>
    <div class="setting"><label for="rfNote">Not</label><input class="field" id="rfNote" data-bind="note" value="${esc(d.note)}" placeholder="İsteğe bağlı. Örn. süpür, ayna, lavabo" maxlength="160" autocomplete="off"></div>
    <div class="setting"><span class="lab2">Rutinin hangi günleri?</span>
      <div class="cdaypick">${Array.from({ length: CYCLE }, (_, i) => `<button class="${d.days.includes(i + 1) ? 'on' : ''}" data-act="rf-day" data-v="${i + 1}" aria-pressed="${d.days.includes(i + 1)}" aria-label="${i + 1}. gün, ${DAYS_LONG[mdow(addDays(base, i))]}"><b>${i + 1}</b><small>${DAYS[mdow(addDays(base, i))]}</small></button>`).join('')}</div></div>
    <div class="setting"><span class="lab2">Ne sıklıkla?</span><div class="seg">${pick(1, d.every, 'rf-every', '14 günde bir')}${pick(2, d.every, 'rf-every', 'Ayda bir')}</div></div>
    <div class="setting"><span class="lab2">Renk</span><div class="swatches">${Array.from({ length: ROUTINE_COLORS }, (_, i) => `<button class="swatch tinted c${i} ${d.color === i ? 'on' : ''}" data-act="rf-color" data-v="${i}" aria-label="Renk ${i + 1}" aria-pressed="${d.color === i}"></button>`).join('')}</div><p class="hint">Aynı türden işlere aynı rengi verirsen listede bir bakışta ayırt edersin. Rengi kaldırmak için seçili renge yeniden dokun.</p></div>
    <p class="hint">İş, seçtiğin günlerde görev olarak listene düşer. O günkü görevi erteleyebilir ya da öne alabilirsin; rutin değişmez.</p>
  </div>
  <div class="sheet-foot">${editing ? `<button class="btn danger" data-act="rf-delete" aria-label="Sil">${ICON.trash}</button>` : ''}<button class="btn" data-act="rf-save">${editing ? 'Kaydet' : 'Ekle'}</button></div>`);
}
function saveRoutine() {
  const d = draft, title = d.title.trim();
  if (!title) { shake('#rfTitle'); return; }
  if (!d.days.length) { toast('📅', 'En az bir gün seç'); return; }
  const fields = { title, note: d.note.trim(), days: [...d.days].sort((a, b) => a - b), size: d.size, every: d.every === 2 ? 2 : 1, color: d.color };
  let id = d.id;
  if (id) {
    Object.assign(S.routines.find((x) => x.id === id), fields);
    S.todos.forEach((x) => { if (x.rid === id && !x.done) { x.title = title; x.size = d.size; } });
  } else { id = uid(); S.routines.push(Object.assign({ id }, fields)); }
  rebuildRoutine(id);
  syncRoutines();
  closeSheet();
  after();
}

/* ---- gün sayacı formu ---- */
function openCounterForm(id) {
  const c = id ? S.counters.find((x) => x.id === id) : null;
  draft = c ? { form: 'counter', id: c.id, title: c.title, emoji: c.emoji, start: c.start } : { form: 'counter', id: null, title: '', emoji: '📅', start: dkey(today()) };
  drawCounterForm();
}
function drawCounterForm() {
  const d = draft, editing = !!d.id;
  setSheet(`${sheetHead(editing ? 'Sayacı düzenle' : 'Yeni gün sayacı')}
  <div class="sheet-body">
    <div class="setting"><label for="cfTitle">Neyi sayıyor?</label>
      <div class="name-row"><input class="field" id="cfEmoji" data-bind="emoji" value="${esc(d.emoji)}" maxlength="4" aria-label="Simge" style="width:64px;flex:none;text-align:center;padding:0"><input class="field" id="cfTitle" data-bind="title" value="${esc(d.title)}" placeholder="Örn. Sigarasız" maxlength="30" autocomplete="off"></div></div>
    <div class="setting"><label for="cfStart">Başlangıç günü</label><input class="field" type="date" id="cfStart" data-bind="start" value="${esc(d.start)}"></div>
    <p class="hint">Başlangıç günü 1. gün sayılır. Sayacı sıfırlamak için başlangıç gününü değiştir.</p>
  </div>
  <div class="sheet-foot">${editing ? `<button class="btn danger" data-act="cf-delete" aria-label="Sil">${ICON.trash}</button>` : ''}<button class="btn" data-act="cf-save">${editing ? 'Kaydet' : 'Ekle'}</button></div>`);
}
function saveCounter() {
  const d = draft, title = d.title.trim();
  if (!title) { shake('#cfTitle'); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.start)) { shake('#cfStart'); return; }
  const fields = { title, emoji: d.emoji.trim() || '📅', start: d.start };
  if (d.id) Object.assign(S.counters.find((x) => x.id === d.id), fields);
  else S.counters.push(Object.assign({ id: uid() }, fields));
  closeSheet();
  after();
}

/* ---- takvim kaydı formu: özel gün ya da plan ---- */
function openEventForm(id, dateKey) {
  const e = id ? S.events.find((x) => x.id === id) : null;
  draft = e
    ? { form: 'event', id: e.id, title: e.title, kind: e.kind, date: e.date, time: e.time, yearly: e.yearly, note: e.note }
    : { form: 'event', id: null, title: '', kind: 'special', date: dateKey || ui.calDay || dkey(today()), time: '', yearly: false, note: '' };
  drawEventForm();
  if (!e) setTimeout(() => { const el = $('#efTitle'); if (el) el.focus(); }, 320);
}
function drawEventForm() {
  const d = draft, editing = !!d.id;
  const pick = (v, cur, act, tx) => `<button class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${tx}</button>`;
  setSheet(`${sheetHead(editing ? 'Düzenle' : 'Takvime ekle')}
  <div class="sheet-body">
    <div class="setting"><label for="efTitle">Ne var?</label><input class="field" id="efTitle" data-bind="title" value="${esc(d.title)}" placeholder="Örn. Annemin doğum günü, diş randevusu" maxlength="80" autocomplete="off" enterkeyhint="done"></div>
    <div class="setting"><span class="lab2">Tür</span><div class="seg">${pick('special', d.kind, 'ef-kind', '🎉 Özel gün')}${pick('plan', d.kind, 'ef-kind', '📌 Plan')}</div></div>
    <div class="setting"><label for="efDate">Tarih</label><input class="field" type="date" id="efDate" data-bind="date" value="${esc(d.date)}"></div>
    <div class="setting"><label for="efTime">Saat</label><input class="field" type="time" id="efTime" data-bind="time" value="${esc(d.time)}"><p class="hint">İsteğe bağlı.</p></div>
    <div class="setting"><span class="lab2">Tekrar</span><div class="seg">${pick('0', d.yearly ? '1' : '0', 'ef-yearly', 'Bir kez')}${pick('1', d.yearly ? '1' : '0', 'ef-yearly', 'Her yıl')}</div></div>
    <div class="setting"><label for="efNote">Not</label><input class="field" id="efNote" data-bind="note" value="${esc(d.note)}" placeholder="İsteğe bağlı" maxlength="160" autocomplete="off"></div>
  </div>
  <div class="sheet-foot">${editing ? `<button class="btn danger" data-act="ef-delete" aria-label="Sil">${ICON.trash}</button>` : ''}<button class="btn" data-act="ef-save">${editing ? 'Kaydet' : 'Ekle'}</button></div>`);
}
function saveEvent() {
  const d = draft, title = d.title.trim();
  if (!title) { shake('#efTitle'); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) { shake('#efDate'); return; }
  const fields = { title, kind: d.kind === 'plan' ? 'plan' : 'special', date: d.date, time: /^\d{2}:\d{2}$/.test(d.time) ? d.time : '', yearly: !!d.yearly, note: d.note.trim() };
  if (d.id) Object.assign(S.events.find((x) => x.id === d.id), fields);
  else S.events.push(Object.assign({ id: uid() }, fields));
  if (ui.tab === 'cal') {
    const t = today(), dd = parse(d.date);
    ui.calDay = d.date; ui.calOff = (dd.getFullYear() - t.getFullYear()) * 12 + dd.getMonth() - t.getMonth();
  }
  closeSheet();
  after();
}

/* ---- ilk açılış ---- */
function openOnboarding() {
  draft = { form: 'onboard', sel: S.habits.length ? [] : [0, 1, 2] };
  drawOnboarding();
}
function drawOnboarding() {
  if (S.habits.length || S.routines.length) {
    setSheet(`${sheetHead(`Hoş geldin, ${esc(S.name)}`)}
    <div class="sheet-body">
      <p class="muted">Planın yüklendi: ${S.habits.length} alışkanlık ve ${S.routines.length} işlik ev işleri rutini. ${cycleNo(today()) ? '' : 'Ev işleri rutini ' + (cycleDay(today()) === -1 ? 'yarın' : fmtShort(parse(S.cycleStart)) + ' günü') + ' başlıyor.'}</p>
      <p class="muted">Her günün ev işleri o günün görevlerine kendiliğinden eklenir. Bir görevi ertelemek için sola, bugüne almak için sağa kaydır.</p>
      <p class="muted">Doğum günü, randevu gibi özel günleri ve ek planları Takvim sekmesinden ekleyebilirsin.</p>
    </div>
    <div class="sheet-foot"><button class="btn" data-act="close-sheet">Başla</button></div>`);
    return;
  }
  setSheet(`${sheetHead(`Hoş geldin, ${esc(S.name)}`)}
  <div class="sheet-body">
    <p class="muted">Alışkanlıklarını, görevlerini ve özel günlerini buradan takip edersin.</p>
    <div class="setting"><span class="lab2">Başlamak için birkaçını seç</span>
      <div class="starters">${STARTERS.map((s, i) => `<button class="starter ${draft.sel.includes(i) ? 'on' : ''}" data-act="ob-pick" data-v="${i}" aria-pressed="${draft.sel.includes(i)}"><span>${s.emoji}</span>${s.name}</button>`).join('')}</div>
      <p class="hint">Hepsini sonradan değiştirebilir, kendi alışkanlıklarını ekleyebilirsin.</p></div>
  </div>
  <div class="sheet-foot"><button class="btn ghost" data-act="close-sheet">Kendim eklerim</button><button class="btn" data-act="ob-go">Başla</button></div>`);
}

/* ================= işlemler ================= */
function bumpHabit(id, delta) {
  const h = findH(id); if (!h) return;
  const k = dkey(ui.day), before = cnt(h, k);
  const c = h.target === 1 ? (before ? 0 : 1) : clamp(before + delta, 0, 999);
  if (c) h.log[k] = c; else delete h.log[k];
  if (c >= h.target && before < h.target) { ui.flash = id; buzz(14); } else if (c > before) buzz(8);
  after();
}

function toggleTodo(id) {
  const td = findT(id); if (!td) return;
  td.done = !td.done;
  td.doneAt = td.done ? dkey(today()) : null;
  if (td.done) { ui.flash = id; buzz(14); }
  after();
}

// dir > 0: bugüne al, dir < 0: bir gün ertele
function shiftTodo(id, dir) {
  const td = findT(id); if (!td || td.done) return;
  const t = today(), tk = dkey(t);
  if (dir > 0) {
    if (td.due === tk) return;
    td.due = tk;
    toast('☀️', 'Bugüne alındı', td.title);
  } else {
    const base = td.due && td.due > tk ? parse(td.due) : t;
    td.due = dkey(addDays(base, 1));
    toast('🌙', td.due === dkey(addDays(t, 1)) ? 'Yarına ertelendi' : `${dueLabel(td)} gününe ertelendi`, td.title);
  }
  buzz(10);
  after();
}

function switchTab(tab) {
  if (!VIEWS[tab]) return;
  ui.tab = tab; ui.pick = null;
  if (tab === 'today') { ui.day = today(); ui.view = 'day'; }
  render(true);
  window.scrollTo(0, 0);
}

const ACT = {
  tab: (el) => switchTab(el.dataset.tab),
  view: (el) => { ui.view = el.dataset.v; ui.planWeek = null; render(true); window.scrollTo(0, 0); },
  setup: (el) => { ui.setup = el.dataset.v; ui.planWeek = null; render(); },
  day: (el) => { ui.day = parse(el.dataset.k); render(); },
  'go-today': () => { ui.day = today(); render(); },
  toggle: (el) => bumpHabit(el.dataset.id, 1),
  inc: (el) => bumpHabit(el.dataset.id, 1),
  dec: (el) => bumpHabit(el.dataset.id, -1),
  'toggle-todo': (el) => toggleTodo(el.dataset.id),
  'toggle-done': () => { ui.showDone = !ui.showDone; render(); },
  'toggle-later': () => { ui.showLater = !ui.showLater; render(); },
  'new-habit': () => openHabitForm(),
  'new-todo': (el) => openTodoForm(null, el.dataset.k || null),
  'edit-habit': (el) => openHabitForm(el.dataset.id),
  'edit-todo': (el) => openTodoForm(el.dataset.id),
  'close-sheet': () => closeSheet(),
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
      title: 'Silinsin mi?', text: `"${esc(h.name)}" ve geçmiş kayıtları silinecek.`, yes: 'Sil', danger: true,
      onYes: () => { S.habits = S.habits.filter((x) => x.id !== h.id); after(); toast('🍂', 'Silindi', h.name); },
    });
  },

  'tf-set': (el) => { draft[el.dataset.f] = el.dataset.v; drawTodoForm(); },
  'tf-save': () => saveTodo(),
  'tf-delete': () => {
    const td = findT(draft.id); if (!td) return;
    S.todos = S.todos.filter((x) => x.id !== td.id);
    closeSheet(); after(); toast('🍂', 'Görev silindi', td.title);
  },

  'plan-week': (el) => { ui.planWeek = +el.dataset.v; render(); },
  'new-routine': (el) => openRoutineForm(null, el.dataset.d != null ? +el.dataset.d : null),
  'edit-routine': (el) => openRoutineForm(el.dataset.id),
  'rf-day': (el) => { const i = +el.dataset.v, at = draft.days.indexOf(i); if (at >= 0) draft.days.splice(at, 1); else draft.days.push(i); drawRoutineForm(); },
  'rf-every': (el) => { draft.every = +el.dataset.v; drawRoutineForm(); },
  'rf-color': (el) => { const v = +el.dataset.v; draft.color = draft.color === v ? null : v; drawRoutineForm(); },
  'rf-save': () => saveRoutine(),
  'rf-delete': () => {
    const r = S.routines.find((x) => x.id === draft.id); if (!r) return;
    confirmSheet({
      title: 'Silinsin mi?', text: `"${esc(r.title)}" rutinden çıkar ve bekleyen görevleri silinir. Tamamladıkların kalır.`, yes: 'Sil', danger: true,
      onYes: () => { S.todos = S.todos.filter((x) => !(x.rid === r.id && !x.done)); S.routines = S.routines.filter((x) => x.id !== r.id); after(); toast('🍂', 'Rutinden çıkarıldı', r.title); },
    });
  },

  'new-counter': () => openCounterForm(),
  'edit-counter': (el) => openCounterForm(el.dataset.id),
  'cf-save': () => saveCounter(),
  'cf-delete': () => { const id = draft.id; S.counters = S.counters.filter((x) => x.id !== id); closeSheet(); after(); },

  'cal-nav': (el) => { ui.calOff += +el.dataset.v; render(); },
  'cal-today': () => { ui.calOff = 0; ui.calDay = null; render(); },
  'cal-day': (el) => {
    const t = today(), d = parse(el.dataset.k);
    ui.calDay = el.dataset.k; ui.calOff = (d.getFullYear() - t.getFullYear()) * 12 + d.getMonth() - t.getMonth();
    render();
  },
  'new-event': (el) => openEventForm(null, el.dataset.k || null),
  'edit-event': (el) => openEventForm(el.dataset.id),
  'ef-kind': (el) => { draft.kind = el.dataset.v; drawEventForm(); },
  'ef-yearly': (el) => { draft.yearly = el.dataset.v === '1'; drawEventForm(); },
  'ef-save': () => saveEvent(),
  'ef-delete': () => { const id = draft.id, e = S.events.find((x) => x.id === id); S.events = S.events.filter((x) => x.id !== id); closeSheet(); after(); if (e) toast('🍂', 'Takvimden silindi', e.title); },

  'ob-pick': (el) => { const i = +el.dataset.v, at = draft.sel.indexOf(i); if (at >= 0) draft.sel.splice(at, 1); else draft.sel.push(i); drawOnboarding(); },
  'ob-go': () => {
    const picks = [...draft.sel].sort((a, b) => a - b).map((i) => STARTERS[i]);
    const tk = dkey(today());
    picks.forEach((s) => S.habits.push({ id: uid(), name: s.name, emoji: s.emoji, color: s.color, kind: s.kind, freq: { type: s.freq.type, days: [0, 1, 2, 3, 4], times: s.freq.times || 3 }, target: s.target, unit: s.unit, note: '', group: '', createdAt: tk, log: {} }));
    closeSheet(); after();
  },

  'stats-mode': (el) => { ui.statsMode = el.dataset.v; ui.statsOff = 0; ui.pick = null; render(); },
  'stats-nav': (el) => { ui.statsOff = Math.min(0, ui.statsOff + +el.dataset.v); ui.pick = null; render(); },
  pick: (el) => { ui.pick = ui.pick === el.dataset.k ? null : el.dataset.k; render(); },

  theme: (el) => { S.theme = el.dataset.v; save(); applyTheme(); render(); },
  export: () => {
    try {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `plan-yedek-${dkey(today())}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('💾', 'Yedek indirildi');
    } catch (e) { toast('⚠️', 'Yedek alınamadı', 'Tarayıcı indirmeye izin vermedi'); }
  },
  import: () => { const f = $('#importFile'); if (f) f.click(); },
  reset: () => confirmSheet({
    title: 'Her şey silinsin mi?', text: 'Bütün alışkanlıklar, görevler, takvim kayıtları ve geçmiş silinecek; hazır plan baştan yüklenecek. Bu işlem geri alınamaz. Emin değilsen önce yedek al.', yes: 'Sıfırla', danger: true,
    onYes: () => { S = blank(); applyPreset(); syncRoutines(); memo = null; save(); applyTheme(); ui.tab = 'today'; ui.view = 'day'; render(true); openOnboarding(); },
  }),
};

/* ---- görevlerde kaydırma: sola ertele, sağa bugüne al ---- */
const SWIPE_T = 76;
let sw = null, swipedAt = 0;
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const row = e.target.closest && e.target.closest('.swipe');
  if (!row || (row.dataset.l !== '1' && row.dataset.r !== '1')) return;
  sw = { row, el: row.querySelector('.todo'), x: e.clientX, y: e.clientY, dx: 0, on: false, pid: e.pointerId };
});
document.addEventListener('pointermove', (e) => {
  if (!sw || e.pointerId !== sw.pid) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (!sw.on) {
    if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { sw = null; return; }
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    sw.on = true;
    sw.row.classList.add('dragging');
    try { sw.el.setPointerCapture(e.pointerId); } catch (err) { /* yok */ }
  }
  const ok = dx > 0 ? sw.row.dataset.r === '1' : sw.row.dataset.l === '1';
  sw.dx = ok ? dx : dx * 0.15;
  sw.el.style.transform = `translateX(${sw.dx}px)`;
  sw.row.classList.toggle('dir-r', dx > 0);
  sw.row.classList.toggle('dir-l', dx < 0);
  sw.row.classList.toggle('armed', ok && Math.abs(dx) > SWIPE_T);
});
function endSwipe(e, cancel) {
  if (!sw || (e && e.pointerId !== sw.pid)) return;
  const s0 = sw; sw = null;
  if (!s0.on) return;
  swipedAt = Date.now();
  s0.row.classList.remove('dragging');
  if (!cancel && s0.row.classList.contains('armed')) {
    const dir = s0.dx > 0 ? 1 : -1;
    s0.el.style.transform = `translateX(${dir * 110}%)`;
    setTimeout(() => shiftTodo(s0.row.dataset.id, dir), 160);
  } else {
    s0.el.style.transform = '';
    s0.row.classList.remove('dir-r', 'dir-l', 'armed');
  }
}
document.addEventListener('pointerup', (e) => endSwipe(e, false));
document.addEventListener('pointercancel', (e) => endSwipe(e, true));

document.addEventListener('click', (e) => {
  if (Date.now() - swipedAt < 350) return;
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
    if (!$('#sheetHost').hidden) closeSheet();
    return;
  }
  if (e.key === 'Enter' && draft && e.target.matches && e.target.matches('#hfName, #hfUnit')) { e.preventDefault(); saveHabit(); }
  else if (e.key === 'Enter' && draft && e.target.id === 'tfTitle') { e.preventDefault(); saveTodo(); }
  else if (e.key === 'Enter' && draft && e.target.id === 'rfTitle') { e.preventDefault(); saveRoutine(); }
  else if (e.key === 'Enter' && draft && e.target.id === 'cfTitle') { e.preventDefault(); saveCounter(); }
  else if (e.key === 'Enter' && draft && e.target.id === 'efTitle') { e.preventDefault(); saveEvent(); }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'cycleDate') {
    const v = e.target.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { e.target.value = S.cycleStart; return; }
    S.cycleStart = v;
    rebuildAllRoutines(); syncRoutines(); ui.planWeek = null;
    after();
    toast('🔁', 'Rutinin ilk günü değişti', `${fmtLong(parse(v))} gününden başlıyor`);
    return;
  }
  if (e.target.id === 'setName') {
    S.name = e.target.value.trim().slice(0, 24) || 'Ceyda';
    save(); e.target.value = S.name;
  } else if (e.target.id === 'importFile') {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      let obj = null;
      try { obj = JSON.parse(rd.result); } catch (err) { obj = null; }
      if (!obj || !Array.isArray(obj.habits) || !Array.isArray(obj.todos)) { toast('⚠️', 'Bu dosya okunamadı', 'Uygulamadan indirilen yedek .json dosyasını seç'); return; }
      confirmSheet({
        title: 'Yedek yüklensin mi?', text: `Yedekte ${obj.habits.length} alışkanlık, ${obj.todos.length} görev ve ${(obj.events || []).length} takvim kaydı var. Şu anki verilerin yerine bunlar gelecek.`, yes: 'Yükle',
        onYes: () => { S = normalize(obj); S.onboarded = true; applyPreset(); syncRoutines(); memo = null; save(); applyTheme(); render(true); toast('🌿', 'Yedek yüklendi'); },
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
  if (k !== lastDay) { lastDay = k; ui.day = today(); memo = null; if (syncRoutines()) save(); render(); }
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
const presetChanged = applyPreset();
if (syncRoutines() || presetChanged) save();
render();
if (!S.onboarded) openOnboarding();

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* çevrimdışı destek isteğe bağlı */ }); });
}

})();

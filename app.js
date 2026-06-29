/* ===========================================================
   学 Mandarin — daily Chinese flashcards (SM-2 SRS)
   Pure client-side. State lives in localStorage.
   =========================================================== */

const STORE_KEY = "mandarin-app-v1";
const MS_DAY = 86400000;
const TARGETS = { vocab: 1200, writing: 300, tones: 4, grammar: 40 };

/* ---------- persistent state ---------- */
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

const state = loadState();
state.cards = state.cards || {};       // hanzi -> { interval, easeFactor, dueDate, reviewCount, firstLearned }
state.sessions = state.sessions || {}; // "YYYY-MM-DD" -> review count
state.reviews = state.reviews || [];   // [{ date:"YYYY-MM-DD", correct:bool }]

/* ---------- date helpers ---------- */
const isoDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const todayKey = () => isoDay(new Date());

/* ---------- vocabulary ---------- */
let deck = [];      // all loaded words
let current = null; // word object on screen

async function loadDeck() {
  const files = ["data/hsk1.json", "data/hsk2.json", "data/hsk3.json"];
  const parts = await Promise.all(files.map((f) => fetch(f).then((r) => r.json())));
  deck = parts.flat();
}

/* ---------- SM-2 scheduling ---------- */
// Grades anchor to the spec's button table for the first graduating review,
// then grow by the SM-2 ease factor on subsequent successful reviews.
function schedule(word, grade) {
  const c = state.cards[word.hanzi] || {
    interval: 0,
    easeFactor: 2.5,
    reviewCount: 0,
    firstLearned: null,
  };

  let ef = c.easeFactor;
  const prev = c.interval; // days
  let intervalDays;

  switch (grade) {
    case "again":
      ef = Math.max(1.3, ef - 0.2);
      intervalDays = 10 / (60 * 24); // 10 minutes
      break;
    case "hard":
      ef = Math.max(1.3, ef - 0.15);
      intervalDays = prev >= 1 ? prev * 1.2 : 1;
      break;
    case "good":
      intervalDays = prev >= 1 ? prev * ef : 4;
      break;
    case "easy":
      ef = ef + 0.15;
      intervalDays = prev >= 1 ? prev * ef * 1.3 : 7;
      break;
  }

  c.easeFactor = Math.round(ef * 100) / 100;
  c.interval = Math.round(intervalDays * 100) / 100;
  c.dueDate = new Date(Date.now() + intervalDays * MS_DAY).toISOString();
  c.reviewCount += 1;
  if (c.firstLearned === null && grade !== "again") c.firstLearned = todayKey();

  state.cards[word.hanzi] = c;
  logReview(grade !== "again");
  saveState();
}

function logReview(correct) {
  const day = todayKey();
  state.sessions[day] = (state.sessions[day] || 0) + 1;
  state.reviews.push({ date: day, correct });
  if (state.reviews.length > 2000) state.reviews = state.reviews.slice(-2000);
}

/* ---------- card selection ---------- */
// Prefer the most-overdue card; otherwise the least-reviewed new card.
function pickNext() {
  const now = Date.now();
  let due = null;
  let dueBy = -Infinity;
  let fresh = null;
  let freshCount = Infinity;

  for (const word of deck) {
    const c = state.cards[word.hanzi];
    if (c) {
      const overdue = now - new Date(c.dueDate).getTime();
      if (overdue >= 0 && overdue > dueBy) {
        dueBy = overdue;
        due = word;
      }
    } else if (freshCount > 0) {
      fresh = word;
      freshCount = 0;
    }
  }
  return due || fresh || deck[Math.floor(Math.random() * deck.length)];
}

/* ---------- rendering ---------- */
const $ = (id) => document.getElementById(id);

function renderCard(word) {
  current = word;
  const c = state.cards[word.hanzi];
  $("card-hanzi").textContent = word.hanzi;
  $("card-pinyin").textContent = word.pinyin;
  $("card-meaning").textContent = word.meaning;
  $("ex-pinyin").textContent = word.example.pinyin;
  $("ex-hanzi").textContent = word.example.hanzi;
  $("ex-translation").textContent = word.example.translation;
  $("badge-hsk").textContent = "HSK " + word.hsk;
  $("badge-reviews").textContent = (c ? c.reviewCount : 0) + " reviews";
}

function renderStats() {
  const cards = Object.values(state.cards);
  const learned = cards.filter((c) => c.firstLearned).length;
  const learnedToday = cards.filter((c) => c.firstLearned === todayKey()).length;

  const now = Date.now();
  const due = Object.entries(state.cards).filter(
    ([, c]) => new Date(c.dueDate).getTime() <= now
  ).length;

  // accuracy over last 7 days
  const cutoff = Date.now() - 7 * MS_DAY;
  const recent = state.reviews.filter((r) => new Date(r.date).getTime() >= cutoff);
  const acc = recent.length
    ? Math.round((recent.filter((r) => r.correct).length / recent.length) * 100)
    : null;

  $("stat-learned").textContent = learned;
  $("stat-learned-today").textContent = "+" + learnedToday + " today";
  $("stat-due").textContent = due;
  $("stat-accuracy").textContent = acc === null ? "—" : acc + "%";

  renderModules(learned, cards);
  renderStreak();
}

function renderModules(learned, cards) {
  // distinct characters seen across learned words
  const chars = new Set();
  for (const [hanzi, c] of Object.entries(state.cards)) {
    if (c.firstLearned) for (const ch of hanzi) chars.add(ch);
  }
  const setBar = (key, value, target, label) => {
    const pct = Math.min(100, (value / target) * 100);
    $("mod-" + key + "-bar").style.width = pct + "%";
    $("mod-" + key + "-count").textContent = value + " / " + label;
  };
  setBar("vocab", learned, TARGETS.vocab, TARGETS.vocab);
  setBar("writing", chars.size, TARGETS.writing, TARGETS.writing);
  // Tones & Grammar have no dataset yet — bars track real progress once content is added.
  setBar("tones", 0, TARGETS.tones, TARGETS.tones + " levels");
  setBar("grammar", 0, TARGETS.grammar, TARGETS.grammar + " lessons");
}

function renderStreak() {
  let streak = 0;
  const d = new Date();
  // Allow today to be unfinished: start counting from today if logged, else yesterday.
  if (!state.sessions[isoDay(d)]) d.setDate(d.getDate() - 1);
  while (state.sessions[isoDay(d)]) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  $("streak-count").textContent = streak;
  $("streak").classList.toggle("active", streak > 0);
}

/* ---------- heatmap ---------- */
function intensity(count) {
  if (!count) return 0;
  if (count >= 12) return 4;
  if (count >= 7) return 3;
  if (count >= 3) return 2;
  return 1;
}

function renderHeatmap() {
  const el = $("heatmap");
  el.innerHTML = "";
  const tooltip = $("tooltip");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start one year back, then walk back to the preceding Monday.
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  const dow = (start.getDay() + 6) % 7; // 0 = Mon
  start.setDate(start.getDate() - dow);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let total = 0;
  let lastMonth = -1;
  const cursor = new Date(start);

  while (cursor <= today) {
    // row 1: month label for this week column
    const label = document.createElement("div");
    label.className = "hm-month";
    if (cursor.getMonth() !== lastMonth) {
      label.textContent = months[cursor.getMonth()];
      lastMonth = cursor.getMonth();
    }
    el.appendChild(label);

    // rows 2-8: Mon..Sun
    for (let r = 0; r < 7; r++) {
      const cell = document.createElement("div");
      if (cursor > today) {
        cell.style.visibility = "hidden";
        el.appendChild(cell);
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
      const key = isoDay(cursor);
      const count = state.sessions[key] || 0;
      total += count;
      cell.className = "hm-cell level-" + intensity(count);
      cell.dataset.label = `${key}: ${count} session${count === 1 ? "" : "s"}`;
      cell.addEventListener("mousemove", (e) => {
        tooltip.textContent = cell.dataset.label;
        tooltip.style.left = e.clientX + 12 + "px";
        tooltip.style.top = e.clientY + 12 + "px";
        tooltip.classList.add("show");
      });
      cell.addEventListener("mouseleave", () => tooltip.classList.remove("show"));
      el.appendChild(cell);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  $("heatmap-total").textContent =
    total + " session" + (total === 1 ? "" : "s") + " in the last year";
}

/* ---------- speech ---------- */
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.8;
  speechSynthesis.speak(u);
}

/* ---------- wiring ---------- */
function next() {
  renderCard(pickNext());
  renderStats();
  renderHeatmap();
}

function init() {
  $("listen-btn").addEventListener("click", () => current && speak(current.hanzi));
  document.querySelectorAll(".srs-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!current) return;
      schedule(current, btn.dataset.grade);
      next();
    })
  );

  loadDeck()
    .then(() => next())
    .catch(() => {
      $("card-hanzi").textContent = "⚠️";
      $("card-meaning").textContent =
        "Could not load vocabulary. Serve the folder over http (see README).";
    });
}

init();

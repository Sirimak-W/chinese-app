/* ===========================================================
   学 Mandarin — daily Chinese flashcards
   Fixed-day spaced repetition (Day 1 / 3 / 7 / 14 / 30), two-way
   active recall, and sentence production. Pure client-side.
   State lives in localStorage.
   =========================================================== */

const STORE_KEY = "mandarin-app-v1";
const MS_DAY = 86400000;
const STEPS = [1, 3, 7, 14, 30]; // days between reviews, per the spaced-repetition concept

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
state.cards = state.cards || {};       // hanzi -> { stepIndex, reviewCount, firstLearned, dueDate, mySentences }
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
let revealed = false;

async function loadDeck() {
  const files = ["data/hsk1.json", "data/hsk2.json", "data/hsk3.json"];
  const parts = await Promise.all(files.map((f) => fetch(f).then((r) => r.json())));
  deck = parts.flat();
}

/* ---------- card record ---------- */
// Cards from the old SM-2 version only had `interval` (days); map that onto
// the nearest fixed step so existing progress isn't lost.
function migrateStepIndex(interval) {
  if (!interval || interval < 1) return -1;
  let idx = 0;
  for (let i = 0; i < STEPS.length; i++) if (interval >= STEPS[i]) idx = i;
  return idx;
}

function getCard(hanzi) {
  const c = state.cards[hanzi];
  if (!c) return null;
  if (c.stepIndex === undefined) c.stepIndex = migrateStepIndex(c.interval);
  if (!c.mySentences) c.mySentences = [];
  return c;
}

/* ---------- fixed-day scheduling ---------- */
function schedule(word, grade) {
  const c = getCard(word.hanzi) || { stepIndex: -1, reviewCount: 0, firstLearned: null, mySentences: [] };

  let days;
  switch (grade) {
    case "again":
      c.stepIndex = -1;
      days = 10 / (60 * 24); // 10 minutes — relearn today
      break;
    case "hard":
      c.stepIndex = Math.max(0, c.stepIndex);
      days = STEPS[c.stepIndex];
      break;
    case "good":
      c.stepIndex = Math.min(STEPS.length - 1, c.stepIndex + 1);
      days = STEPS[c.stepIndex];
      break;
    case "easy":
      c.stepIndex = Math.min(STEPS.length - 1, c.stepIndex + 2);
      days = STEPS[c.stepIndex];
      break;
  }

  c.dueDate = new Date(Date.now() + days * MS_DAY).toISOString();
  c.reviewCount += 1;
  if (c.firstLearned === null && grade !== "again") c.firstLearned = todayKey();

  state.cards[word.hanzi] = c;
  logReview(grade !== "again");
  saveState();
}

function stepDays(stepIndex, grade) {
  switch (grade) {
    case "again":
      return null; // shown as "10 min", not a day count
    case "hard":
      return STEPS[Math.max(0, stepIndex)];
    case "good":
      return STEPS[Math.min(STEPS.length - 1, stepIndex + 1)];
    case "easy":
      return STEPS[Math.min(STEPS.length - 1, stepIndex + 2)];
  }
}

function fmtDays(d) {
  return d === 1 ? "1 day" : d + " days";
}

function updateSrsLabels(c) {
  const stepIndex = c ? c.stepIndex : -1;
  $("again-sub").textContent = "10 min";
  $("hard-sub").textContent = fmtDays(stepDays(stepIndex, "hard"));
  $("good-sub").textContent = fmtDays(stepDays(stepIndex, "good"));
  $("easy-sub").textContent = fmtDays(stepDays(stepIndex, "easy"));
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

// Active recall: half the time show the Hanzi and ask for the meaning
// ("recognize"), half the time show the English and ask for the Hanzi
// ("recall") — testing both directions instead of showing everything at once.
function renderCard(word) {
  current = word;
  revealed = false;
  current.direction = Math.random() < 0.5 ? "recognize" : "recall";
  const c = getCard(word.hanzi);

  $("badge-hsk").textContent = "HSK " + word.hsk;
  $("badge-reviews").textContent = (c ? c.reviewCount : 0) + " reviews";
  $("badge-mode").textContent = current.direction === "recognize" ? "Hanzi → Meaning" : "Meaning → Hanzi";

  if (current.direction === "recognize") {
    $("card-hanzi").textContent = word.hanzi;
    $("card-pinyin").textContent = word.pinyin;
    $("card-meaning").textContent = "?";
  } else {
    $("card-hanzi").textContent = "？";
    $("card-pinyin").textContent = "";
    $("card-meaning").textContent = word.meaning;
  }

  $("reveal-btn").hidden = false;
  $("answer-block").hidden = true;
  $("srs").hidden = true;
}

function reveal() {
  if (!current || revealed) return;
  revealed = true;

  $("card-hanzi").textContent = current.hanzi;
  $("card-pinyin").textContent = current.pinyin;
  $("card-meaning").textContent = current.meaning;

  renderExamples(current);
  renderCompounds(current);
  renderMySentences(current);

  $("reveal-btn").hidden = true;
  $("answer-block").hidden = false;
  $("srs").hidden = false;
  updateSrsLabels(getCard(current.hanzi));
}

function renderExamples(word) {
  const container = $("examples");
  container.innerHTML = "";
  word.examples.forEach((ex) => {
    const div = document.createElement("div");
    div.className = "example";
    div.innerHTML = `
      <div class="ex-pinyin">${ex.pinyin}</div>
      <div class="ex-hanzi">${ex.hanzi}</div>
      <div class="ex-translation">${ex.translation}</div>
      <button class="ex-listen-btn" title="Listen">🔊</button>
    `;
    div.querySelector(".ex-listen-btn").addEventListener("click", () => speak(ex.hanzi));
    container.appendChild(div);
  });
}

function renderCompounds(word) {
  const container = $("compounds");
  container.innerHTML = "";
  if (!word.compounds || !word.compounds.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  word.compounds.forEach((cp) => {
    const chip = document.createElement("button");
    chip.className = "compound-chip";
    chip.title = "Listen";
    chip.innerHTML = `
      <span class="cp-hanzi">${cp.hanzi}</span>
      <span class="cp-pinyin">${cp.pinyin}</span>
      <span class="cp-meaning">${cp.meaning}</span>
    `;
    chip.addEventListener("click", () => speak(cp.hanzi));
    container.appendChild(chip);
  });
}

function renderMySentences(word) {
  const c = getCard(word.hanzi);
  const list = $("my-sentences-list");
  list.innerHTML = "";
  (c ? c.mySentences : []).forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s.text;
    list.appendChild(li);
  });
}

function saveMySentence() {
  const input = $("my-sentence-input");
  const text = input.value.trim();
  if (!text || !current) return;
  const c = getCard(current.hanzi) || { stepIndex: -1, reviewCount: 0, firstLearned: null, mySentences: [] };
  c.mySentences.push({ text, date: todayKey() });
  state.cards[current.hanzi] = c;
  saveState();
  input.value = "";
  renderMySentences(current);
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

  renderStreak();
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
// Chrome loads its voice list asynchronously, so the very first speak() call
// (usually the main word's Listen button, right after page load) can pick a
// different, worse voice than later calls made once voices have loaded
// (usually the example sentences). Cache one good zh-CN voice up front and
// reuse it everywhere so the main word always sounds like the sentences.
let zhVoice = null;
function pickZhVoice() {
  const voices = speechSynthesis.getVoices();
  const zh = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("zh"));
  zhVoice = zh.find((v) => /google/i.test(v.name)) || zh[0] || null;
}
if ("speechSynthesis" in window) {
  pickZhVoice();
  speechSynthesis.onvoiceschanged = pickZhVoice;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.8;
  if (zhVoice) u.voice = zhVoice;
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
  $("reveal-btn").addEventListener("click", reveal);
  $("save-sentence-btn").addEventListener("click", saveMySentence);
  document.querySelectorAll(".srs-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!current || !revealed) return;
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

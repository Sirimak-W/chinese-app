/* ===========================================================
   学 Mandarin — handwriting practice (rule-based mock)
   Companion to handwriting-mock-concept.md. Zero dependencies,
   no persistence — session XP is in-memory only.
   =========================================================== */

/* ---------- stroke data (0–100 normalized grid, y-down) ----------
   Polylines are hand-authored and densified before render/validation.
   Directly swappable with Hanzi Writer medians (only the scale changes).
   Chars chosen to cover the basic stroke types: héng, shù, piě, nà, héng-zhé. */
const CHARS = [
  {
    char: "一", pinyin: "yī", meaning: "one", hsk: 1, word: "一天 (yìtiān) — one day",
    strokes: [
      { name: "héng (horizontal)", pts: [[15, 51], [50, 50], [85, 49]] },
    ],
  },
  {
    char: "二", pinyin: "èr", meaning: "two", hsk: 1, word: "二月 (èryuè) — February",
    strokes: [
      { name: "héng (top)", pts: [[26, 36], [50, 36], [72, 35]] },
      { name: "héng (bottom)", pts: [[16, 66], [50, 66], [84, 65]] },
    ],
  },
  {
    char: "三", pinyin: "sān", meaning: "three", hsk: 1, word: "三个 (sān gè) — three (of)",
    strokes: [
      { name: "héng (top)", pts: [[26, 28], [70, 27]] },
      { name: "héng (middle)", pts: [[30, 50], [66, 50]] },
      { name: "héng (bottom)", pts: [[16, 73], [84, 72]] },
    ],
  },
  {
    char: "四", pinyin: "sì", meaning: "four", hsk: 1, word: "四十 (sìshí) — forty",
    strokes: [
      { name: "shù (left vertical)", pts: [[26, 28], [26, 74]] },
      { name: "héng-zhé (top + right)", pts: [[26, 28], [74, 28], [74, 74]] },
      { name: "piě (inner left)", pts: [[41, 37], [37, 60]] },
      { name: "shù-wān (inner right)", pts: [[58, 37], [58, 58], [67, 64]] },
      { name: "héng (bottom)", pts: [[26, 74], [74, 74]] },
    ],
  },
  {
    char: "五", pinyin: "wǔ", meaning: "five", hsk: 1, word: "五月 (wǔyuè) — May",
    strokes: [
      { name: "héng (top)", pts: [[24, 27], [76, 27]] },
      { name: "shù (slanted)", pts: [[46, 27], [34, 76]] },
      { name: "héng-zhé (middle)", pts: [[34, 50], [66, 50], [62, 76]] },
      { name: "héng (bottom)", pts: [[20, 77], [80, 77]] },
    ],
  },
  {
    char: "六", pinyin: "liù", meaning: "six", hsk: 1, word: "六月 (liùyuè) — June",
    strokes: [
      { name: "diǎn (top dot)", pts: [[50, 15], [50, 25]] },
      { name: "héng", pts: [[22, 40], [78, 39]] },
      { name: "piě (left)", pts: [[40, 52], [26, 80]] },
      { name: "diǎn (right)", pts: [[62, 52], [76, 80]] },
    ],
  },
  {
    char: "七", pinyin: "qī", meaning: "seven", hsk: 1, word: "七月 (qīyuè) — July",
    strokes: [
      { name: "héng (rising)", pts: [[24, 44], [74, 38]] },
      { name: "shù-wān-gōu", pts: [[50, 22], [49, 58], [70, 66], [72, 56]] },
    ],
  },
  {
    char: "八", pinyin: "bā", meaning: "eight", hsk: 1, word: "八月 (bāyuè) — August",
    strokes: [
      { name: "piě (left falling)", pts: [[46, 26], [30, 74]] },
      { name: "nà (right falling)", pts: [[52, 26], [72, 74]] },
    ],
  },
  {
    char: "九", pinyin: "jiǔ", meaning: "nine", hsk: 1, word: "九月 (jiǔyuè) — September",
    strokes: [
      { name: "piě (left falling)", pts: [[38, 24], [26, 62]] },
      { name: "héng-zhé-wān-gōu", pts: [[30, 32], [70, 30], [68, 64], [79, 67], [81, 57]] },
    ],
  },
  {
    char: "十", pinyin: "shí", meaning: "ten", hsk: 1, word: "十月 (shíyuè) — October",
    strokes: [
      { name: "héng (horizontal)", pts: [[15, 50], [50, 50], [85, 50]] },
      { name: "shù (vertical)", pts: [[50, 13], [50, 50], [50, 87]] },
    ],
  },
  {
    char: "人", pinyin: "rén", meaning: "person", hsk: 1, word: "人们 (rénmen) — people",
    strokes: [
      { name: "piě (left falling)", pts: [[52, 14], [46, 36], [36, 60], [20, 84]] },
      { name: "nà (right falling)", pts: [[49, 34], [59, 54], [70, 68], [84, 84]] },
    ],
  },
  {
    char: "大", pinyin: "dà", meaning: "big", hsk: 1, word: "大家 (dàjiā) — everyone",
    strokes: [
      { name: "héng (horizontal)", pts: [[18, 40], [50, 40], [82, 40]] },
      { name: "piě (left falling)", pts: [[50, 16], [43, 42], [32, 64], [16, 86]] },
      { name: "nà (right falling)", pts: [[47, 42], [59, 58], [71, 73], [84, 88]] },
    ],
  },
  {
    char: "口", pinyin: "kǒu", meaning: "mouth", hsk: 1, word: "口水 (kǒushuǐ) — saliva",
    strokes: [
      { name: "shù (left vertical)", pts: [[25, 24], [25, 82]] },
      { name: "héng-zhé (turn)", pts: [[25, 24], [79, 24], [79, 82]] },
      { name: "héng (bottom)", pts: [[25, 82], [79, 82]] },
    ],
  },
  {
    char: "上", pinyin: "shàng", meaning: "up, above", hsk: 1, word: "上午 (shàngwǔ) — morning",
    strokes: [
      { name: "shù (vertical)", pts: [[42, 24], [42, 74]] },
      { name: "héng (upper short)", pts: [[42, 44], [68, 44]] },
      { name: "héng (bottom long)", pts: [[20, 74], [80, 73]] },
    ],
  },
  {
    char: "下", pinyin: "xià", meaning: "down, below", hsk: 1, word: "下午 (xiàwǔ) — afternoon",
    strokes: [
      { name: "héng (top long)", pts: [[18, 32], [82, 31]] },
      { name: "shù (vertical)", pts: [[46, 31], [46, 80]] },
      { name: "diǎn (dot)", pts: [[58, 46], [66, 58]] },
    ],
  },
  {
    char: "中", pinyin: "zhōng", meaning: "middle, center", hsk: 1, word: "中国 (Zhōngguó) — China",
    strokes: [
      { name: "shù (left of box)", pts: [[34, 30], [34, 66]] },
      { name: "héng-zhé (top + right)", pts: [[34, 30], [66, 30], [66, 66]] },
      { name: "héng (bottom)", pts: [[34, 66], [66, 66]] },
      { name: "shù (through center)", pts: [[50, 16], [50, 84]] },
    ],
  },
  {
    char: "小", pinyin: "xiǎo", meaning: "small", hsk: 1, word: "小时 (xiǎoshí) — hour",
    strokes: [
      { name: "shù-gōu (center)", pts: [[50, 24], [50, 72], [44, 78]] },
      { name: "piě (left dot)", pts: [[38, 34], [30, 58]] },
      { name: "diǎn (right dot)", pts: [[62, 34], [70, 58]] },
    ],
  },
  {
    char: "不", pinyin: "bù", meaning: "not, no", hsk: 1, word: "不是 (búshì) — is not",
    strokes: [
      { name: "héng (top)", pts: [[20, 32], [80, 31]] },
      { name: "piě (left falling)", pts: [[50, 31], [30, 70]] },
      { name: "shù (vertical)", pts: [[50, 31], [50, 80]] },
      { name: "diǎn (dot)", pts: [[52, 50], [68, 66]] },
    ],
  },
  {
    char: "天", pinyin: "tiān", meaning: "sky, day", hsk: 1, word: "天气 (tiānqì) — weather",
    strokes: [
      { name: "héng (top short)", pts: [[26, 30], [74, 29]] },
      { name: "héng (longer)", pts: [[18, 48], [82, 47]] },
      { name: "piě (left falling)", pts: [[50, 47], [30, 84]] },
      { name: "nà (right falling)", pts: [[50, 47], [74, 84]] },
    ],
  },
  {
    char: "女", pinyin: "nǚ", meaning: "woman, female", hsk: 1, word: "女儿 (nǚ'ér) — daughter",
    strokes: [
      { name: "piě-diǎn", pts: [[36, 24], [28, 44], [52, 58]] },
      { name: "piě (left falling)", pts: [[62, 26], [26, 74]] },
      { name: "héng (crossing)", pts: [[22, 56], [80, 55]] },
    ],
  },
];

const SIZE = 800;              // internal canvas px
const SCALE = SIZE / 100;      // normalized → px
const TOL = 11;                // position tolerance, normalized (11% of canvas)

/* ---------- geometry helpers (all in normalized units) ---------- */
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function pathLen(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += dist(pts[i - 1], pts[i]);
  return d;
}

// Interpolate a polyline into ~evenly spaced points so sparse authored
// data behaves like dense median data (~1.5 normalized-unit steps ≈ 12px).
function densify(pts, step = 1.5) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const segLen = dist(a, b);
    const n = Math.max(1, Math.round(segLen / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

function angleOf(from, to) {
  return Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;
}
function angleDiff(a, b) {
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/* ---------- state ---------- */
const $ = (id) => document.getElementById(id);
const canvas = $("hw-canvas");
const ctx = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let charIdx = 0;
let strokeIdx = 0;          // current stroke to practice (= completed count)
let phase = "watch";        // watch | practice | done
let attempts = [];          // per stroke
let scores = [];            // per stroke 0–100
let userPts = [];           // live pointer trail, normalized
let drawing = false;
let xp = 0;

let hintProgress = 0;       // 0→1 during watch animation
let hintAnimating = false;
let hintStart = 0;

let densStrokes = [];       // densified expected strokes for current char

/* ---------- lifecycle ---------- */
function loadChar(idx) {
  charIdx = idx;
  const c = CHARS[idx];
  strokeIdx = 0;
  attempts = c.strokes.map(() => 0);
  scores = c.strokes.map(() => 0);
  densStrokes = c.strokes.map((s) => densify(s.pts));
  userPts = [];
  phase = "watch";

  $("hw-pinyin").textContent = c.pinyin;
  $("hw-hsk").textContent = "HSK " + c.hsk;
  $("hw-meaning").textContent = c.meaning;
  $("hw-word").textContent = c.word;
  $("hw-summary").hidden = true;
  document.querySelectorAll(".hw-chip").forEach((el, i) => el.classList.toggle("active", i === idx));

  setFeedback("Press Watch to see stroke " + (strokeIdx + 1) + ".", "info");
  render();
}

function startWatch() {
  if (phase === "done") return;
  phase = "watch";
  userPts = [];
  if (reducedMotion) {
    hintProgress = 1;
    beginPractice();
    return;
  }
  hintProgress = 0;
  hintAnimating = true;
  hintStart = performance.now();
  requestAnimationFrame(animateHint);
}

function animateHint(now) {
  const dur = $("hw-slow").checked ? 2600 : 1100;
  hintProgress = Math.min(1, (now - hintStart) / dur);
  render();
  if (hintProgress < 1) {
    requestAnimationFrame(animateHint);
  } else {
    hintAnimating = false;
    beginPractice();
  }
}

function beginPractice() {
  phase = "practice";
  const name = CHARS[charIdx].strokes[strokeIdx].name;
  setFeedback("Now trace stroke " + (strokeIdx + 1) + ": " + name, "info");
  render();
}

/* ---------- validation (runs on pointerup) ---------- */
function validate() {
  const expected = densStrokes[strokeIdx];
  const user = userPts;
  if (user.length < 2) {
    return { pass: false, msg: "Draw the full stroke in one motion." };
  }

  const eStart = expected[0], eEnd = expected[expected.length - 1];
  const uStart = user[0], uEnd = user[user.length - 1];
  const dStart = dist(uStart, eStart);
  const dEnd = dist(uEnd, eEnd);
  const ratio = pathLen(user) / pathLen(expected);
  const dAng = angleDiff(angleOf(uStart, uEnd), angleOf(eStart, eEnd));

  // Ordered so the most actionable error surfaces first.
  if (dAng > 90 && dStart > TOL && dEnd > TOL) {
    return { pass: false, msg: "Wrong direction — follow the animated guide." };
  }
  if (dStart > TOL) {
    return { pass: false, msg: "Started too " + offsetWord(uStart, eStart) + " — begin at the red dot." };
  }
  if (ratio < 0.6) {
    return { pass: false, msg: "Too short — extend the stroke." };
  }
  if (ratio > 1.7) {
    return { pass: false, msg: "Too long — lift the pen earlier." };
  }
  if (dEnd > 1.2 * TOL) {
    return { pass: false, msg: "The ending drifted " + offsetWord(uEnd, eEnd) + " — aim for the endpoint." };
  }
  if (dAng > 50) {
    return { pass: false, msg: "Keep the stroke's overall angle." };
  }

  // pass — precision from endpoint accuracy vs. tolerance
  const precision = Math.max(0, Math.min(1, 1 - dEnd / TOL));
  return { pass: true, precision };
}

function offsetWord(u, e) {
  const dx = u[0] - e[0], dy = u[1] - e[1];
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? "high" : "low";
  return dx < 0 ? "far left" : "far right";
}

/* ---------- grading a completed pointer trail ---------- */
function onStrokeComplete() {
  attempts[strokeIdx] += 1;
  const res = validate();

  if (!res.pass) {
    setFeedback(res.msg, "bad");
    userPts = [];
    render();
    return;
  }

  const firstTry = attempts[strokeIdx] === 1;
  const score = Math.max(
    55,
    Math.round(100 - (attempts[strokeIdx] - 1) * 12 - (1 - res.precision) * 15)
  );
  scores[strokeIdx] = score;

  const gained = firstTry ? 10 : 5;
  addXp(gained);
  setFeedback(tierMsg(score) + "  +" + gained + " XP", "good");

  strokeIdx += 1;
  userPts = [];

  if (strokeIdx >= CHARS[charIdx].strokes.length) {
    finishChar();
  } else {
    // brief beat, then auto-play the next stroke's guide
    render();
    setTimeout(startWatch, 650);
  }
}

function tierMsg(score) {
  if (score >= 90) return "Excellent stroke!";
  if (score >= 75) return "Good — clean shape.";
  return "Accepted, keep practicing.";
}

function finishChar() {
  phase = "done";
  addXp(15);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  $("hw-verdict").textContent =
    "Average " + avg + "/100 · +15 completion bonus";
  $("hw-srs").textContent =
    "Mock review: " + (avg >= 90 ? "in 3 days" : avg >= 75 ? "tomorrow" : "today");

  const list = $("hw-stroke-scores");
  list.innerHTML = "";
  CHARS[charIdx].strokes.forEach((s, i) => {
    const li = document.createElement("li");
    li.innerHTML =
      "<span>Stroke " + (i + 1) + " · " + s.name + "</span>" +
      '<span class="sc">' + scores[i] + " (" + attempts[i] + " tr" + (attempts[i] === 1 ? "y" : "ies") + ")</span>";
    list.appendChild(li);
  });

  setFeedback("Character complete!", "good");
  $("hw-summary").hidden = false;
  render();
}

/* ---------- XP ---------- */
function addXp(n) {
  xp += n;
  $("hw-xp").textContent = xp;
  if (reducedMotion) return;
  const pop = document.createElement("div");
  pop.className = "hw-xp-pop";
  pop.textContent = "+" + n;
  const r = $("hw-xp").getBoundingClientRect();
  pop.style.left = r.left + "px";
  pop.style.top = r.top + "px";
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

/* ---------- rendering (back → front) ---------- */
function render() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  drawGrid();
  drawGhost();
  for (let i = 0; i < strokeIdx; i++) drawStroke(densStrokes[i], "#161a1f", true);

  if (phase === "watch" && strokeIdx < densStrokes.length) {
    drawPartial(densStrokes[strokeIdx], hintProgress, "#d94f2b");
  }
  if (phase === "practice") {
    drawStartDot(densStrokes[strokeIdx][0]);
  }
  if (userPts.length) drawStroke(userPts, "#161a1f", false);
}

function drawGrid() {
  ctx.fillStyle = "#fdfcf8";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const m = 40; // inset margin
  // dashed cross + diagonals
  ctx.save();
  ctx.strokeStyle = "rgba(217,79,43,0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(SIZE / 2, m); ctx.lineTo(SIZE / 2, SIZE - m);
  ctx.moveTo(m, SIZE / 2); ctx.lineTo(SIZE - m, SIZE / 2);
  ctx.moveTo(m, m); ctx.lineTo(SIZE - m, SIZE - m);
  ctx.moveTo(SIZE - m, m); ctx.lineTo(m, SIZE - m);
  ctx.stroke();
  ctx.restore();
  // solid cinnabar border
  ctx.strokeStyle = "#d94f2b";
  ctx.lineWidth = 3;
  ctx.strokeRect(m, m, SIZE - 2 * m, SIZE - 2 * m);
}

function drawGhost() {
  ctx.globalAlpha = 0.08;
  for (const s of densStrokes) drawStroke(s, "#161a1f", false, 14);
  ctx.globalAlpha = 1;
}

// Solid ink stroke with a subtle brush taper (1.15× → 0.65× along path).
function drawStroke(pts, color, taper, fixedWidth) {
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const base = fixedWidth || 16;
  for (let i = 1; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    ctx.lineWidth = taper ? base * (1.15 - 0.5 * t) : base;
    ctx.beginPath();
    ctx.moveTo(pts[i - 1][0] * SCALE, pts[i - 1][1] * SCALE);
    ctx.lineTo(pts[i][0] * SCALE, pts[i][1] * SCALE);
    ctx.stroke();
  }
}

function drawPartial(pts, progress, color) {
  const n = Math.max(2, Math.ceil(pts.length * progress));
  drawStroke(pts.slice(0, n), color, false, 15);
}

function drawStartDot(p) {
  ctx.fillStyle = "#d94f2b";
  ctx.beginPath();
  ctx.arc(p[0] * SCALE, p[1] * SCALE, 14, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- pointer input (mouse / finger / Pencil) ---------- */
function toNorm(e) {
  const r = canvas.getBoundingClientRect();
  return [
    ((e.clientX - r.left) / r.width) * 100,
    ((e.clientY - r.top) / r.height) * 100,
  ];
}

canvas.addEventListener("pointerdown", (e) => {
  if (phase !== "practice") return;
  drawing = true;
  canvas.setPointerCapture(e.pointerId);
  userPts = [toNorm(e)];
  render();
});
canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  userPts.push(toNorm(e));
  render();
});
function endStroke() {
  if (!drawing) return;
  drawing = false;
  onStrokeComplete();
}
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);

/* ---------- speech (matches the flashcard app) ---------- */
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

function setFeedback(msg, kind) {
  const el = $("hw-feedback");
  el.textContent = msg;
  el.className = "hw-feedback " + (kind || "info");
}

/* ---------- wiring ---------- */
function init() {
  const picker = $("hw-picker");
  CHARS.forEach((c, i) => {
    const chip = document.createElement("button");
    chip.className = "hw-chip";
    chip.textContent = c.char;
    chip.addEventListener("click", () => loadChar(i));
    picker.appendChild(chip);
  });

  $("hw-watch").addEventListener("click", startWatch);
  $("hw-listen").addEventListener("click", () => speak(CHARS[charIdx].char));
  $("hw-next").addEventListener("click", () => loadChar((charIdx + 1) % CHARS.length));

  loadChar(0);
}

init();

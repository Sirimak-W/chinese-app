# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

学 Mandarin — a static, no-backend Mandarin flashcard app with spaced repetition. Pure HTML/CSS/vanilla
JS, no framework, no build step, no package.json. All state lives in the browser's `localStorage`.
Deployed to GitHub Pages from `main` at the repo root (https://sirimak-w.github.io/chinese-app/).

## Commands

There is no build, lint, or test tooling in this repo — it's plain static files.

Run locally (required because `fetch()` can't read the JSON data files from `file://`):
```bash
cd chinese-app
python -m http.server 8000
# open http://localhost:8000
```

To verify a change actually works, drive it in a real/headless browser (there's no automated test
suite) — click through: pick a card → Show Answer → listen buttons on the word/examples/compounds →
save a sentence → grade the card → confirm stats/heatmap update, and check the browser console for
errors.

Reset local progress: `localStorage.clear()` in the browser console.

## Architecture

Three files, no modules/bundler — `index.html` loads `style.css` and `app.js` (`app.js` is loaded
last and runs `init()` at the bottom of the file):

- `index.html` — single page, all UI markup as empty containers that `app.js` fills in.
- `style.css` — all styles. Note: `[hidden] { display: none !important; }` at the top exists because
  several elements (`.srs`, `.reveal-btn`, `.answer-block`) set their own `display` in author CSS,
  which silently overrides the browser's default `[hidden]` rule regardless of selector specificity
  (author origin beats user-agent origin). Don't remove that rule without re-adding `!important` or
  equivalent wherever a `hidden`-toggled element also has a `display` rule.
- `app.js` — everything else: state, SRS scheduling, card selection, rendering, speech, heatmap.

### Data model (`data/hsk1.json`, `hsk2.json`, `hsk3.json`)

Each file is a flat array of ~30 word objects, loaded via `loadDeck()` and concatenated into one
`deck`. Word shape:
```json
{
  "hanzi": "学习", "pinyin": "xuéxí", "meaning": "to study, to learn", "hsk": 2,
  "examples": [ { "hanzi": "...", "pinyin": "...", "translation": "..." }, /* exactly 3 */ ],
  "compounds": [ { "hanzi": "...", "pinyin": "...", "meaning": "..." }, /* 0-6, optional */ ]
}
```
`examples` must have exactly 3 entries (the UI always renders three example blocks). `compounds` is
optional and renders as clickable/speakable chips of related words built from that word's Hanzi.

### Persisted state (single `localStorage` key `"mandarin-app-v1"`)

```
state.cards[hanzi]  = { stepIndex, reviewCount, firstLearned, dueDate, mySentences[] }
state.sessions[day] = review count for that "YYYY-MM-DD"
state.reviews        = [{ date, correct }]  (capped at last 2000, drives 7-day accuracy)
```
`getCard(hanzi)` is the read path for a card record and also lazily migrates older records (which
only had SM-2's `interval` field) onto `stepIndex` via `migrateStepIndex` — don't bypass it with a
direct `state.cards[hanzi]` read when you need a normalized record.

### Card flow (one flashcard "turn")

1. `next()` → `pickNext()` picks the most-overdue due card, else an unseen card, else random —
   → `renderCard(word)`.
2. `renderCard` randomly assigns `word.direction` ("recognize": show Hanzi, ask meaning, or "recall":
   show meaning, ask Hanzi) and renders only the prompt side; the answer, examples, compounds, and
   grade buttons stay `hidden`.
3. User clicks **Show Answer** → `reveal()` fills in the rest (`renderExamples`, `renderCompounds`,
   `renderMySentences`) and unhides the grade buttons, with per-card dynamic labels from
   `updateSrsLabels`/`stepDays` (so "Hard 1 day" etc. reflects that specific card's current step).
4. User clicks a grade button → `schedule(word, grade)` updates `stepIndex`/`dueDate`, logs the
   review, then calls `next()` again.

### Fixed-day SRS (`STEPS = [1, 3, 7, 14, 30]`)

Not SM-2/Anki-style ease factors — a fixed step ladder. `again` resets `stepIndex` to `-1` and
re-shows the card in 10 minutes; `hard` repeats the current step; `good` advances one step; `easy`
skips a step. `stepDays(stepIndex, grade)` computes what a grade *would* schedule without mutating
state — it's what drives the button sub-labels, so keep it in sync with `schedule()`'s switch if the
ladder logic changes.

### Speech

`speak(text)` uses the Web Speech API (`lang: "zh-CN"`, `rate: 0.8`) and explicitly caches/reuses one
`zhVoice` (preferring a "Google" voice) picked via `pickZhVoice()`. This exists because Chrome loads
its voice list asynchronously — without pinning a voice, the first `speak()` call after page load
(usually the main word's Listen button) can land on a different, worse-sounding voice than later
calls made after voices finish loading. All listen buttons (main word, per-example, per-compound)
route through this same `speak()`.

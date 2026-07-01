# 学 Mandarin — Daily Chinese

A static, no-backend web app for learning Mandarin with spaced repetition.
All progress is stored in your browser's `localStorage`. Built to be hosted on GitHub Pages.

## Features

- **Two-way active recall** — each card randomly tests Hanzi → Meaning or Meaning → Hanzi. The answer
  (Hanzi, pinyin, meaning, examples, compounds) stays hidden behind a "Show Answer" button so you
  actually recall it instead of just re-reading it.
- **3 example sentences per word** — each with its own 🔊 listen button.
- **Compound words** — related words built from the main card's Hanzi (e.g. 做工作 / 做饭 / 做运动 from 做),
  shown as clickable, speakable chips.
- **Write your own sentence** — a free-text box on every card to produce output immediately; saved
  sentences persist per word and are shown back to you next time.
- **Fixed-day spaced repetition** — Again (10 min), Hard (repeat step), Good (advance a step), Easy
  (skip a step), stepping through Day 1 → 3 → 7 → 14 → 30; due cards resurface automatically.
- **Listen button** — speaks the word in Mandarin via the Web Speech API (`zh-CN`, rate `0.8`).
- **Stats** — words learned (+ today), cards due, and 7-day accuracy.
- **Streak counter** — consecutive days with a study session.
- **Year activity heatmap** — GitHub-style contribution graph with month labels and hover tooltips.

## Run locally

`fetch()` can't read the JSON files from `file://`, so serve the folder over HTTP:

```bash
cd chinese-app
python -m http.server 8000
# then open http://localhost:8000
```

## Data

Vocabulary lives in `data/hsk1.json`, `hsk2.json`, `hsk3.json` (~30 hand-checked words each).
Add more entries in the same format to grow the deck:

```json
{
  "hanzi": "学习",
  "pinyin": "xuéxí",
  "meaning": "to study, to learn",
  "hsk": 2,
  "examples": [
    { "hanzi": "我每天学习中文。", "pinyin": "Wǒ měitiān xuéxí zhōngwén.", "translation": "I study Chinese every day." },
    { "hanzi": "他很努力学习。", "pinyin": "Tā hěn nǔlì xuéxí.", "translation": "He studies very hard." },
    { "hanzi": "我在学习写汉字。", "pinyin": "Wǒ zài xuéxí xiě hànzì.", "translation": "I am learning to write Chinese characters." }
  ],
  "compounds": [
    { "hanzi": "学习中文", "pinyin": "xuéxí zhōngwén", "meaning": "study Chinese" },
    { "hanzi": "学习计划", "pinyin": "xuéxí jìhuà", "meaning": "study plan" }
  ]
}
```

`examples` should have exactly 3 entries. `compounds` is optional (0-6 entries) and lists related
words built from the card's Hanzi — shown as speakable chips once the answer is revealed.

## Reset progress

Clear the site's `localStorage` in your browser dev tools, or run `localStorage.clear()` in the console.

## Structure

```
chinese-app/
├── index.html   single-page app
├── style.css    all styles
├── app.js       SRS logic, speech, localStorage, heatmap
├── data/        HSK vocabulary
└── README.md
```

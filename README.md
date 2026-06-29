# 学 Mandarin — Daily Chinese

A static, no-backend web app for learning Mandarin with spaced repetition.
All progress is stored in your browser's `localStorage`. Built to be hosted on GitHub Pages.

## Features

- **Flashcards** — Hanzi, pinyin, English meaning, and a 3-line example sentence (pinyin / hanzi / translation).
- **Listen button** — speaks the word in Mandarin via the Web Speech API (`zh-CN`, rate `0.8`).
- **SM-2 spaced repetition** — four ratings (Again / Hard / Good / Easy) reschedule each card; due cards resurface automatically.
- **Stats** — words learned (+ today), cards due, and 7-day accuracy.
- **Streak counter** — consecutive days with a study session.
- **Year activity heatmap** — GitHub-style contribution graph with month labels and hover tooltips.
- **Module progress** — Vocabulary, Writing/Characters, Tones, Grammar.

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
  "example": {
    "hanzi": "我每天学习中文。",
    "pinyin": "Wǒ měitiān xuéxí zhōngwén.",
    "translation": "I study Chinese every day."
  }
}
```

The Vocabulary and Writing progress bars track real progress against the 1,200-word / 300-character
targets. Tones and Grammar are placeholders that will fill in once their content is added.

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

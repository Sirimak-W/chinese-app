# Chinese Handwriting Practice — Mock Concept Document

Companion document for `handwriting-mock.html`. Captures the design decisions, data structures, and validation logic used in the working prototype, plus the delta to production.

---

## 1. Concept Summary

A single-page, zero-dependency HTML5 canvas app where learners:

1. Select a character → see intro (pinyin, meaning, HSK, example word, audio)
2. Watch an animated stroke guide (normal / slow motion)
3. Trace the stroke starting from a red start dot
4. Get instant rule-based validation feedback on pen-up
5. Repeat per stroke → completion summary with per-stroke scores and XP

**Design theme:** 米字格 (rice grid) practice paper — cinnabar red grid on xuan-paper white, ink-stone blue app chrome, KaiTi typeface for the character reference (the standard handwriting model font).

---

## 2. State Machine

```text
watch ──(Watch button, animation ends)──► practice
practice ──(stroke passes validation)──► watch (next stroke)
practice ──(stroke fails)──► practice (retry, feedback shown)
practice ──(last stroke passes)──► done (summary + XP bonus)
done ──(Next button)──► watch (next character)
```

State variables:

| Variable | Purpose |
|---|---|
| `charIdx` | Current character index |
| `strokeIdx` | Current stroke to practice (also = count of completed strokes) |
| `attempts[]` | Attempt count per stroke → score decay |
| `scores[]` | Per-stroke score 0–100 → summary average |
| `phase` | `watch` \| `practice` \| `done` |
| `userPts[]` | Live pointer trail in canvas px |

---

## 3. Stroke Data Format

Strokes are polylines in a **0–100 normalized grid**, scaled to canvas px at render time. This keeps data resolution-independent and directly swappable with Hanzi Writer's `medians` format (which uses a 1024-unit grid — only the scale function changes).

```js
{
  char: "人", pinyin: "rén", meaning: "person", hsk: 1,
  word: "人们 (rénmen) — people",
  strokes: [
    { name: "piě (left falling)",  pts: [[52,14],[46,36],[36,60],[20,84]] },
    { name: "nà (right falling)",  pts: [[49,34],[59,54],[70,68],[84,84]] }
  ]
}
```

Mock set: 一, 十, 人, 大, 口 — chosen to cover the basic stroke types: héng (horizontal), shù (vertical), piě, nà, and héng-zhé (turning stroke).

**Densification:** polylines are interpolated into evenly spaced points (~6 px steps) before rendering and validation, so sparse hand-authored data behaves like dense median data.

---

## 4. Validation Algorithm (rule-based mock)

Runs on `pointerup`. Compares user trail vs. expected densified polyline. Checks are ordered so the *most actionable* error is reported first:

| # | Check | Rule | Feedback |
|---|---|---|---|
| 1 | Direction reversal | angle diff > 90° AND both endpoints off | "Wrong direction — this stroke is written left → right" |
| 2 | Start position | `dist(userStart, expectedStart) > 11%` of canvas | "Your stroke started too low/high/left/right" |
| 3 | Too short | `lenUser / lenExpected < 0.6` | "Too short — extend the stroke" |
| 4 | Too long | ratio > 1.7 | "Too long — lift the pen earlier" |
| 5 | End drift | end distance > 1.2 × tolerance | "The ending drifted low — aim for the endpoint" |
| 6 | Angle | overall angle diff > ~50° | "Keep the stroke top → bottom" |

Key measurements:

```js
dStart = dist(user[0], expected[0])          // start accuracy
dEnd   = dist(user[last], expected[last])    // end accuracy
ratio  = pathLen(user) / pathLen(expected)   // length
dAng   = |atan2(userVec) − atan2(expectedVec)|  // gross direction
tol    = 11% of canvas width                 // position tolerance
```

Known limitation (acceptable for mock): only endpoint vector is checked for direction, so a wavy path that starts/ends correctly passes. Production fix: **DTW or Fréchet distance** between densified paths for shape similarity.

---

## 5. Scoring & Gamification

- Pass score: `max(55, 100 − (attempts−1)×12 − (1−precision)×15)` where precision = endpoint accuracy vs. tolerance
- XP: **+10** first-try stroke, **+5** on retry pass, **+15** character completion bonus
- Feedback tiering: ≥90 "Excellent stroke!", ≥75 "Good — clean shape", else "Accepted, keep practicing"
- Completion summary mimics future vision-model output: per-stroke score + attempts, overall verdict, mock SRS scheduling line ("Review in 3 days" / "tomorrow" / "today" based on average)

---

## 6. Rendering Layers (per frame, back → front)

1. Paper background + 米字格 grid (dashed diagonals/cross, solid cinnabar border)
2. Full-character ghost at 8% opacity ink (positional context)
3. Completed strokes in solid ink with brush taper (line width decays 1.15× → 0.65× along path)
4. Animated hint stroke in cinnabar (portion 0→1 over 1.1 s, 2.6 s slow mode)
5. Red start dot (practice phase only)
6. Live user ink trail

`prefers-reduced-motion` respected: hint renders instantly, XP pop-up suppressed.

---

## 7. Input Handling

Pointer Events API only (`pointerdown/move/up` + `setPointerCapture`) — one code path covers mouse, finger, and Apple Pencil. `touch-action: none` on canvas prevents scroll hijacking. Coordinates mapped from client rect → 800×800 internal canvas so DPI/layout size don't affect validation.

Audio: Web Speech API (`SpeechSynthesisUtterance`, `lang: zh-CN`) stands in for native recordings.

---

## 8. Mock vs. Production Delta

| Area | Mock (current) | Production (per spec) |
|---|---|---|
| Stroke data | Hand-authored polylines, 5 chars | Hanzi Writer / Make Me a Hanzi medians (full HSK sets) |
| Validation | Endpoint + length + angle rules | Path similarity (DTW/Fréchet) + Hanzi Writer quiz mode |
| AI feedback | Rule-based message templates | Vision model on final canvas render, personalized tips |
| Persistence | None (in-memory XP) | localStorage → Supabase/PostgreSQL sync |
| SRS | Display text only | SM-2 scheduling on per-character accuracy |
| Audio | Web Speech API TTS | Native speaker recordings |
| Pressure/tilt | Not used | `PointerEvent.pressure` / `tiltX/Y` (Apple Pencil) |
| Platform | Single HTML file | React + Next.js + TypeScript + Tailwind |

### Suggested migration order

1. Swap stroke data source to Hanzi Writer medians (validation logic unchanged, denser points)
2. Add localStorage persistence for scores/XP/attempts → feed SM-2 review queue
3. Replace direction/shape rules with path-similarity scoring
4. Export final canvas as PNG → vision model call for qualitative feedback
5. Port to Next.js component structure; canvas logic moves into a `<StrokeCanvas>` hook

---

## 9. File Reference

- Prototype: `handwriting-mock.html` (single file, ~450 lines, no external dependencies)
- Design tokens: ink `#161a1f`, paper `#fdfcf8`, cinnabar `#d94f2b`, ink-stone blue `#1d2833`, seal gold `#d9a441`

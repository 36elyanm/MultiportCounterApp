# Multiport Counter

A fast, minimal tally counter app, inspired by apps like **Tally** and **Mini Counter**. Keep as many counters as you want — reps, water glasses, scores, habits, laps — and tap to count. Built with an Apple-style interface (SF Pro font stack, iOS system colors, blurred nav bar, bottom sheets, and haptic-style feedback).

**Made by Multiport LLC**

## Features

- **Multiple counters** — create as many named tallies as you need, each with its own color and step size.
- **One-tap counting** — big `+` / `−` steppers on every counter.
- **Custom step size** — count by 1, 5, 10, or 100.
- **Long-press to reset** — hold a counter's number to reset it to zero.
- **Swipe to delete** — swipe a counter left to reveal delete, or use Edit mode.
- **Haptic-style feedback** — subtle vibration on supported devices, toggleable in Settings.
- **Reset All / Delete All** — quick actions in Settings for clearing everything at once.
- **Persistent storage** — counters are saved locally in the browser, so your data is there next time you open the app.
- **Light & Dark Mode** — automatically follows your system appearance.
- **Installable** — add it to your iPhone/iPad Home Screen (or desktop) for a full-screen, app-like experience.
- **Responsive** — the app frame scales cleanly from small phones up through tablets and desktop browser windows; on wider screens it's centered as a phone-proportioned card instead of stretching edge to edge.

## Design

The UI follows Apple's Human Interface Guidelines look and feel:

- Large iOS-style navigation title, translucent blurred nav bar
- System color palette (blue, red, green, orange, yellow, purple, pink, teal, indigo)
- Rounded "card" list rows, bottom action sheets with a grabber handle
- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", ...`

> **Note on fonts:** SF Pro is Apple's proprietary typeface, and Apple's license does not permit redistributing its font files outside Apple's own platforms. So this app can't legally ship actual SF Pro. Instead:
> - On iOS, iPadOS, and macOS, `-apple-system` triggers the real, system-installed SF Pro automatically — no font file needed, since the OS already has it.
> - On every other platform (Windows, Android, Linux), the app self-hosts **Inter** (`assets/fonts/Inter-latin.woff2`, SIL Open Font License — see `assets/fonts/OFL.txt`), a free, metrically similar typeface, so the app still looks like one consistent, SF-Pro-like design instead of falling back to whatever generic default font the OS/browser ships.

## Getting Started

No build step or dependencies — it's a static app.

```bash
# from the project root
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
```

Or just open `index.html` directly in a browser.

### Add to Home Screen (iOS/iPadOS)

1. Open the app in Safari.
2. Tap the Share icon.
3. Tap **Add to Home Screen**.

It will launch full-screen, like a native app.

## Project Structure

```
MultiportCounterApp/
├── index.html          # App markup
├── manifest.json       # Web app manifest (installable/PWA metadata)
├── css/
│   └── style.css       # Apple-style UI, light/dark themes
├── js/
│   └── app.js          # Counter logic, persistence, gestures
├── assets/
│   ├── icon.svg          # App icon
│   └── fonts/
│       ├── Inter-latin.woff2  # Self-hosted fallback font
│       └── OFL.txt            # Inter's SIL Open Font License
└── README.md
```

## Tech Stack

Plain HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no external dependencies. Data is persisted with `localStorage`.

## License

© Multiport LLC. All rights reserved.

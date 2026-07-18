# Multiport Counter

A fast, minimal tally counter app, inspired by apps like **Tally** and **Mini Counter**. Keep as many counters as you want — reps, water glasses, scores, habits, laps — and tap to count. Built with Apple's **Liquid Glass** design language — translucent, refractive material with specular highlights, floating pill-shaped toolbars, and glass bottom sheets — and deeply customizable, so you can make it look like yours.

**Made by Multiport LLC**

## Features

- **Multiple counters** — create as many named tallies as you need, each with its own color, icon, and step size.
- **One-tap counting** — big `+` / `−` steppers on every counter.
- **Custom step size** — count by 1, 5, 10, or 100.
- **Custom icon per counter** — pick from 20 emoji (💪 🏃 💧 ☕️ …) or stick with a plain color dot.
- **Long-press to reset** — hold a counter's number to reset it to zero.
- **Swipe to delete** — swipe a counter left to reveal delete, or use Edit mode.
- **Haptic-style feedback** — subtle vibration on supported devices, toggleable in Settings.
- **Reset All / Delete All** — quick actions in Settings for clearing everything at once.
- **Persistent storage** — counters and all appearance settings are saved locally in the browser.
- **Light & Dark Mode** — automatically follows your system appearance.
- **Installable** — add it to your iPhone/iPad Home Screen (or desktop) for a full-screen, app-like experience.
- **Responsive** — the app frame scales cleanly from small phones up through tablets and desktop browser windows; on wider screens it's centered as a phone-proportioned card instead of stretching edge to edge.
- **Starts empty** — no sample counters; the first thing you see is the empty state, ready for your own.

## Customization

Everything below lives in the Settings sheet (gear icon, top right) and is saved automatically:

- **Accent color** — 9 system colors control the FAB, buttons, links, and selection states.
- **Wallpaper** — 6 backgrounds (Mono, Aurora, Sunset, Ocean, Candy, Midnight) glow through every glass surface in the app, so the material actually has something colorful to refract.
- **Per-counter color & icon** — every counter gets its own accent color and optional emoji, independent of the global theme.
- **Reduce Transparency** — an accessibility/performance toggle that swaps every frosted panel for a solid, opaque one (mirrors Apple's real Liquid Glass accessibility setting).
- **Haptic Feedback** — on/off toggle for the vibration feedback.

## Design

The UI is built around Apple's **Liquid Glass** material (introduced in iOS 26 / macOS Tahoe):

- Floating, pill-shaped nav bar and glass bottom sheets with a grabber handle, rather than flat opaque bars
- Every surface — nav bar, counter cards, buttons, sheets — is real frosted glass (`backdrop-filter: blur() saturate()`), with a soft inner highlight simulating a specular reflection along the top edge
- A colorful, customizable wallpaper sits behind the whole app so the glass has depth and color to refract, just like on-device Liquid Glass
- The floating "+" button reads as a glass orb with its own specular highlight and a slow idle glow, rather than a flat colored circle
- Three soft, slowly-drifting color blobs sit behind the app so the glass always has something colorful to refract, even on the plain "Mono" wallpaper
- A fine grain texture is layered onto the nav bar, cards, and FAB so the glass reads as frosted material rather than a flat blurred rectangle
- Counter cards fade in with a subtle staggered entrance when the list changes
- System color palette (blue, red, green, orange, yellow, purple, pink, teal, indigo) for both the customizable accent and per-counter colors
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

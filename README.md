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
- **Points → dollars** — every counter shows a dollar value under its step size, at a fixed rate of **10 points = $1.00** (display only — no real money moves; see [Points-to-dollars](#points-to-dollars-display-only) below). Toggle it off in Settings if you don't want it.
- **Accounts & cloud sync (optional)** — sign up or sign in to save your counters to a Cloudflare D1 database instead of just this browser's `localStorage`, so they follow you across devices. Using the app without an account works exactly as before (counters stay local to the browser).

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

## Points-to-dollars (display only)

Every counter shows its count converted to a dollar amount at a fixed rate of **10 points = $1.00** (e.g. a count of 24 shows `$2.40`). This is purely a label computed in the browser — **no payment processor, payout, or real money is involved**. Turn it off with the "Show Dollar Value" toggle in Settings if you'd rather just see the raw count.

## Accounts & Cloud Sync

By default the app works exactly like a local-only app: counters are saved in the browser's `localStorage` and never leave your device. Signing in is optional and adds cross-device sync:

- **Sign Up / Sign In** from Settings → Account.
- Once signed in, every change (add, edit, delete, count, reset) is synced to a **Cloudflare D1** database through **Cloudflare Pages Functions** — server-side API routes that deploy as part of this same Pages project, on the same domain as the static site. No separate service, no CORS to configure.
- Signing up while you already have local counters adopts them as your first cloud save; signing into an existing account pulls down whatever was saved there.
- Signing out returns to local-only mode; your last-synced data stays cached in `localStorage`.

### Deploying the backend

The API lives in `functions/api/` (file-based routing — `functions/api/signup.js` becomes `POST /api/signup`, `functions/api/counters/[id].js` becomes `/api/counters/:id`, etc.) and `functions/_lib/auth.js` holds the shared password-hashing/session helpers. Everything here is entirely dashboard-driven — no CLI required:

1. **Create the D1 database** — [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **D1** → **Create Database** → name it `multiport-counter-db`.
2. **Apply the schema** — open that database → **Console** tab → paste in the contents of `schema.sql` (repo root) → run it. Creates the `users`, `sessions`, and `counters` tables.
3. **Bind the database to this Pages project** — your Pages project → **Settings** → **Functions** → **D1 database bindings** → **Add binding** → variable name `DB` → select `multiport-counter-db`. Do this for both the **Production** and **Preview** environments if you want it working on preview deploys too.
4. **Redeploy** — push to the connected branch (or retrigger a deployment) so Pages picks up the `functions/` directory and the new binding.

That's it — no `API_BASE_URL` to set (it's `""`, i.e. same-origin, in `js/app.js`) and nothing to keep in sync between a separate API domain and the frontend.

`schema.sql` defines three tables: `users` (email + salted/hashed password via PBKDF2), `sessions` (random tokens, 30-day expiry, set as an `HttpOnly`/`Secure` cookie), and `counters` (one row per counter, scoped to `user_id`).

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
├── schema.sql           # D1 schema — run once via the D1 dashboard console
├── css/
│   └── style.css       # Apple-style UI, light/dark themes
├── js/
│   └── app.js          # Counter logic, persistence, gestures, auth/sync
├── assets/
│   ├── icon.svg          # App icon
│   └── fonts/
│       ├── Inter-latin.woff2  # Self-hosted fallback font
│       └── OFL.txt            # Inter's SIL Open Font License
├── functions/            # Cloudflare Pages Functions (optional backend)
│   ├── _lib/
│   │   └── auth.js       # Password hashing (PBKDF2) and session helpers
│   └── api/
│       ├── signup.js     # POST /api/signup
│       ├── login.js      # POST /api/login
│       ├── logout.js     # POST /api/logout
│       ├── me.js         # GET /api/me
│       ├── counters.js   # GET/PUT/DELETE /api/counters
│       └── counters/
│           └── [id].js   # PATCH/DELETE /api/counters/:id
└── README.md
```

## Tech Stack

Frontend: plain HTML, CSS, and vanilla JavaScript — no frameworks, no build tools. Counters are always persisted locally with `localStorage`, and optionally synced to a Cloudflare D1 database through Cloudflare Pages Functions when signed in (see [Accounts & Cloud Sync](#accounts--cloud-sync)).

## License

© Multiport LLC. All rights reserved.

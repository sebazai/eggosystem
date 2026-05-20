# Iconography

Kanaliiga uses one icon library, one mascot, and a small set of eyebrow emoji. Nothing else.

## 1. UI icon library — Lucide

Stack confirmation from the codebase (`apps/frontend/README.frontend.md`):

> Icons: Lucide React

Every UI icon in Kanahub is a Lucide React component. The UI kits in this project link Lucide from `unpkg.com/lucide@latest` so the same glyphs are available in static HTML.

### Usage rules

- **Stroke weight:** `stroke-width="1.5"` for UI, `2` inside buttons and loud promos.
- **Never fill.** Lucide is a line set; filled icons look wrong next to Vera Mono.
- **Sizing table:**

  | Context | Tailwind | Pixels |
  |---|---|---|
  | Body inline | `size-3` / `h-3 w-3` | 12 |
  | Button / input / badge | `size-4` / `h-4 w-4` | 16 |
  | Large button, nav trigger | `size-5` / `h-5 w-5` | 20 |
  | Icon button (default) | `size-9` | 36 (container) / 16 glyph |
  | Feature tile | `h-8 w-8` → `2xl:h-12 w-12` | 32 → 48 |

- **Color:** `currentColor` so icons inherit from the text. Accent icons (e.g. hero tile iconography) use `text-orange-400` / `var(--kanaliiga-orange)`.
- **Spacing:** icons sit in a `gap-2` flex container next to their label. Leading icons: `mr-2`; trailing icons: `ml-2`. Arrows (`ChevronRight`, `ExternalLink`) trail. Functional icons (`Calendar`, `Clock`, `Users`) lead.

### The canonical Kanahub icon set

These Lucide glyphs appear across screens. Keep using them for the same concept — don't substitute.

| Concept | Lucide name |
|---|---|
| Match / schedule | `Calendar` |
| Time, start time | `Clock` |
| External link | `ExternalLink` |
| Watch stream | `Play` (or inline Twitch SVG, see below) |
| Standings / rankings | `TrendingUp` |
| Teams / organizations / players | `Users` |
| Menu (mobile) | `Menu` |
| Nav sub‑menu | `ChevronRight` |
| My team vs opponent | `Swords` |
| Search | `Search` |
| Filter | `SlidersHorizontal` |
| Success toast | `CheckCircle2` |
| Error / flag | `AlertTriangle` |
| Destructive / delete | `Trash2` |
| Admin — approve | `ShieldCheck` |
| Admin — dashboard | `LayoutDashboard` |

### Exceptions to Lucide

**Twitch glyph** — the stream buttons use an inline Twitch SVG path rather than a Lucide substitute, because brand. Copy directly from `HeroSection.tsx`:

```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
</svg>
```

**Steam logo** on Steam‑ID inputs, **Discord logo** on the join‑discord CTA — use the real brand marks; do not recreate with Lucide.

## 2. Mascot — the fried chicken

`assets/kfc.png` is the only brand illustration. It is used:

- as the **Konami‑code easter egg** (press ↑↑↓↓←→←→BA and the screen fills with tumbling chicken legs for 8s; see `KfcRain.tsx`).
- as a **hidden watermark** / site 404 Easter art if you want to lean in.

It is **not** an icon. Don't put it in buttons, don't put it in lists, don't use it as a favicon replacement. The Kanaliiga logo covers those roles.

## 3. Emoji — eyebrow only

A single emoji is allowed as the leading glyph of a section header when it carries meaning:

| Emoji | Used for |
|---|---|
| 🎮 | Season is live / currently playing |
| 📝 | Registration / signup open |
| 📊 | Statistics / all‑time highlights |
| 📺 | Streamed matches tab |
| 🏆 | Hall of Fame / champions |
| 🍗 | Kanaliiga self‑reference in a chatty context (release notes, easter eggs) — don't use in marketing pages |

Rules:

- **One per header, at the start, followed by a space.** Never two in a row, never mid‑sentence.
- Never in navigation, buttons, toasts, badges, or admin copy.
- Never in body paragraphs.
- If you can't decide between an emoji and a Lucide icon, use Lucide. Emoji is the exception.

## 4. Logo

The Kanaliiga mark (`assets/kanaliiga-logo-1800px.png`) is a single component — golden chicken crest + orange cap‑height wordmark. The one‑color flattened variant (`kanaliiga-logo-1color-64px.png`) is for favicons only.

- **Minimum size:** 40px tall. Below that switch to the 1‑color variant.
- **Clear space:** at least the height of the "K" around every side.
- **Backgrounds:** the mark works on dark (its native context) and on the off‑white `--bg`. **Never** place it on a solid orange field — the wordmark is already orange.
- **Never:** rotate, tilt, recolor, add drop shadow, stretch, pair with a tagline in a different font, or animate.
- **Loading priority:** the nav logo uses Next.js `Image` with `priority` — it is LCP on the landing page.

See `preview/brand-logos.html` for the canonical lockups.

# Kanaliiga Design System — Integration Prompt

> Copy this entire file into your coding agent (Claude Code, Cursor, Copilot, etc.) alongside the `handoff/` folder.
> The agent should treat this prompt as the task spec and the files in `handoff/` as the source of truth.

---

## Task

Integrate the **Kanaliiga / Kanahub design system** into our existing **React + Tailwind CSS + shadcn/ui** repository. This is a tokens + typography + component‑conventions port — not a rewrite of our app. Do not touch feature code, routes, or data layer. Only touch:

- Tailwind config
- Global CSS (tokens, fonts, base element styles)
- `components/ui/*` theming (buttons, cards, badges, inputs, separators)
- A small `components/kanaliiga/*` folder for brand‑specific primitives (logo, mascot, stream‑pulse wrapper, stat card)
- Font files under `public/fonts/`
- Logo + mascot assets under `public/images/kanaliiga/`

When you're finished, a page using stock shadcn `Button`, `Card`, `Badge`, `Input`, and `Separator` components should automatically look Kanaliiga‑branded with no per‑component class soup.

---

## Inputs you have

In `handoff/`:

| File | What it is |
|---|---|
| `HANDOFF_PROMPT.md` | This file |
| `globals.css` | Full token set (CSS custom properties, light + `.dark`), `@font-face` blocks, base element styles, semantic link styles |
| `tailwind.config.reference.ts` | Reference Tailwind v4 config that maps the tokens to utility classes — merge into ours, don't overwrite |
| `fonts/` | 7 font files — NEXT ART Heavy (display), Bitstream Vera Mono (4 weights), Poppins (2 weights, used by *one* component only) |
| `assets/` | Kanaliiga logo (4 sizes), open‑graph banner, KFC mascot (easter egg only), 1‑color favicon logo |
| `components/` | Reference React + Tailwind + shadcn component source for: `Logo`, `KanaliigaButton` wrapper, `StreamPulseCard`, `StatCard`, `SectionSeparator`, `TierDot`, `TwitchIcon` |
| `ICONOGRAPHY.md` | Icon / emoji / mascot usage rules — read before adding any icon |
| `VOICE.md` | Copywriting tone + casing rules — read before writing any UI string |

---

## Non‑negotiable rules

These come from the authoritative `globals.css` already in the live repo. Don't invent alternates.

### Color

- **Brand palette is exactly four colors.** Don't add a fifth.
  - Kanaliigan oranssi `#F29209` — accent, focus ring, h1, all primary CTAs
  - Tummanharmaa `#161515` — dark card surface
  - Valkoinen `#FFFFFF`
  - Vaaleanruskea `#D09158` — secondary accent, input border, hover tint, h2
- Orange is the **only** accent hue. Never tint with a different brand.
- **Never place the logo on a solid orange field.** The wordmark is already orange.
- Neutrals come from Tailwind's slate/zinc scales via HSL variables in `globals.css`. No hand‑picked greys.
- Semantic tokens are defined twice — `:root` (light) and `.dark`. The live site is **dark‑first** (`defaultTheme="dark"` on the `ThemeProvider`).

### Typography

- **Headings → NEXT ART Heavy** (`--font-headings`). Capsheight‑only face — "lowercase" renders as small caps. This is expected.
- **Body + UI + numerals → Bitstream Vera Mono** (`--font-body`). Monospace. Use `font-feature-settings: "tnum" 1` everywhere (already set on `body`).
- **Poppins is used by exactly one component** — the CS Premier rank chip. Do not substitute Inter, Roboto, or system-ui for anything.
- **Heading color rule (enforced in base styles):**
  - `h1` → orange
  - `h2` → light brown
  - `h3`–`h6` → inherit
- `nav, nav *` uses the display face too.
- Root font‑size is **`14px`**. Don't change it — the Tailwind scale is calibrated around it.

### Radii & elevation

- Card radius: `--radius: 0.6rem` (~8.4px). Buttons inherit `rounded-md`. Stat pills are `rounded-full`. **No 90° corners anywhere.**
- Shadows are light (`shadow-sm`, `shadow-md`). The one loud glow is `--shadow-orange-glow` — reserved for the live‑stream pulse.

### Surfaces

- **Marketing / landing:** diagonal slate gradient base `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`, glass‑overlay cards `bg-white/5 border-white/10 hover:bg-white/10`. No background imagery.
- **Content + admin:** plain `--bg` with `bg-card` cards + `shadow-sm`. No gradients.
- **Stream cards:** tri‑band Twitch gradient `from-purple-600/10 via-orange-600/10 to-red-600/10` + `streamPulse` animation.

### Borders / separators

- Hairline 1px in `--border`.
- On dark glass overlays: `border-white/10` or `border-white/20`.
- **Signature brand separator:** 1px horizontal line in `bg-kanaliiga-orange` between landing sections — ship this as `<SectionSeparator />`.

### Icons

- Library: **Lucide React**. Stroke 1.5 (UI) or 2 (inside loud buttons/promos). **Never filled.**
- Sizing: `size-3` inline, `size-4` in buttons/inputs/badges, `size-5` in large buttons, `size-8+` for feature tiles.
- Color: `currentColor`. Accent icons use `text-kanaliiga-orange`.
- Twitch glyph is the **only** inline SVG exception — use the path in `handoff/components/TwitchIcon.tsx`. Steam/Discord marks on brand‑ID inputs are real brand marks, not Lucide.
- Emoji are only allowed as a **single eyebrow glyph on a section header**: 🎮 📝 📊 📺 🏆. Never in nav, buttons, toasts, body copy.
- The fried‑chicken mascot (`kfc.png`) is **not an icon**. It's reserved for the Konami‑code easter egg and 404 art.

### Animation

- 200–300ms ease‑in‑out default for hover/press.
- `scale(1.02)` on card/button hover. No bounces or springs.
- `streamPulse` (2s ease‑in‑out infinite) — live Twitch stream cards **only**.
- `animate-spin-slow` — KFC easter egg **only**.

### Voice (see `VOICE.md` for full detail)

- Second person to the reader. First‑person plural for the org. **Never first‑person singular.**
- **Title Case** in nav, section headers, buttons. **Sentence case** in descriptions + in‑product copy.
- **ALL CAPS** is the display face's job — reserved for logo eyebrow ("CORPORATE ESPORTS LEAGUE"), `LIVE` pill, section kickers. Don't ALL‑CAPS body copy.
- Finnish product names stay Finnish: *Kanaliiga, Kanahub, Kanahautomo, Titta*.
- Stats lead. No exclamation spam. No corporate jargon ("leverage", "synergies").

---

## Integration steps

Execute in order. After each step, verify the app still builds and no existing page visibly regressed.

### Step 1 — Fonts

1. Copy `handoff/fonts/*` into `public/fonts/kanaliiga/` (preserve filenames).
2. Copy the `@font-face` blocks from `handoff/globals.css` (top section, ~lines 1–55) into our global stylesheet. Update the `url()` paths to `/fonts/kanaliiga/…`.
3. If we use `next/font/local`, register these families there instead — but keep the family names exactly: `NextArt`, `BitstreamVeraMono`, `Poppins`. Downstream CSS references them by string.

### Step 2 — Tokens

1. Open our global CSS (`globals.css` or equivalent).
2. Merge the brand primitives block (`--kanaliiga-*`), typography families, type scale, radii, elevation, and layout variables from `handoff/globals.css` into our `:root`. These should not collide with shadcn defaults.
3. Replace the shadcn default semantic tokens in `:root` and `.dark` with the ones in `handoff/globals.css`. Our existing token names (`--background`, `--foreground`, `--primary`, `--ring`, etc.) may differ slightly from the handoff file's (`--bg`, `--fg`) — **prefer the shadcn names we already use** and copy the HSL values across. Don't rename things our components already reference.
4. Add the extra token groups that aren't in default shadcn: `--tier-*`, `--status-*`, `--sidebar-*`, `--stream-glow`, `--shadow-orange-glow`.

### Step 3 — Tailwind config

Merge `handoff/tailwind.config.reference.ts` into ours. Key additions:

- `theme.extend.colors.kanaliiga.{ orange, "dark-gray", white, "light-brown" }` mapped to the raw hex primitives.
- `theme.extend.colors.tier.{ premier, elite, challenge, open }` using `hsl(var(--tier-*))`.
- `theme.extend.fontFamily.{ headings, body, poppins, mono }` → the CSS variables.
- `theme.extend.borderRadius.lg` → `var(--radius)`.
- `theme.extend.boxShadow["orange-glow"]`, `sm`, `md` → the tokens.
- `theme.extend.keyframes.streamPulse` and `theme.extend.animation["stream-pulse"]`.
- Safelist `stream-match` so the live‑pulse class isn't purged.

If we're on Tailwind v4 with CSS `@theme`, express the same mappings inside `@theme { … }` instead — the reference file shows both forms.

### Step 4 — Base element styles

Copy the base element styles block from `handoff/globals.css` (the section starting `/* ---------- Base / semantic element styles ---------- */`) into our global stylesheet, below the tokens. This sets:

- `html { font-size: 14px }`
- `body` font + antialiasing + tnum
- `h1`–`h6` font + color rule (h1 orange, h2 brown, h3+ inherit)
- `.h-display`, `.h-hero`, `.h-section` clamp‑scaled heading utilities
- `nav, nav *` → display face
- `p`, `small`, `code`, in‑copy `a`, `.kanaliiga-link`
- `::selection` in brand orange

### Step 5 — shadcn component theming

For each of these in `components/ui/*`, swap the default styling to reference our new tokens. **Don't fork the components** — edit the existing `cva` variants / class lists in place.

- `button.tsx` → default variant uses `bg-primary` which is now orange via tokens; confirm `focus-visible:ring` uses `--ring` (orange). Hover: `hover:bg-primary/90`. Size `default` = `h-9`, `sm` = `h-8`, `lg` = `h-10`. `gap-2` flex for leading icons.
- `card.tsx` → `rounded-[var(--radius)] border bg-card text-card-foreground shadow-sm`. For the marketing glass overlay, use `<Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">` — don't bake the overlay into the default variant.
- `badge.tsx` → add a `live` variant: `bg-destructive text-destructive-foreground animate-pulse rounded-full font-headings tracking-wide`. Default variant already works.
- `input.tsx` → border uses `--input` (brown). Focus ring uses `--ring`.
- `separator.tsx` → default works; the orange section rule is a separate component (see Step 6).

### Step 6 — Brand primitives

Add these small components under `components/kanaliiga/`:

- `Logo.tsx` — wraps `next/image` on `/images/kanaliiga/logo-1800.png` with `priority` on LCP surfaces. Props: `size: "sm" | "md" | "lg"`, `variant: "full" | "mark"`. Enforces the 40px‑min and clear‑space rules in JSDoc comments only.
- `SectionSeparator.tsx` — 1px `bg-kanaliiga-orange` with `my-3 md:my-6`. Single line of markup.
- `StatCard.tsx` — monospace numeral + small‑caps label. Hover: `hover:bg-kanaliiga-light-brown/30`.
- `StreamPulseCard.tsx` — wraps a `Card` with the `streamPulse` animation + Twitch gradient. Only renders the pulse when a `isLive` prop is truthy.
- `TierDot.tsx` — `inline-block size-2 rounded-full bg-tier-{tier}`. Tier key is typed.
- `TwitchIcon.tsx` — the inline SVG from `handoff/components/TwitchIcon.tsx`.
- `KfcRain.tsx` — Konami‑code easter egg. Gate behind a `useKonami` hook; render inside the app shell only in production.

Export barrel from `components/kanaliiga/index.ts`.

### Step 7 — Theme provider

If we don't already have one, wire `next-themes` (or our existing theme provider) with `defaultTheme="dark"`, `attribute="class"`, `enableSystem={false}`. The marketing shell should boot to dark; admin routes may set `data-theme="light"` locally.

### Step 8 — Verification checklist

Before handing back, verify:

- [ ] `html` element has `class="dark"` on load by default.
- [ ] `document.body` computed font-family starts with `BitstreamVeraMono`.
- [ ] A raw `<h1>Test</h1>` on any page renders in NEXT ART Heavy, orange.
- [ ] A raw `<h2>Test</h2>` renders in NEXT ART Heavy, light brown.
- [ ] `<Button>Register Your Team</Button>` has an orange fill and a 3px orange ring on keyboard focus.
- [ ] `<Input />` border is light brown in both themes.
- [ ] No Poppins usage anywhere except the CS Premier rank chip.
- [ ] No new grey hex codes were introduced — `git grep` for `#[0-9a-f]{6}` finds only the four brand colors + tokens inside `globals.css`.
- [ ] Lighthouse contrast audit passes on both themes.
- [ ] The landing `<SectionSeparator />` is 1px orange, not default grey.

---

## Out of scope

Do **not** do any of the following unless the user explicitly asks:

- Restyle pages or features.
- Rewrite shadcn components from scratch.
- Add new dependencies beyond `lucide-react`, `next-themes`, `class-variance-authority`, `tailwind-merge` (if missing).
- Port the KanaliigaTV embed, Kanahautomo fantasy draft, or admin dashboard layouts. Those are product work.
- Change our file layout, routing, or data‑fetching patterns.

---

## If tokens conflict with the live repo

The live repo's `apps/frontend/src/app/globals.css` is the ultimate source of truth. If a value in `handoff/globals.css` disagrees with what's already in our repo on the `development` branch, **our repo wins** — these handoff files are a snapshot. Flag the mismatch in your final summary so we can reconcile.

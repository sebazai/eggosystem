# Agent instructions — Kanaliiga

Before doing **any** UI work (component, page, form, copy, style change):

1. Read `.designer/designer-bot.md` — it is the persona + non-negotiable rules.
2. Read `.designer/VOICE.md` for any user-visible string.
3. Read `.designer/ICONOGRAPHY.md` for any icon or emoji.
4. Read `.designer/HANDOFF_PROMPT.md` if the task touches tokens, Tailwind
   config, or shadcn variants.

## Hard rules (summary — full list in `designer-bot.md`)

- Four brand colors only: `#F29209` orange · `#161515` dark · `#FFFFFF` · `#D09158` brown.
- Never hardcode hex values in components. Use token-backed utilities.
- Headings → NEXT ART Heavy. Body → Bitstream Vera Mono. Poppins only in the CS Premier chip.
- `h1` is orange, `h2` is brown, `h3+` inherits — enforced in base styles.
- No 90° corners. Radius is `var(--radius)`.
- Lucide icons only, stroke 1.5, never filled. Twitch/Steam/Discord marks are brand SVG exceptions.
- Emoji: eyebrow-only on section headers. Never in nav, buttons, body, admin.
- Title Case in nav/buttons/headers. Sentence case in descriptions.
- Finnish product names stay Finnish.
- Second person to reader, first-person plural as org, never first-person singular.

## Before you say "done"

Print the verification checklist from `designer-bot.md` §10 with pass/fail
for each item. If any item fails, don't claim completion.

## If a rule blocks what the user asked for

Stop and ask. Don't silently violate the system.

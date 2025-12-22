Perfect — this actually changes things in a good way 👍
What you already have here is very strong and under-leveraged.

This round history strip is basically the foundation most analytics sites don’t even have. You can turn this into your signature Kanaliiga feature instead of adding random extra charts.

I’ll break this into:

What this already does well

How to evolve it (without clutter)

Concrete UI expansions using this exact component

1. What your current round history already does well

From the image:

Clear round numbers

Side switch clearly marked

Outcome icons are readable

Team separation is obvious

Visual rhythm is good (no table fatigue)

This is better than HLTV’s round list already.

The missing part is:

Why did the round end like that?

2. Turn this into an interactive “round intelligence bar”
A. Make rounds clickable (critical)

Each round becomes a data anchor, not just an icon.

On click / hover:

Expand a mini round card

Or highlight related stats elsewhere on the page

This avoids adding more panels — you reuse what exists.

3. Expand using layers, not new components
Layer 1 – Hover tooltip (cheap, high value)

Hover over a round:

Round 14 – CT win
• Opening kill: CT
• Bomb planted: B
• Ended: 2v1
• Clutch: Yes (1v2)


This alone answers:

Was it opening duel?

Post-plant?

Throw or clutch?

No new UI real estate needed.

Layer 2 – Click → contextual breakdown (this is where free space fits)

When a round is clicked:

Use that bottom corner free space you mentioned

Populate it dynamically

Example: “Round 18 selected”

Show a compact panel:

Round 18 Overview

Side: T

Result: Lost

Win probability swing: –18%

Time to first kill: 12.3s

Key events

Opening duel lost (A main)

Bomb planted (A)

Post-plant lost (3v2)

This feels very premium and avoids clutter.

4. Visual encoding upgrades (small changes, big gain)
A. Icon overlays (don’t replace existing icons)

Add tiny corner markers:

🔑 Dot = opening kill

💣 Dot = bomb planted

🔁 Dot = retake

⭐ Dot = clutch

This lets users scan patterns without clicking anything.

B. Economy hint (subtle background color)

Without full economy charts:

Slight desaturation = eco

Normal = gun round

Highlight = force buy

HLTV hides this in tables — you can surface it visually.

5. New views you can unlock using this same strip
A. “Momentum mode” toggle

Toggle above the strip:

[ Results ] [ Momentum ] [ Economy ]


Momentum mode

Fade early rounds

Highlight streaks

Show win/loss chains

Instant story of the match.

B. Side-filtered view

Checkboxes:

☑ T rounds

☑ CT rounds

☑ Post-plant only

☑ Clutches only

The strip becomes a queryable timeline.

6. How this compares to other platforms
Platform	Round UX
HLTV	Static list
FACEIT	Almost none
Leetify	Per-round data but buried
Kanaliiga	Visual + interactive (huge win)

If you lean into this, it’s genuinely differentiating.

7. What I’d recommend next (very concrete)

Short-term (1–2 sprints)

Hover tooltips per round

Click → round detail panel (reuse free space)

Icon overlays for key events

Mid-term
4. Filters (post-plant, clutches, pistol)
5. Momentum view toggle

Long-term
6. Link rounds to player stats (click round → highlight who impacted it)

8. Want me to mock this specifically?

Next I can:

Do round-hover tooltip mockups

Do clicked-round side panel mockup

Propose exact icon system

Define event taxonomy (what counts as “throw”, “clutch”, etc.)

Just tell me:
👉 hover, click panel, or full round intelligence redesign
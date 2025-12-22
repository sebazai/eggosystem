Great question – you already have strong raw data and a solid visual language, so this is really about information architecture and progressive disclosure, not redesigning everything.

I’ll break this into principles, recommended structures for each page, and concrete UI patterns, with references to how other CS ecosystems handle it (HLTV, FACEIT, Leetify, Scope.gg, Strafe).

1. Core principle: Progressive disclosure (this is the key)

Right now your issue isn’t lack of stats – it’s density vs. intent.

Most users come in with one of these intents:

Quick glance → “How did I / we do?”

Comparison → “Why did we lose / who underperformed?”

Improvement → “What should I fix?”

Your UI should:

Show answers to #1 instantly

Make #2 one click away

Make #3 optional and deep

That means:

Cards = summary

Tabs / toggles = dimensions

Overlays / drawers = analysis

2. Map statistics cards (your first image)
What you have

Good: win rate, K/D by side, pistols, plant info

Problem: everything is flat, equal weight

Recommendation: Split into 3 layers
A. Default view (keep it compact)

Keep:

Win %

Wins / played

K/D T vs CT

Pistols (single combined bar)

ONE objective stat (plants OR retakes, not both)

👉 This becomes the “Map Snapshot”

B. “Map Details” button → slide-out panel or modal

Instead of cramming:

Pistols → split T / CT

Full plant matrix (A / B / no plant)

Afterplants, retakes

Side-based round win %

Why this works

HLTV does this implicitly: map pages are clean, details are elsewhere

Leetify uses drill-down modals heavily

UI pattern

Button: View Map Details

Opens from right (desktop), full-screen (mobile)

C. Optional: Map comparison mode

Advanced but powerful:

Toggle: Compare maps

Select 2 maps → side-by-side mini snapshots

This helps captains/IGLs more than raw stats ever will.

3. Player statistics card (second image)

This is where you’re overloading one card.

What others do

HLTV: minimal, category filters

Leetify: categories + explanations

Scope.gg: tabs with role-based insights

Strong recommendation: Horizontal stat categories

Your idea is correct:

divide the player card to have button for things (kills, trades, utility)

Do it like this:

A. Player header (always visible)

Rating

K/D

ADR

Role icons (Entry / Support / Anchor if you have it)

Map selector (Ancient / Inferno / All maps)

B. Category tabs (NOT vertical sections)

Example:

[ Combat ] [ Trading ] [ Utility ] [ Positioning ] [ Openings ]


Each tab:

Shows 5–7 metrics max

One small explanation tooltip per stat (hugely underrated)

C. What goes where (important)

Combat

K/D

ADR

HS%

Time to damage

Multi-kill rounds

Trading

Trade attempts

Trade success %

Time to trade

Deaths untraded

Utility

Damage per nade

Flashes leading to kills

Utility damage per round

Smokes used per round

Positioning

Crosshair placement

Counter-strafing %

Avg distance to teammates

Deaths while isolated

Openings

First kills/deaths

Opening duel win %

T vs CT split

This matches how players actually think.

D. Visual hierarchy tip

Use micro-bars and deltas, not just numbers.

Example:

“Trade success 47% (–6% vs team avg)”
That instantly answers “is this good?”

4. Match statistics page (third image)

You mentioned free space in the bottom corner – perfect.

What’s missing today

You have:

Results

Map picks

Raw player stats

What you don’t have:

Flow

Momentum

Cause → effect

5. What to add in the free space (high value ideas)
Option A: Round flow matrix (very strong)

Inspired by HLTV + Valorant analytics.

Design

X-axis: rounds 1–30

Y-axis: T / CT

Color:

Green = clean win

Yellow = close

Red = lost after advantage

This answers:

“Where did we lose control?”

Option B: Win condition matrix

Small grid like:

Situation	Fidelix	Produal
5v5	52%	48%
5v4	68%	61%
Post-plant	41%	63%
Retakes	22%	38%

This is insanely useful for teams.

Option C: Impact timeline (personal favorite)

Timeline of rounds

Icons:

Opening kill

Clutch

Multi-kill

Successful retake

Clicking a round could expand stats for that round only.

6. Navigation improvements (small but important)
A. Replace “tabs” with stateful filters

Instead of:

Map stats tab

Player stats tab

Use:

Filter chips:

All maps / Ancient

T-side / CT-side

Pistols / Gun rounds

FACEIT does this well.

B. URL reflects state

Example:

/player/spirrde?map=ancient&tab=utility


This enables:

Sharing

Coaching

Analysis outside the site

7. What I’d do first (priority order)

If you want maximum impact with minimal dev cost:

Player card → category tabs

Map cards → “View details” modal

Match page → round flow matrix

Tooltips & “vs team average” deltas

These alone will make Kanaliiga feel closer to HLTV + Leetify combined, but with a league-specific identity.

8. If you want, next steps

I can:

Sketch wireframes (low or high fidelity)

Propose exact component layouts (React-friendly)

Help define stat thresholds & color logic

Audit mobile UX (very important for player stats)

Just tell me:
👉 player page, map page, or match page first?
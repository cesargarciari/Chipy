---
name: Chipy
description: An NBA career simulator styled like a darkened arena with one spotlight on the decision that matters.
colors:
  amber: '#f97316'
  amber-soft: '#fb923c'
  court-950: '#0a0a0b'
  court-900: '#131316'
  court-800: '#1d1d22'
  court-700: '#2a2a31'
  court-600: '#3b3b45'
  ink: '#ececf1'
  ink-dim: '#a1a1ad'
  gain: '#34d399'
  loss: '#fb7185'
  loss-strong: '#f43f5e'
  signal: '#38bdf8'
typography:
  display:
    fontFamily: "Anton, 'Arial Narrow', system-ui, sans-serif"
    fontSize: 'clamp(2rem, 5vw, 3.75rem)'
    fontWeight: 400
    lineHeight: 1
    letterSpacing: '0.02em'
  headline:
    fontFamily: "Anton, 'Arial Narrow', system-ui, sans-serif"
    fontSize: '1.25rem'
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: '0.02em'
  title:
    fontFamily: "Anton, 'Arial Narrow', system-ui, sans-serif"
    fontSize: '1.5rem'
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: '0.025em'
  condensed:
    fontFamily: "'Barlow Condensed', system-ui, sans-serif"
    fontSize: '1rem'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '0.01em'
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 'normal'
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: '0.6875rem'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '0.1em'
  mono:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize: '1.125rem'
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 'normal'
    fontFeature: 'tnum'
rounded:
  lg: '0.5rem'
  xl: '0.75rem'
  2xl: '1rem'
  full: '9999px'
spacing:
  '3': '0.75rem'
  '4': '1rem'
  '5': '1.25rem'
  '6': '1.5rem'
  '8': '2rem'
components:
  button-primary:
    backgroundColor: '{colors.amber}'
    textColor: '{colors.court-950}'
    rounded: '{rounded.lg}'
    padding: '0 1.25rem'
    height: '2.75rem'
  button-primary-hover:
    backgroundColor: '{colors.amber-soft}'
    textColor: '{colors.court-950}'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '0 1.25rem'
    height: '2.75rem'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-dim}'
    rounded: '{rounded.lg}'
    padding: '0 1.25rem'
    height: '2.75rem'
  card:
    backgroundColor: '{colors.court-900}'
    textColor: '{colors.ink}'
    rounded: '{rounded.2xl}'
    padding: '1.5rem'
  choice-card:
    backgroundColor: '{colors.court-900}'
    textColor: '{colors.ink}'
    rounded: '{rounded.2xl}'
    padding: '1.25rem'
  stat-tile:
    backgroundColor: '{colors.court-900}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '0.375rem 0.25rem'
  stat-tile-active:
    backgroundColor: 'rgba(249,115,22,0.10)'
    textColor: '{colors.amber}'
    rounded: '{rounded.lg}'
    padding: '0.375rem 0.25rem'
  input:
    backgroundColor: '{colors.court-800}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '0.625rem 0.75rem'
  chip:
    backgroundColor: '{colors.court-700}'
    textColor: '{colors.ink-dim}'
    rounded: '{rounded.full}'
    padding: '0.125rem 0.5rem'
  chip-accent:
    backgroundColor: 'rgba(249,115,22,0.20)'
    textColor: '{colors.amber}'
    rounded: '{rounded.full}'
    padding: '0.125rem 0.5rem'
---

# Design System: Chipy

## Overview

**Creative North Star: "The Arena at Night"**

Chipy looks like an NBA arena hours before tip: the bowl is dark, the seats are
black, and a single sodium lamp throws one warm pool of light onto the floor.
That pool is the accent. Everything else, every surface, border, and label, sits
back in the shadow so the one thing that matters on a screen, the decision, the
number that just moved, the trophy under the light, reads instantly. The system
is disciplined and quiet by default and only goes loud at the beat that earns it.

The register is editorial, not arcade. Think a sports magazine's full-page
feature more than a game menu: generous negative space, a single confident
accent, and typography doing the hierarchy work. Condensed display caps
(Anton) behave like scoreboard and jumbotron type; a monospaced, tabular
numeral set reads like a broadcast stat bug. Cards are layered dark panels with
a soft ambient shadow and a faint backdrop blur, so the interface feels like
stacked physical placards rather than flat rectangles. Restraint is the through
line: the accent is a spotlight, and a spotlight everywhere is just daylight.

The one sanctioned exception is the gala award takeover: when a headline honour
lands (MVP, a ring, Finals MVP, a medal) the house lights drop and a full-screen
panel presents the hardware under a gold glow. Even then it stays composed,
centered, one trophy, one headline, one line of flavour, not a confetti storm.
Chipy is confident enough to whisper for ten screens and only raise its voice on
the eleventh.

**Rejected:** neon and casino energy; gradient-heavy "gamer" styling (glowing
buttons, rainbow fills); flat pastel illustration and friendly rounded mascots;
generic SaaS-dashboard neutrality.

**Key Characteristics:**

- One accent (Broadcast Ember) on a near-black arena-shadow neutral ramp.
- Anton condensed caps for anything that should read like a scoreboard.
- Monospaced tabular numerals for every stat, dollar figure, and score.
- Layered dark panels: soft ambient shadow plus backdrop blur, borders always.
- Calm by default; the gala takeover is the only place the system shouts.
- Motion is opacity-only and always optional.

## Colors

A single warm accent held against a cool near-black ramp, with three borrowed
signal colors that only ever speak in their fixed roles.

### Primary

- **Broadcast Ember** (`#f97316`): the sodium-lamp accent and the entire
  emphasis system. Primary buttons, active nav, focus rings, the lit stat tile,
  every "this moved" and "this matters" mark, the scenario strand, the gala
  glow. Used on a small fraction of any screen on purpose.
- **Ember Glow** (`#fb923c`): the lighter partner. The primary button's hover
  fill, and one end of the few sanctioned accent gradients (the gala rail, the
  gala CTA, the idol-tier idolatry bar).

### Secondary

- **Signal Blue** (`#38bdf8`): a cool counter-accent with a narrow brief:
  milestone recap beats, the second-ranked skill on the stat strip, a
  conference-finals result, a DPOY mark, mid-tier idolatry progress. Never a
  general-purpose accent, never competing with Ember for the eye.

### Tertiary

- **Gain Green** (`#34d399`): positive only. A stat delta that went up, a good
  scenario outcome, the bank figure, a season graded A.
- **Loss Red** (`#fb7185`) and **Rim-Out Red** (`#f43f5e`): negative and
  danger. A stat delta that dropped, a `−$M` chip, a season graded D, a severe
  injury, and the hover state of a destructive option (retire, demand a trade).
  Rim-Out Red is the stronger stroke for input errors and the sharpest warnings.

### Neutral (the Court Shadow ramp)

- **Rafters Black** (`#0a0a0b`, `court-950`): the page ground and the darkest
  scrims. The unlit top of the bowl.
- **Panel** (`#131316`, `court-900`): every card, choice card, stat tile, and
  modal body. The default surface.
- **Sub-Panel** (`#1d1d22`, `court-800`): inputs, nested boxes, neutral tag
  backgrounds, progress-bar tracks.
- **Rail** (`#2a2a31`, `court-700`): the standard border and divider, and the
  neutral chip fill.
- **Grey Rail** (`#3b3b45`, `court-600`): input borders, the scrollbar thumb,
  the faintest structural lines.
- **Chalk** (`#ececf1`, `ink`): primary text and active numerals.
- **Grandstand Grey** (`#a1a1ad`, `ink-dim`): secondary text, labels, captions,
  resting icon color. Most words on screen are this, not Chalk.

### Named Rules

**The One Lamp Rule.** Broadcast Ember covers no more than roughly 10% of any
screen. If two things are both amber, one of them is wrong. Rank with Chalk,
Grandstand Grey, and weight before you reach for the accent.

**The Fixed-Meaning Rule.** Green is only "up / good", red is only "down / bad /
danger", blue is only "secondary signal". Never use any of the three
decoratively or to fill a neutral surface.

**Hardware Gold is not in the palette.** The gold gradient
(`#f7e3a1 → #f5c04e → #b8860b`, the `.text-gold-gradient` treatment) exists for
exactly one thing: the badge and rail of the gala award takeover. It never
appears in the main flow.

## Typography

**Display Font:** Anton (with `'Arial Narrow'`, `system-ui`, sans-serif). Loaded
from Google Fonts, single weight 400.
**Body Font:** the platform UI sans stack (`ui-sans-serif, system-ui,
-apple-system, 'Segoe UI', Roboto, Helvetica, Arial`).
**Numerals:** the platform monospace stack (`ui-monospace, SFMono-Regular,
Menlo, Consolas`), always with `tabular-nums`.
**Condensed (reserved):** Barlow Condensed (600/700) is loaded and defined as
`--font-condensed`, but no component uses it yet. It is the sanctioned face if a
future surface needs condensed body or label text that Anton is too heavy for.

**Character:** Anton is a single-weight, ultra-condensed grotesque: it looks like
arena signage and scoreboard type, all caps or title case, never for running
text. Against it, a plain system sans keeps the reading text invisible and fast,
and a monospaced tabular figure set makes every stat line up like a box score.
The pairing is "jumbotron over newsprint over stat bug".

### Hierarchy

- **Display** (Anton 400, `clamp(2rem, 5vw, 3.75rem)`, line-height 1): the home
  hero, the big HUD Overall, the legacy grade letter (`text-6xl`). Set tight,
  `tracking-tight` or `tracking-wide` depending on size.
- **Headline** (Anton 400, ~1.25rem / `text-xl`, line-height 1.15): `CardTitle`
  and section headers (`h2`). Weight utilities like `font-bold` are nominal on
  Anton; the face carries the emphasis.
- **Title** (Anton 400, ~1.5rem / `text-2xl`, line-height 1.1): the choice-card
  name and the scenario-frame question. The scenario question is set
  **italic** (a synthesized slant, deliberate) to read as "the moment".
- **Body** (system sans 400, 0.875rem / `text-sm`, line-height 1.5): all prose.
  Usually Grandstand Grey; Chalk only for the sentence that must land (a verdict,
  a recap headline). Meta text drops to `text-xs`.
- **Label** (system sans 700, 0.625–0.6875rem / 10–11px, uppercase): kickers,
  field labels, stat-tile captions, HUD line labels. Letter-spacing runs wide,
  from `0.05em` up to `0.35em` on the gala kicker. Always Grandstand Grey unless
  it is an accent kicker.
- **Numeral** (mono 700, `tabular-nums`): every rating, score, dollar amount,
  seed, percentage, and count. Sizes from `text-[9px]` deltas to `text-lg` on
  the stat tiles.

### Named Rules

**The Scoreboard Rule.** If a value is a number the player is meant to compare
(a rating, money, a seed, a grade score), it is set in the mono tabular face,
not the body font. Numbers that are part of a sentence stay in body text.

**The Anton-Never-Reads Rule.** Anton is for labels, names, headlines, and
numbers under ~6 words. It never sets a sentence, a blurb, or help text.

## Layout

**The column.** One centered column, `max-w-3xl` (48rem), `px-4`, as a
`min-h-dvh` flex stack: header, `main`, footer. There is no sidebar and no
multi-column page shell. The product is desktop-first in usage but the column
never widens past 48rem; the extra desktop room is margin, which is the point.

**Breakpoints.** Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px. The
layout is authored mobile-up. Most responsive steps are a single grid going from
one column to two at `sm` (choice options, create-player fields, legacy
radar-plus-stats), occasionally three at `md`/`lg` (college programs, the perks
grid).

**Spacing rhythm.** A 4px base scale. The recurring steps: `0.75rem` inside
chips and tight clusters, `1rem` between blocks on the play screen, `1.25rem`
for card and frame padding, `1.5rem`/`2rem` for card inner padding
(`p-6 sm:p-8`) and page-level section gaps. Vertical rhythm is set with
`space-y-*` on a wrapper, not margins on children.

**Density.** Comfortable, not dense. The play screen shows at most a HUD, a
context card, and the question at once. The one genuinely dense element is the
stat-tile strip (7 skill tiles plus athleticism and durability in a scrolling
row), and the season-by-season table, which is deliberately tabular and
collapsed behind a toggle by default.

**Tables and overflow.** Wide content never wraps or shrinks to fit: season and
overseas tables set a `min-w-[...]` and live inside `overflow-x-auto`, and the
stat strip scrolls horizontally on narrow screens rather than reflowing.

**Modals.** Full-viewport `fixed inset-0` with a `court-950/70`–`/90` scrim and
`backdrop-blur-sm`. The perks shop uses the mobile-sheet pattern (`items-end`,
`rounded-t-2xl`, `max-h-[85dvh]`) upgrading to a centered dialog at `sm`. The
gala takeover is always centered, `max-w-md`.

## Elevation & Depth

Layered dark panels. Depth is a constant, gentle stack, not a hover reward. Every
`Card` carries `shadow-xl` at `black/40` plus `backdrop-blur` over a slightly
translucent `court-900/80` fill, so panels read as physical placards floating a
few millimetres above the arena floor. Choice cards, stat tiles, and the
scenario frame are flatter (a 1px `court-700` border, no drop shadow), and rely
on the Court Shadow value steps and the border for separation. Hover does not
add elevation; it shifts the border to Ember and washes the fill with about 4%
Ember. The one dramatic shadow in the system is the gala panel's amber bloom
(`0 0 80px -16px rgba(249,115,22,0.5)` with a `ring-1 ring-amber/40`), which is
light, not lift.

### Shadow Vocabulary

- **Panel ambient** (`box-shadow: var(--tw-shadow-xl)` at `rgb(0 0 0 / 0.4)`):
  every `Card`. Pair with `backdrop-blur` and a `/80` fill. This is the only
  ambient shadow; use it for anything that is a "card".
- **Gala bloom** (`box-shadow: 0 0 80px -16px rgba(249,115,22,0.5)` plus
  `ring-1` at `rgba(249,115,22,0.4)`): the award takeover panel only.
- **Trophy lift** (`drop-shadow: 0 4px 10px rgba(0,0,0,0.5)` on the shelf,
  `0 10px 24px rgba(0,0,0,0.6)` on the gala trophy): applied to trophy artwork
  so the objects sit on the shelf, never to UI chrome.

### Named Rules

**The Light-Not-Lift Rule.** Elevation changes come from border and tonal value.
When the system wants to make something feel important it adds _light_ (an Ember
border, the gala glow), never a bigger shadow.

## Shapes

Rounded, tactile, and consistent. Four radii do all the work:

- **`rounded-lg` (0.5rem):** the control radius. Buttons, inputs, stat tiles,
  the perks cart button, small toggles, tags-that-are-not-pills.
- **`rounded-xl` (0.75rem):** nested boxes inside a card (the college callout,
  the moment-card glyph box, perk tiles).
- **`rounded-2xl` (1rem):** the container radius. Every `Card`, choice card,
  scenario frame, and modal body.
- **`rounded-full`:** pills and circles only. Status chips, award chips, the
  idolatry track and fill, the "Gold" badge, the trade-risk pill, the logo mark,
  avatars, notification dots.

Borders are near-universal: a 1px `court-700` line on almost every surface, going
to `court-600` on inputs and to Ember on hover/active. Corners are never sharp
(no `rounded-none`) and never a fifth arbitrary radius. The recurring non-rounded
silhouette is the vertical **strand**: a 3px full-height bar down the left edge
of a scenario choice card, and a 1px full-width gradient bar across the top of
the scenario frame and the gala panel, tinted to the scene's accent.

## Components

Buttons, cards, inputs, and tiles feel tactile and confident: solid fills where
they matter, a clear hover shift, tight radii, real borders. Components have
weight; they are not ghostly.

### Buttons

- **Shape:** `rounded-lg` (0.5rem), `inline-flex`, centered content, `gap-2` for
  an icon.
- **Primary:** Broadcast Ember fill, Rafters Black text, `font-semibold`. Hover
  fills Ember Glow. Sizes: `sm` h-9 / `px-3`, `md` (default) h-11 / `px-5`,
  `lg` h-14 / `px-8`. This is the only filled button.
- **Outline:** transparent fill, `court-600` border, Chalk text, hover fills
  `court-800`. The secondary action.
- **Ghost:** no fill or border, Grandstand Grey text, hover fills `court-800`
  and lifts text to Chalk. For tertiary and in-card actions.
- **Focus (all):** `focus-visible:ring-2` Ember, `ring-offset-2` on
  `ring-offset-court-950`. Never remove it.
- **Disabled:** `opacity-50`, pointer events off.

### Chips

- **Neutral chip:** `court-700` fill, Grandstand Grey text, `rounded-full`,
  `px-2 py-0.5`, `text-[11px]` uppercase `font-semibold tracking-wide`. Status
  labels, stance tags, perk names on the legacy card.
- **Accent chip:** `amber/20` fill, Ember text, same geometry. Reserved for a
  "big" award or an earned status (Hall of Fame, contention window, shoe deal).
- **Signal chip:** `sky-500/15` or `rose-500/15` fill with matching text, for a
  milestone or a trade-risk warning respectively.
- **"Gold" badge:** solid Ember fill, Rafters Black text, `text-[10px]
font-bold uppercase tracking-widest`. Marks the once-a-career rare option.

### Cards / Containers

- **Corner:** `rounded-2xl` (1rem).
- **Background:** `court-900` at `/80`, with `backdrop-blur`.
- **Shadow:** Panel ambient (see Elevation). Nested boxes inside a card drop the
  shadow and use `court-800/50` on a `court-700` border.
- **Border:** 1px `court-700`, always.
- **Padding:** `p-6 sm:p-8` for a top-level `Card` body; `p-5` for the scenario
  frame and choice cards; `p-3` for perk tiles and inline callouts.

### Inputs / Fields

- **Style:** `court-800` fill, 1px `court-600` border, `rounded-lg`,
  `px-3 py-2.5`, Chalk text, no default outline.
- **Label:** an 11px uppercase Grandstand Grey `<span>` stacked above the field
  with `space-y-1.5`.
- **Focus:** border shifts to Ember (`focus:border-amber`); no glow.
- **Error:** border shifts to Rim-Out Red, with an 11px Loss Red message below.
- **Choice toggles** (position, hand, archetype): a bordered button that, when
  selected, takes a `border-amber` edge and an `amber/5`–`amber/10` fill with
  Chalk text; unselected is a `court-600` border with Grandstand Grey text.

### Navigation

- **Style:** a flat top bar inside the column, no background of its own. Left:
  the Ember circle logo mark (a black "C") plus the wordmark in a black, tight
  system-sans. Right: 2–3 text links, `text-sm font-semibold`.
- **States:** active link is Ember; inactive is Grandstand Grey lifting to Chalk
  on hover. `transition-colors` only.
- **Footer:** one line of `text-xs` Grandstand Grey, centered, carrying the
  non-affiliation disclaimer.

### Signature: the Decision Card

The core interaction (see PRODUCT.md's binding pattern). A `rounded-2xl`
`court-900` panel, `court-700` border, `p-5`, left-aligned. Contains, top to
bottom: an optional giant Anton **watermark** glyph bleeding off the
bottom-right corner at `text-[5.5rem]` in `court-800/70` (or `amber/15` when
rare); an optional team or club logo; the **title** in Anton `text-2xl`; a
`max-w-[26ch]` blurb in `text-sm` Grandstand Grey; then the **effect chips** row,
each an Anton numeral (`+8` green, `−3` red, `+$18M` Ember, `−$2M` Loss Red,
`MAX` grey when capped, with a struck-through pre-cap nominal when relevant)
followed by an 11px uppercase attribute label. Hovering or focusing the card
reports its attribute keys upward so the HUD stat strip lights those tiles Ember.
Variants: **default** (hover shifts border to Ember, fill to `amber/[0.04]`);
**accented** (a 3px left strand in amber / sky / emerald keyed to the scene, with
a matching hover border); **rare** (Ember border, `amber/[0.06]` fill, a 1px
Ember ring, the "Gold" badge); **danger** (resting `court-700` border, hover to
Rim-Out Red, muted title until hover).

### Signature: the Stat Strip

A horizontal, scrollable row of tiles, one per displayed skill (interior and
perimeter defense fold into one `DEFENSE` tile) plus athleticism and durability.
Each tile: `min-w-[4.25rem]`, `rounded-lg`, 1px border, centered, a mono
`text-lg` `tabular-nums` value over a `text-[9px]` uppercase caption. Resting
state is `court-900` / Chalk. The player's top three skills tint their value
Ember, Gain Green, Signal Blue by rank. A tile in the `highlight` set (the stats
the hovered option would move) flips to an Ember border, `amber/10` fill, Ember
text. This strip lives in the persistent `CareerHud` above (or below, as a
frame footer) every in-career decision.

### Signature: the Gala Takeover

A `z-[60]` full-viewport panel over a `court-950/90` blurred scrim. The card is
`max-w-md`, `court-950`, with a radial gold-plus-dark background wash, a 1px
Ember top rail, and the Gala bloom shadow. Content is centered: a wide-tracked
Ember kicker ("The gala / The hardware"), the award badge in Anton `text-4xl`
italic with the Hardware Gold gradient, a `Season N` line, the trophy artwork (or
a Lucide fallback icon) inside a soft radial glow, an Anton `text-2xl` white
headline ("THE BEST IN THE WORLD"), the subtitle, an italic line of flavour, and
a full-width CTA in the Ember-to-Ember-Glow gradient with Rafters Black uppercase
Anton. It steps through a season's headline moments one at a time, then unmounts.

## Do's and Don'ts

### Do:

- **Do** keep Broadcast Ember under ~10% of any screen; rank with Chalk,
  Grandstand Grey, weight, and the mono numerals first (The One Lamp Rule).
- **Do** set every comparable number (ratings, money, seeds, scores,
  percentages) in the mono `tabular-nums` face (The Scoreboard Rule).
- **Do** use Anton for names, labels, headlines, and short numbers only, and the
  system sans for every sentence and blurb (The Anton-Never-Reads Rule).
- **Do** build new surfaces as one centered `max-w-3xl` column with `space-y-*`
  rhythm and a 4px spacing scale.
- **Do** give every surface a 1px `court-700` border and one of the four radii
  (`lg` controls, `xl` nested, `2xl` containers, `full` pills).
- **Do** convey importance with light (an Ember border, the gala glow) rather
  than a heavier shadow (The Light-Not-Lift Rule).
- **Do** keep green / red / blue in their fixed meanings: up / down / secondary
  signal (The Fixed-Meaning Rule).
- **Do** make new decision content render through the Decision Card and light
  the Stat Strip; effect chips must state the exact mechanical change.
- **Do** gate every animation behind `prefers-reduced-motion` and keep entrance
  motion opacity-only, never transform or layout shift.
- **Do** let wide tables and the stat strip scroll inside `overflow-x-auto`
  with a `min-w`, never wrap or shrink.

### Don't:

- **Don't** introduce a second accent hue, a light theme, or a fifth radius. The
  app is committed dark (`color-scheme: dark`, `html.dark`), one lamp.
- **Don't** fill buttons, cards, or chips with a gradient. Gradients are only
  thin accent strands, the idolatry bar, and the gala rail/CTA/wash. Flat fills
  everywhere else (the anti-reference is gradient-heavy "gamer" UI).
- **Don't** use the Hardware Gold gradient anywhere outside the gala takeover.
- **Don't** reach for neon, glow buttons, casino energy, confetti, or cartoon
  mascots. When the system celebrates, it does it once, centered, and composed.
- **Don't** add drop shadows to UI chrome for emphasis, or add elevation on
  hover. Hover shifts border and fill tint, nothing else.
- **Don't** set body copy, blurbs, or help text in Anton, and don't set
  comparable numerals in the body sans.
- **Don't** widen the column past `max-w-3xl` or add a persistent sidebar; the
  desktop breathing room is intentional.
- **Don't** remove the `focus-visible` Ember ring from any interactive element.
- **Don't** show a raw team or award trademark as if official; artwork is an
  optional drop-in over emoji or Lucide fallbacks.

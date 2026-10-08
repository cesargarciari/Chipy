---
name: Chipy
description: An NBA career simulator in a calm, flagship style. Lights down, ball up, one call at a time.
colors:
  ground-dark: '#110e0c'
  raised-dark: '#1a1614'
  float-dark: '#221e1b'
  ink-dark: '#f3ede9'
  accent-dark: '#f3934a'
  on-accent-dark: '#21110a'
  gold-dark: '#e5bf6d'
  up-dark: '#72d699'
  down-dark: '#f47b74'
  cool-dark: '#87c3e7'
  ground-light: '#f5f3f1'
  raised-light: '#fcfbfa'
  float-light: '#ffffff'
  ink-light: '#1b1511'
  accent-light: '#c14900'
  accent-ink-light: '#ab4400'
  on-accent-light: '#fefbf8'
  gold-light: '#8a6000'
  up-light: '#0b7643'
  down-light: '#be2f2c'
  cool-light: '#0e6a9b'
typography:
  display:
    fontFamily: 'Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.875rem, 1.35rem + 1.9vw, 2.75rem)'
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: '-0.03em'
  jersey:
    fontFamily: 'Archivo (font-stretch 70%)'
    fontSize: '1.75rem to 4.25rem'
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: '0.012em'
    textTransform: uppercase
  numeral:
    fontFamily: 'Archivo (font-stretch 78%)'
    fontWeight: 500
    fontFeature: 'tnum'
  voice:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontStyle: italic
    fontWeight: 400
    letterSpacing: '-0.015em'
  body:
    fontFamily: 'Archivo'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Archivo'
    fontSize: '0.6875rem'
    fontWeight: 500
    letterSpacing: '0.07em'
    textTransform: uppercase
    color: 'ink at 62%'
rounded:
  control: '9999px'
  tile: '1rem'
  card: '1.75rem'
  sheet: '2.25rem'
spacing:
  base: '4px'
  stage-gap: '2.25rem'
  section: '6rem to 9rem'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.on-accent}'
    rounded: '{rounded.control}'
    height: '2.75rem (md), 3.5rem (lg)'
  button-secondary:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    border: 'inset ring, ink at 16%'
    rounded: '{rounded.control}'
  surface:
    backgroundColor: '{colors.raised}'
    border: 'inset ring, ink at 7%, plus a 1px top rim in the dark'
    rounded: '{rounded.card}'
  decision-card:
    backgroundColor: '{colors.raised}'
    hoverBackground: '{colors.float}'
    rounded: '{rounded.card}'
    padding: '1.5rem'
---

# Design System: Chipy

## Overview

**North Star: "Lights down, ball up."**

The page is quiet so the decision can speak. One ground, one ink used at a ladder of
opacities, and the colour of ball leather for the one action that matters on a screen.
Basketball is suggested, never shouted: hairline court markings drawn to real NBA
proportions sit faintly behind the home greeting, the Finals question and the legacy card;
game content is set in narrow jersey lettering; every number is a scoreboard numeral; the
create screen shows the back of your jersey with the name arched across the shoulders.

Chipy ships a dark and a light theme from one token set. Dark is a warm near-black arena
with the house lights down. Light is a pale maple floor in daylight. Both follow the same
rules, and the special buttons are the brightest thing in either.

The register is a flagship product page crossed with a fashion-magazine sports feature
(the tunnel walk, not the arcade): light headline weights, generous space, pill controls,
soft shadows only on floating layers, and a Didone italic voice for the human moments.

**Rejected:** neon and casino energy, gradient-heavy gamer UI, glowing buttons, card grids
of icon + title + blurb, eyebrow labels above headings, gradient text, emoji as icons,
coloured side stripes on cards.

## Colors

Tokens live in `apps/web/src/index.css` as `light-dark()` pairs on `:root` and are exposed to
Tailwind through `@theme inline` as `ground`, `raised`, `float`, `ink`, `accent`,
`accent-ink`, `on-accent`, `gold`, `up`, `down`, `cool`. Tailwind's default palette is
switched off (`--color-*: initial`), so only these exist.

- **Ground / Raised / Float:** the page, surfaces one step up, and floating layers (sheets,
  the gala, the echo pill, the theme knob).
- **Ink:** the only text colour. Hierarchy comes from opacity: 100 primary, 65 secondary,
  60 for small supporting text (the AA floor in light mode), lower only for decoration.
  Borders are ink at 6 to 16%.
- **Accent (ball leather):** primary button fill, the lit stat tile, the selected ring, the
  commit ghost. `accent-ink` is the darker light-mode variant for accent-coloured text.
  Keep it to a few small places per screen.
- **Gold (hardware):** trophies, grade S, idol and legend tiers, headline award chips, the
  once-a-career option. Never on general UI.
- **Up / Down / Cool:** fixed meanings. Up is a gain, down is a loss or danger, cool is a
  secondary signal (grade B, conference finals, DPOY).

**The flip.** One section per page may invert the scheme with `.scheme-flip` (the home
tagline band). Tokens are re-declared on `.scheme-flip` so they resolve against its own
`color-scheme`, which also survives Lightning CSS polyfilling `light-dark()` in the build.

**Theme choice.** `store/theme.ts` holds `system | light | dark` (persisted as
`chipy.theme`); `index.html` applies a saved choice before first paint. The header switch is
a checkbox, not a button (see the e2e note under Motion). Image export and the radar read
hex copies from `lib/palette.ts`, because html-to-image cannot resolve CSS variables.

## Typography

- **Archivo** (variable, width 62 to 125, weights 400 and 500 only). One family carries
  everything: calm grotesk for chrome, narrow widths for the basketball voice.
- **Display** (`t-display`, `t-title`): weight 400, tight tracking, sentence case, headlines
  end with a period. For chrome copy only.
- **Jersey** (`t-jersey`): Archivo at 70% width, 500, uppercase. Engine titles and option
  labels arrive in caps, so they are set like lettering on a jersey. `Stage` detects an
  all-caps title and switches to this voice automatically.
- **Numerals** (`t-num`): 78% width, tabular. Every rating, dollar figure, seed, grade and
  count.
- **Voice** (`t-voice`): Bodoni Moda italic, used rarely: the home greeting, last season's
  recap, the legacy verdict, the gala flavour line, the sample call's outcome.
- **Label** (`t-label`): 11px uppercase data labels on the HUD and tables. Never above a
  heading.

## Layout

- Pages own their width inside a full-bleed `main`: play and create are `max-w-6xl`,
  legacy `max-w-5xl`, leaderboard `max-w-4xl`.
- **Play:** a two-column grid on large screens. The decision stage on the left, the
  `PlayerCard` sticky on the right. On small screens the card sits above the stage and the
  ratings become a horizontally scrolling strip. Every responsive grid declares
  `grid-cols-1` below its breakpoint so a scrolling child can't widen the page.
- **Stage:** preface (last season's recap), title, prompt, then options in a two-column
  `ChoiceGrid`; an odd last card spans the row.
- **Home:** greeting hero under the center circle, a playable sample call beside its
  statement, a ledger of three promises, one flipped band, quiet footer.

## Elevation and shape

- Pills for every control. Cards 1.75rem, sheets and the gala 2.25rem, tiles 1rem.
- Surfaces are flat: raised fill, a 7% inset hairline, and a 1px top rim in the dark.
- Shadows (`shadow-lift`, `shadow-float`) are tinted with the ink and reserved for things
  that float: hovered cards, the echo pill, sheets, the gala, the primary button.

## Motion

One grammar: things arrive a few pixels low and slightly out of focus, then sharpen
(ease-out-quint, `--ease-out`).

- **The deal.** Each decision is a scene: preface, title, prompt, then options dealt 70ms
  apart (`.enter`, `.deal`, `.deal-face`, indexed by `--i`).
- **The lock-in.** Committing a choice clones the card face into a fixed, inert ghost that
  rings in the accent, lifts and dissolves (`lib/commitGhost.ts`) while the next scene
  arrives. It never blocks input.
- **The consequence.** The "Last call" pill squashes in, changed ratings flash and show
  `+N`, bars slide and numbers roll (`RollingNumber`). The player card stays mounted
  between decisions so this reads as change, not replacement.
- **The gala.** Scrim fades, panel sharpens, the trophy rises last with one gold light
  sweep.
- **Rules.** A pickable `<button>` and its ancestors only animate opacity and filter; any
  movement lives on an inner face. Playwright waits for a stable bounding box before every
  click, and the e2e walk clicks the first button on each screen about 200 times, so a
  moving button would slow or break it. Fill mode is `backwards`, so hover owns the end
  state. Under `prefers-reduced-motion`, entrances become short fades and the ghost, rise
  and sweep are skipped.

## Do and don't

- **Do** keep the accent scarce and the gold for hardware.
- **Do** set comparable numbers in `t-num` and engine titles in `t-jersey`.
- **Do** portal any overlay opened from inside the sticky `PlayerCard` (its stacking context
  otherwise traps it under the stage). The gala stays inline before the options, because the
  e2e walk must hit its button first.
- **Don't** add a `<button>` to the header or before the options on a play screen.
- **Don't** use emoji or unicode glyphs as icons; use lucide.
- **Don't** add eyebrow labels, gradient text, coloured side stripes, or glow.
- **Don't** introduce a second accent hue or new grey hex values; use ink opacity.

The wordmark keeps its committed form (a leather-orange circle holding a dark "C", which
doubles as the ball's seam), with "Chipy" set in Archivo 500 at tight tracking.

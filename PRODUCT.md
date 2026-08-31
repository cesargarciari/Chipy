# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: recruiters and hiring managers** evaluating Chipy as a portfolio
piece. They open it briefly, usually on desktop, and judge craft, architecture,
and polish. The README frames the project as an AWS Solutions Architect practice
project and a portfolio piece. Design serves this reading first: every surface
should hold up to a close, skeptical look.

**Co-primary: sports-sim and NBA fans** who want a fast, replayable narrative
career. They run a whole career in one sitting: build a prospect, then make one
headline decision each offseason from the summer circuit to retirement, and read
the legacy screen at the end. The game has to actually be good, not just look
finished.

Play context is desktop-first: longer sessions at a computer, with room for the
HUD, season tables, and the trophy case. The layout is a single responsive
column that already works down to phone widths, so mobile is a supported
fallback, not the design target.

## Product Purpose

Chipy is a single-player NBA career simulator. You build one prospect (position,
position-locked archetype, jersey number, birth country, shooting hand), then
steer a full career: prologue (high school + recruiting), a real college program
with an interactive freshman year, the draft, a landing spot, a multi-season pro
loop, optional EuroLeague years with a route back, and a chosen exit. Every
offseason is one decision drawn from a themed, data-driven scenario library, or
free agency on a contract year. It ends on a legacy screen: a career summary
card, a season-by-season table, an injury record, a horizontal trophy case, and
a Hall-of-Fame verdict, copyable as an image.

It exists to be two things at once: evidence of high-craft, well-architected
work for a reviewer, and a genuinely replayable career sim with a wide outcome
spread. Success is both: the product reads as excellent to someone judging it,
and a role-player career feels as worth finishing as a Hall-of-Fame one. It runs
entirely on the player's machine today; an AWS deployment at near-zero cost is a
later milestone.

## Positioning

Things a neighboring career-sim could not truthfully copy:

- **One deterministic engine on both sides.** `@chipy/engine` is a pure function
  of `(seed, profile, choices)`, seeded `mulberry32`, zero runtime deps beyond
  `zod`. The browser runs it for instant offline play; the API runs the same
  function from the same stored inputs and treats its own output as the source
  of truth. Replaying a career from its recorded `choices` reproduces a
  byte-identical `CareerSummary`.
- **The card tells the truth.** Prologue, college, season, mid-season, perks, and
  free-agency decisions all use one `GameOption` shape rendered as a bold framed
  decision card ("El Idolo" style) with explicit `+N ATTRIBUTE` and `plus or
minus $M` effect chips, plus a persistent stat strip and money bar that light
  the tiles an option would move. No RNG on choice effects: the card promises
  exactly what you get.
- **Depth as data.** New season content is a single appended object in
  `packages/engine/src/season/scenarios/<theme>.ts`. No code wiring. Perks and
  mid-season forks reuse the same option model.
- **Divergence by design.** A hidden per-career `talent` ceiling, gated by draft
  slot and squared into the growth formula, means most careers plateau as role
  players and a few break out. The spread of outcomes is the product.

## Operating Context

- A career is one variable-length run in a web browser:
  create → prologue → college → draft → landing spot → season loop → optional
  overseas → farewell or quiet exit → legacy.
- Web routes: `/` (home and resume), `/create`, `/play`, `/legacy`,
  `/c/:id` (shared career), `/leaderboard`.
- The API, when reachable, backs three features only: saving a finished career
  (returns a `/c/<id>` share link and "N% of players also chose X" aggregates),
  the monthly leaderboard, and per-choice tallies. Each fails soft; the game
  never blocks on the backend.
- Repo: pnpm + Turborepo monorepo, TypeScript strict ESM, Node 22.
  `pnpm dev` runs the API on :3000 and web on :5173; DynamoDB Local runs under
  docker compose.
- Definition of done: `pnpm format:check && pnpm lint && pnpm typecheck &&
pnpm test`, in that order. Engine changes also require
  `pnpm --filter @chipy/engine test:coverage` (80/80/70/80). Career-loop or
  UI-flow changes also require `pnpm e2e` (Playwright plays a whole career with
  no backend).
- Significant decisions get a numbered Nygard ADR in `docs/adr/`.

## Capabilities and Constraints

- **Engine determinism is a hard invariant.** Replay from recorded `choices`
  must reproduce a byte-identical `CareerSummary`; node resolution consumes no
  main-stream RNG. `ENGINE_VERSION` (currently `4.19.0`) is bumped whenever a
  rules change could make a persisted `choices` array un-replayable.
- **Engine is pure:** no IO, DOM, filesystem, or clock; randomness only via the
  seeded `rng`. Never `Date.now()` or `Math.random()`.
- **`@chipy/shared` owns the HTTP contract** (zod schemas plus inferred DTOs).
  The API validates every boundary with zod and never trusts the client: it
  replays the engine from stored inputs and persists only a `complete` result.
- **Content model:** 8 ratings; 30 position-locked archetypes (six per
  position), each pure data (rating bias, growth weights, award affinities);
  30 real NBA teams as one swappable data file; the EuroLeague as a full
  parallel league with its own clubs and trophies.
- **Binding interaction pattern (confirmed):** every choice is a framed
  decision card with explicit `+N ATTRIBUTE` / `plus or minus $M` effect chips
  and a persistent stat strip and money bar that light the tiles an option
  moves. This survives any redesign.
- **Current, non-binding visual facts** a redesign may revisit: a single
  committed dark "arena at night" theme (amber on court-black, Anton and Barlow
  Condensed display type, no light mode); the UI runs on emoji glyphs by
  default with optional real-art drop-in.
- **No escape hatches:** zero `any`, `@ts-ignore`, or `eslint-disable` in the
  repo. Strict ESM: `engine` and `api` relative imports carry the `.js`
  extension; `web` does not.
- **Terminology:** prospect, archetype, talent (hidden ceiling), the season
  loop, scenario, mid-season fork, perks shop, landing spot, contender rating,
  idolatry, status tier, trade risk, farewell tour, legacy screen, trophy case.

## Brand Commitments

- **Name: Chipy.** Wordmark is an amber circle holding a black "C", with "Chipy"
  set in a heavy, tight-tracked sans.
- **Voice:** terse, second person, present tense, sports-broadcast cadence
  ("One prospect. Fifteen years. Your calls." / "a jersey in the rafters").
  Effect chips read as lowercase stat callouts.
- **Inspirations, non-binding references:** Copero's _simulador-carrera_ and
  Potrero's _El Idolo_ (the bold decision-card treatment).
- **Not affiliated with or endorsed by the NBA.** The footer states this.
  Trademarks belong to their owners; the project ships stylised or emoji marks
  and expects anyone publishing it to supply their own.
- **License:** MIT (stated in the README; no `LICENSE` file committed yet).

## Evidence on Hand

- **The running game is the demo.** A full client-side career, create to legacy,
  is playable now with no backend, and is covered end to end by Playwright.
- `docs/architecture.md`, `docs/cost.md`, and Nygard ADRs `0001` through `0007`.
- Partial real art in `apps/web/src/assets/{teams,awards,clubs}/`; everything
  missing falls back to emoji. No official logos.
- **No real users, testimonials, reviews, benchmarks, or usage data.** The
  leaderboard and the "N% of players also chose X" aggregates are real features
  with no population behind them yet. Future work must not fabricate players,
  quotes, counts, or deployment claims.
- Not yet deployed to AWS (that is Milestone 2).

## Product Principles

1. **Reviewer-legible craft first.** The primary user is judging quality. Every
   surface holds up to a close look, and the architecture story (one
   deterministic engine on both sides, one zod contract, content as data) should
   be legible in how the product behaves, not just in the README.
2. **The card tells the truth.** A decision always shows its exact mechanical
   effect before you commit. No hidden RNG on choice effects, no consequence the
   card did not name.
3. **Offline is the baseline; the backend is a bonus.** The whole career runs
   client-side. Save, share, and leaderboard are additive, and each fails soft.
4. **Careers diverge, and that is the point.** A role-player career should feel
   as legible and as worth finishing as a Hall-of-Fame one. Do not design toward
   a single ideal arc.
5. **Depth grows without code.** Scenarios, perks, and forks are data files. The
   product's depth scales by appending content, and the UI must render new
   content with no per-item wiring.

## Accessibility & Inclusion

No formal conformance level has been committed (an open decision). Current
behavior to preserve: all decorative motion is opacity-only and disabled under
`prefers-reduced-motion`, and interactive elements use `:focus-visible`
affordances. The single-column layout is readable from phone widths up.

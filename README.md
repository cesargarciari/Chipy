# Chipy

An NBA career simulator. Build a prospect — position, **position-locked
archetype**, jersey number, birth country — then steer a **full career** from the
summer circuit to a jersey in the rafters: pick a college program and play an
**interactive freshman year**, get drafted, choose your landing spot, and make
**one decision every offseason** from a library of varied, one-off scenarios
(each shown El Idolo–style: a bold card with explicit `+8 FINISHING` effect
chips). A persistent **stat strip + money bar** sits above every call, lighting
up the tiles an option would move. Run a **career economy** — salary, market
value, a bank — and spend it in a **browsable perks shop** (private chef,
shooting trainer, personal court, analytics group…). Field bigger free-agency
offers, weather **injuries** and **bizarre mid-season forks** (fight the star →
defer, or force a trade), sign a **shoe deal** at fame 80+, and when the NBA
stops calling, rebuild your career as a **EuroLeague** centrepiece and earn your
way back. Attributes grow on an age curve gated by hidden talent; seasons play
out with awards (All-NBA, DPOY, MVP, scoring titles), playoff runs, rings, and
Olympic medals weighted by your country's pedigree. It ends on a
**legacy screen** — trophy case, career totals, career earnings, a Hall-of-Fame
verdict. Inspired by Copero's _simulador-carrera_ and Potrero's _El Idolo_.

Built as an AWS Solutions Architect practice project and a portfolio piece —
local-first now, deployed to AWS at near-zero cost later.

**Status: full career-mode simulation, running entirely on your machine.**

## Stack

| Layer           | Choice                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------ |
| Language / repo | TypeScript (strict, ESM), pnpm + Turborepo monorepo                                        |
| Simulation      | `@chipy/engine` — pure, deterministic, zero runtime deps beyond `zod`; Vitest + fast-check |
| Contract        | `@chipy/shared` — one set of zod schemas for the HTTP API, used by both apps               |
| Web             | Vite + React 19, Tailwind v4, Zustand, TanStack Query, React Router                        |
| API             | Fastify 5, `fastify-type-provider-zod`, pino; Lambda-ready (`@fastify/aws-lambda`)         |
| Data            | DynamoDB (on-demand) single-table via `@aws-sdk/lib-dynamodb`; DynamoDB Local for dev      |
| Infra (M2)      | Terraform → S3 + CloudFront, API Gateway HTTP API + Lambda, DynamoDB, CloudWatch           |
| CI              | GitHub Actions: typecheck · lint · test · build · Playwright                               |

See [`docs/architecture.md`](docs/architecture.md), [`docs/cost.md`](docs/cost.md),
and the [ADRs](docs/adr/).

## Prerequisites

- **Node 22** (`.nvmrc`) and **pnpm** via Corepack: `corepack enable`
- **Docker** + Docker Compose (for DynamoDB Local)
- Terraform CLI is **not** needed for Milestone 1.

> This repo pins `packageManager: pnpm@9.15.4`, which overrides any global
> package-manager config for this directory.

## Quickstart

### Option A — everything in Docker

```bash
cp .env.example .env
docker compose up --build
# web  → http://localhost:5173   (Vite build served by nginx)
# api  → http://localhost:3000   (runs as NODE_ENV=production)
# data → http://localhost:8001   (dynamodb-admin)
```

### Option B — hot-reload dev

```bash
cp .env.example .env
corepack enable
pnpm install
docker compose up -d dynamodb-local dynamodb-admin
pnpm dev        # engine + shared in watch, api on :3000, web on :5173
# API OpenAPI UI (dev only) → http://localhost:3000/docs
```

The API creates the local table on boot. To (re)create it manually:
`pnpm db:setup`.

## Scripts (run from the repo root)

| Command                             | What it does                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`                          | Watch-build packages, run API + web with hot reload                     |
| `pnpm build`                        | Build every package and app                                             |
| `pnpm typecheck`                    | `tsc --noEmit` across the workspace                                     |
| `pnpm lint`                         | ESLint (flat config, typescript-eslint)                                 |
| `pnpm format` / `pnpm format:check` | Prettier                                                                |
| `pnpm test`                         | Vitest — engine unit + property, API route tests (needs DynamoDB Local) |
| `pnpm e2e`                          | Playwright — plays a whole career, create → legacy (no API required)    |
| `pnpm db:setup`                     | Create the single table in DynamoDB Local                               |

## How it plays

1. **Create** a prospect: name, a typed **jersey number** (0 by default), birth
   country (~120), **shooting hand** (lefty / righty), position, and one of **6
   position-locked archetypes** (a PG picks from Floor General / Scoring PG /
   Two-Way PG / Combo Guard / Sharpshooting Lead Guard — the Curry build — / Pace
   Setter — the Ja build; a C from Rim Protector / Stretch Five / Back-to-Basket
   Hub / Lob Threat / Mobile Big / Skilled Center). The archetype's real-player
   comps genuinely bias your starting ratings, your growth curve, and (for
   explosive builds) your athleticism, so the pick is a style and not a label. A
   seeded RNG rolls the rest, with rare "Hall of Fame" outliers regardless of
   build.
2. **Prologue** — a high-school and a recruiting decision. Both nodes are
   **rolled per career**: the options are worth the same card value with one
   getting a small random edge, and which attributes each moves is rerolled
   every playthrough, so there's no permanent "best pick". Then you pick a real
   **college program** (14 blue-bloods, 14 mid-majors, or an overseas club) and
   play an **interactive freshman year** — a wildly variable one (monster year or
   flop).
   A March result and a choice to declare / return / transfer; if scouts aren't
   sold yet, "declare" isn't on the table — you stay, and **every extra year in
   school ages you** (a one-and-done reaches the NBA at 19, a two-year prospect
   at 20). The **draft** is genuinely random and rarely kind: only a true
   blue-chip run projects into the lottery, and a wide spread plus the odd reach
   or slide sends most players to the mid-first, the second round, or out of the
   draft entirely. **Where you actually land sets your talent ceiling** — a high
   pick almost always gets real growth headroom, a late pick usually doesn't, but
   a few second-rounders still climb into stardom.
3. **Landing spot** — choose one of three team offers (weighted by draft slot and
   a home-market roll), each with a **dollar figure**. That's your rookie team.
4. **Season loop** — the **perks shop** rides a small cart button by the team
   name (about 62% of every contract lands in the bank; every perk stays on the
   shelf — owned ones flagged in orange, ones you can't afford greyed out and
   unclickable, prices in green; yearly perks auto-renew from the bank, permanent
   ones unlock mid-career). Then make the year's call: a **scenario** from a themed content
   library, or — on a contract year — **free agency**. How many teams come
   calling scales with how good you are: a role player gets the incumbent plus a
   look, a star draws 7-8, a superstar 12-17. Each offer shows a **contender
   rating** ("title odds with you ~N%", best destinations first), the glamour
   markets (Lakers, Warriors, Knicks, Celtics, Heat) punch above their record,
   and modest-overall veterans get short 1-2 year journeyman deals while stars
   get the long ones. Every question sits in a framed card — a coloured strand up
   top, the prompt, then the options right beneath it (only the options ease in,
   not the whole screen) — and each card shows its exact `+N ATTRIBUTE` / `±$M`
   effects and lights the stat tiles it moves. ~30% of seasons a **bizarre
   mid-season fork** fires instead of the silent event, and every branch lands a
   **concrete consequence** — the front office cools on you and the situation
   gets tense, the staff fixes the rotation and you go back to shining, a groggy
   week takes a slight edge off your game. Attributes climb on an **age curve
   × archetype × talent²** — a decelerating rise through the early 30s, then a
   real decline once age catches up at ~34. The season is simulated (role →
   minutes → stat line), then the **conference standings** are simulated: your
   team's roster strength (lifted by your own presence) is ranked against its 14
   rivals for a **1–15 seed**, and that seed drives the bracket — a 1-seed is a
   real title threat, a 5-seed almost never is. Perennial cellar teams (Kings,
   Wizards, Nets) start every year a tier down and mostly pick in the lottery.
   Each season also gets its own **grade (S–D)** from accolades, seed, and team
   result, plus a **randomly-flavoured recap** — "lost the first round in a
   heartbreaking five, a buzzer-beater on the road ending it", "won it all,
   closing out the Finals in six". Pay is banked, and every season rolls its own **injury** check
   — mostly knocks and strains (games missed always adds up to `82 − games
played`), but a low durability, age, or a long injury record can bring on a
   hamstring, or, rarely, a **torn ACL / Achilles / meniscus** — only those
   surgery-grade ones end the year and take **2–3 off your overall for good**
   (and a season on the shelf barely develops, so it stings). Everything else is
   just games missed and maybe a point of athleticism. A separate **locker-room question** turns up every 2–3 seasons (it
   can land the same year as a fame one): being one of the guys always lifts
   **team chemistry** and staying strictly professional always costs it, but
   which of the two leaves you sharper and which nicks your game (about half an
   overall point, either way) is a coin flip each time, so neither option is a
   free pass. Low chemistry gets you traded; chemistry also builds on its own the
   longer you stay with one team (and resets on a trade). The HUD carries your
   **status tier** — fringe → role player → **star (85+)** → **superstar (89+)**
   → generational — your **team chemistry**, and — when your seat gets shaky — a
   **trade risk %**; a bad team or a toxic locker room can move you (a modal
   shows who you were **traded to**), though not on your farewell tour, and once
   you're a star you can **demand a trade** yourself. Your **idolatry** with the club and
   the national team fills toward _legend_ (a few years and a ring can make you
   their _idol_); a **championship keeps you a contender for ~5 seasons**, so
   repeat rings are a real chance without being a given. **Fame** is not a stat
   you train — it tracks what happens on the floor (impact, awards, rings) and
   the off-court scenes (the mid-season forks, the shoe deal). Big beats — a
   ring, an MVP, a trade, a serious injury — pop their own card on the next
   screen, and the headline trophies (**MVP, DPOY, Finals MVP, ROY, MIP, Sixth
   Man, a championship, Olympic medals**) take over the screen as a full **gala
   award reveal** — gold rail, the trophy under a glow, a line of flavour, a
   "follow the career" button; every other honour is still noted in the recap
   banner. Every fourth
   summer brings an **Olympic** call-up (gold/silver/bronze by your country's
   pedigree) — for Team USA you need genuine star status to make the 12; smaller
   nations lean on whoever they have. Fame 80+ triggers a one-time **shoe deal**
   (pick the brand).
5. **Overseas** — if the NBA stops calling while you can still play, sign in the
   **EuroLeague** instead of retiring: the same loop, its own clubs, trophies
   (EuroLeague MVP / title), and free agency. Your euro clubs build **idolatry**
   just like NBA teams (a long run and a title can make you their idol). When
   your market value recovers you pick between **two** NBA teams to go back to.
6. Contracts are honoured — a multi-year deal is always played out (a
   career-ending injury aside), and older players are only offered short ones.
   You can retire by choice from ~32; when age finally decides it for you,
   you pick your exit: a **farewell tour** (one more scripted ceremonial season —
   no re-signing, no retiring early, no trade demand) or a **quiet goodbye**.
7. A **legacy screen**: a top **career summary card** — final-ratings radar,
   career totals, earnings, a legacy **tier** (Journeyman → Inner-Circle
   All-Timer) + **grade**, and a **horizontal trophy case** (each award a stack
   of that many trophies, clumped at rest and spreading apart on hover, with the
   non-image honours as little tags) — which you can **copy as an image** to
   paste anywhere. Below it: a season-by-season table (salary, **conference
   seed**, a per-season **grade**), any overseas years, an **injury record**, the
   perks you ran and shoe brand you signed, **where you're remembered** (per-team
   standing, NBA and EuroLeague), and a
   Hall-of-Fame verdict. If the API is up the career is saved — you get a
   `/c/<id>` share link and "N% of players also chose X"; if not, the screen
   still stands (offline).

## Testing notes

- Engine tests assert **determinism**: replaying a career from its recorded
  `choices` reproduces a byte-identical summary; summaries are JSON round-trip
  stable. Property tests over 200+ random careers check ratings stay in band,
  ages are monotonic, grades match their score bands, and MVPs stay rare.
- API tests spin up the real Fastify app against a throwaway table in DynamoDB
  Local (one per test file).
- The Playwright test plays a **whole career** with **no backend** — the engine
  ships client-side.

## Adding artwork (awards, team logos, club crests)

The UI runs on emoji glyphs out of the box. To swap in real art, drop image
files (`.png` / `.jpg` / `.webp` / `.svg`) into:

| Folder                        | Filename (case-sensitive)         | Example           |
| ----------------------------- | --------------------------------- | ----------------- |
| `apps/web/src/assets/awards/` | `<awardId>.<ext>` (`AWARD_IDS`)   | `mvp.png`         |
| `apps/web/src/assets/teams/`  | `<TEAMID>.<ext>` (3-letter, caps) | `LAL.svg`         |
| `apps/web/src/assets/clubs/`  | `<clubId>.<ext>` (`EURO_CLUBS`)   | `real_madrid.png` |

They're picked up automatically (`src/lib/art.ts`, via `import.meta.glob`) — no
import to wire. Award art shows in the **award modal** (128×128) and the
season-recap **moment cards** (48×48); logos/crests show next to team names.
Each folder's `README.md` lists the full id set. Trademarks belong to their
owners — ship your own stylised marks if you publish.

## Roadmap

- **M1 — vertical slice** _(shipped)_
- **M1.5 — career mode** _(shipped):_ multi-season careers, position-locked
  archetypes, real NBA teams, draft + landing spot, awards & trophies,
  international play, legacy screen
- **M1.6 — content & depth** _(shipped):_ jersey + country, interactive
  college years with real programs, a data-driven scenario library (add a file →
  new content), El Idolo–style option cards, role momentum + stat smoothing
- **M1.7 — economy & life** _(this repo):_ salary + market value + a bank, a
  perks shop (modal — bank shown, owned/locked states, green prices), a
  per-season **injury system** (named injuries; only the surgery-grade ones —
  ACL/Achilles/meniscus — take 2–3 off the overall and stall a lost season's
  development, the rest are just games missed; `82 − GP`),
  **honoured contracts** + a pre-retirement **farewell** choice, an independent
  **team-chemistry** question channel (one option always helps chemistry and one
  always hurts it, but which one nicks or sharpens your game — half an overall
  point — is a coin flip), a **free-agent market that scales with your standing**
  (a role player gets a couple of looks, a superstar 12-17) where every offer
  shows a **contender rating** and the glamour markets punch above their record,
  a per-season **randomly-flavoured recap** and a per-season **grade (S–D)**,
  **simulated conference standings** (a 1–15 seed that drives the bracket — high
  seeds win titles, a 5-seed almost never does) with perennial cellar teams
  (Kings / Wizards / Nets) mostly in the lottery, a **career card you can copy as
  an image**, Olympics gated to stars for Team USA, mid-season branching
  situations with concrete per-branch consequences, a fame-gated shoe deal, the
  EuroLeague as a full parallel league (with idolatry and a **pick-your-team**
  route back to the NBA), a per-team **franchise standing** (fan favorite → idol →
  legend), a **status tier** + **trade probability** with team-forced and
  player-demanded trades (shown as a "traded to" modal), a **5-season
  championship window** after a ring, a **draft** where the lottery is the
  exception (most players go mid-first, second round, or undrafted), **draft slot
  as the talent ceiling** (high picks develop, most late picks don't, a few
  second-round steals still do) with draft-slot-scaled washout odds (late
  second-rounders bust to the EuroLeague far more often), **position-weighted
  DPOY** (bigs and wings, most of all a superstar defender with 85+ D) and a
  higher MVP rate for bona-fide superstars, **overall-scaled contract lengths**
  (journeymen sign 1-2 years), a full-screen **gala award reveal** for the
  headline beats (MVP, ring, trade) with the lesser accolades left to the
  season table and trophy case rather than a stack of cards, in-career questions
  in a **framed scenario card** (colour strand,
  prompt above the options, options fading in), **superstar exemptions** (no
  "benched in the fourth" or "defer to the star" once you're the guy, and near-
  zero involuntary-trade odds), a **defense reading** weighted to your stronger
  end so a real stopper clears 85, per-career **randomised prologue** options,
  age that tracks extra college years, performance-driven **fame** (no longer a
  trainable stat), a slow rating economy where option cards show the exact gain
  after the 99-cap (a maxed stat drops off the card) plus a **rare** ~1-in-10
  once-a-career gold `+12`, a persistent stat strip + money bar, **30 comp-driven
  archetypes** (six per position, a Curry and a Ja build among them) whose
  real-player comps bias your starting ratings, growth curve, and athleticism,
  **card effects that tell the truth about defense** (the DEFENSE tile blends
  your stronger and weaker end, so a two-axis bump shows the smaller blended
  gain), a typed **jersey number** (0 by default), a trophy case that overlaps at
  rest and fans out on hover, a fixed **copy-as-image** career card (the header
  and radar labels no longer scramble), and a wider school pool (14 blue-bloods,
  14 mid-majors)
- **M2 — AWS deploy (cheapest):** Terraform modules, remote state, GitHub Actions
  deploy via AWS OIDC, CloudWatch dashboard + Budgets alarm
- **M3 — depth:** salary-cap rules & sign-and-trades, multi-player trades, named
  teammates, in-season tournament
- **M4 — accounts & polish:** Cognito, OG share images, SQS aggregate pipeline,
  OpenTelemetry

## License

MIT. Not affiliated with or endorsed by the NBA.

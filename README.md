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

1. **Create** a prospect: name, jersey number, birth country (~120), **shooting
   hand** (lefty / righty), position, and one of **4 position-locked archetypes**
   (a PG picks from Floor General / Scoring PG / Two-Way PG / Combo Guard; a C
   from Rim Protector / Stretch Five / Back-to-Basket Hub / Lob Threat). A seeded
   RNG rolls starting ratings.
2. **Prologue** — a high-school and a recruiting decision. Both nodes are
   **rolled per career**: the options are worth the same card value with one
   getting a small random edge, and which attributes each moves is rerolled
   every playthrough, so there's no permanent "best pick". Then you pick a real
   **college program** (blue-blood, mid-major, or international club) and play an
   **interactive freshman year** — a wildly variable one (monster year or flop).
   A March result and a choice to declare / return / transfer; if scouts aren't
   sold yet, "declare" isn't on the table — you stay. The **draft** is genuinely
   random (a flat spread plus the odd big reach or slide → mid-lottery to
   undrafted on the same run) and sets a hidden **talent** ceiling.
3. **Landing spot** — choose one of three team offers (weighted by draft slot and
   home market), each with a **dollar figure**. That's your rookie team.
4. **Season loop** — each offseason you first visit the **perks shop** (a modal
   grid showing your bank; every perk stays on the shelf — owned ones flagged in
   orange, ones you can't afford greyed out and unclickable, prices in green as
   a plain cost; yearly perks auto-renew from the bank, permanent ones unlock
   mid-career), then make the year's call: a **scenario** from a themed content
   library, or — on a contract year — **free agency**, where a rival's bigger
   offer is a real temptation. Every card shows its exact `+N ATTRIBUTE` / `±$M`
   effects and lights the stat tiles it moves. ~30% of seasons a **bizarre
   mid-season fork** fires instead of the silent event (fight the star → defer
   and shrink your role, or force a trade — these cost minutes or front-office
   goodwill, never ratings). Attributes climb on an **age curve × archetype ×
   talent²** — a decelerating rise through the early 30s, then a real decline
   once age catches up at ~34. The season is simulated (role → minutes → stat
   line → playoff run), pay is banked, and every season rolls its own **injury**
   check — mostly knocks and strains, but a low durability (or age, or a long
   injury record) can bring on a hamstring, a stress fracture, or, rarely, a
   torn ACL / Achilles that costs you a chunk of your athleticism for good. The
   HUD carries your **status tier** (fringe → role player → star → superstar →
   generational) and, when your seat gets shaky, a **trade risk %**; a bad team
   can move you (a modal shows who you were **traded to**), and once you're a
   star you can **demand a trade** yourself. Your **idolatry** with the club and
   the national team fills toward _legend_ (a few years and a ring can make you
   their _idol_); a **championship keeps you a contender for ~5 seasons**, so
   repeat rings are a real chance without being a given. **Fame** is not a stat
   you train — it tracks what happens on the floor (impact, awards, rings) and
   the off-court scenes (the mid-season forks, the shoe deal). Big beats — a
   ring, an MVP, a trade, a serious injury — pop their own card on the next
   screen, and the headline trophies (**MVP, DPOY, Finals MVP, ROY, MIP, Sixth
   Man, a championship, Olympic medals**) take over the screen as a full **award
   modal**; every other honour is still noted in the recap banner. Every fourth
   summer brings an **Olympic** call-up (gold/silver/bronze by your country's
   pedigree); fame 80+ triggers a one-time **shoe deal** (pick the brand).
5. **Overseas** — if the NBA stops calling while you can still play, sign in the
   **EuroLeague** instead of retiring: the same loop, its own clubs, trophies
   (EuroLeague MVP / title), and free agency, plus a path back to the NBA once
   your market value recovers.
6. Contracts are honoured — a multi-year deal is always played out (a
   career-ending injury aside), and older players are only offered short ones.
   You can retire by choice from ~32; when age finally decides it for you,
   you pick your exit: a **farewell tour** (one more ceremonial season) or a
   **quiet goodbye**.
7. A **legacy screen**: trophy case, career totals, **career earnings**, a
   season-by-season table (with salary), any overseas years, an **injury
   record**, the perks you ran and shoe brand you signed, **where you're
   remembered** (per-team standing), a **career-moments** strip, final-ratings
   radar, a legacy **tier**
   (Journeyman → Inner-Circle All-Timer) and **grade**, and a Hall-of-Fame
   verdict. If the API is up the career is saved — you get a `/c/<id>` share link
   and "N% of players also chose X"; if not, the screen still stands (offline).

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
  per-season **injury system** (named injuries from knocks to ACL/Achilles,
  durability-driven odds, permanent hits), **honoured contracts** + a
  pre-retirement **farewell** choice, mid-season branching situations
  (status-scaled — they cost minutes or goodwill, never ratings), a fame-gated
  shoe deal, the EuroLeague as a full parallel league with a path back, a
  per-team **franchise standing** (fan favorite → idol → legend), a **status
  tier** + **trade probability** with team-forced and player-demanded trades
  (shown as a "traded to" modal), a **5-season championship window** after a
  ring, draft-slot-scaled washout odds (late second-rounders bust to the
  EuroLeague far more often), end-of-season **big-moment** cards (rings, awards,
  trades, serious injuries) with a full-screen **award modal** for the headline
  trophies, per-career **randomised prologue** options, performance-driven
  **fame** (no longer a trainable stat), a slow rating economy where option
  cards show the exact gain after the 99-cap plus a **rare** once-a-career gold
  `+9`, and a persistent stat strip + money bar
- **M2 — AWS deploy (cheapest):** Terraform modules, remote state, GitHub Actions
  deploy via AWS OIDC, CloudWatch dashboard + Budgets alarm
- **M3 — depth:** salary-cap rules & sign-and-trades, multi-player trades, named
  teammates, in-season tournament
- **M4 — accounts & polish:** Cognito, OG share images, SQS aggregate pipeline,
  OpenTelemetry

## License

MIT. Not affiliated with or endorsed by the NBA.

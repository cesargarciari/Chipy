# 7. A career economy: money, perks, overseas, and mid-season chaos

Date: 2026-08-29

## Status

Accepted (extends ADR 0005 and ADR 0006)

## Context

The v3 career had a rich decision loop but no stakes beyond ratings. The user
asked for a real life around the career: a visible stat strip while deciding,
**salary + market value + a bank**, a **browsable perks shop** (buy any number),
teams that **offer more money**, **injuries** as a system, a full **overseas
parallel league** when the NBA stops calling, a **shoe deal** at fame 80+, and
**bizarre mid-season situations** that fork the season.

## Decision

All of it rides on the existing deterministic `runCareer(seed, profile, choices)`
contract — new pending kinds, no new transport.

**Economy** (`data/contracts.ts`, `season/economy.ts`). `rookieScale(pick)` sets
first-contract pay; `marketValueFor({overall, age, lastImpact, hype, valueMult})`
→ $M/yr, deliberately modest (~$1–38M) so a $10–20M perk is a real slice of a
career. `offerSalary` has rebuilders overpay and contenders pay under — so
"leave for the bag" is an emergent free-agency choice. Each played season banks
`KEEP_RATE` (0.52) of salary; `CareerSummary` gains `careerEarnings` and
`peakSalary`. `OptionEffect` gains a `money` field (rendered as a gold "+$18M" or
red "−$2M" chip); `OptionStance` gains `valueMult`, a lingering market-value
multiplier.

**Perks** (`data/perks.ts`, `season/perks.ts`). 14 perks, `yearly` (cheap,
auto-renew from the bank, lapse when broke) or `permanent` (expensive,
`minSeason`-gated, never lapse). `aggregatePerkEffect` merges them into one
**heavily capped** bundle (stacking the whole shop is a fraction better than two
smart buys). The shop is an **always-open aside** on the season pending
(`season.shop`), never a blocking step — buying records a repeatable
`perks{n}` choice (which always precedes that season's `s{n}` choice), so replay
stays deterministic. Purchases route through `applyOption`, so
`describeChoice('perks4','buy_shooting_trainer')` feeds the "N% also hired a
shooting trainer" rollup.

**Injuries.** `state.injuryHistory` accumulates entries; injury-event weight and
`career_ending_injury` odds scale with history length, and perk `injuryResist`
scales them (and the games missed) down.

**Overseas as a full parallel league** (`data/euro-clubs.ts`,
`season/overseas.ts`). When an NBA player washes out young but can still hoop, an
`overseas_offer{n}` node offers EuroLeague clubs (or retire). Overseas seasons
run the same loop (perks, scenarios, mid-season, growth) with their own sim and
result ladder, new `AwardId`s (`euroleague_champion/_mvp`, `euro_domestic_title`),
their own free agency, and — once market value recovers — an `nba_return` option.
Overseas years live in `summary.overseasSeasons` (kept out of the NBA `seasons`
list and career totals) and count ×0.6 toward legacy longevity.

**Shoe deal.** A `once` scenario gated `hype >= 80`; four brands trade up-front
money against hype and a market-value tail. Sets `summary.shoeDeal`.

**Mid-season situations** (`season/midseason.ts`). A separate `Scenario` pool;
~30% of seasons (from season 3) an `ms{n}` node fires **in place of** the silent
auto-event. These **never touch ratings**: `resolveMidseason` rolls a cost and
scales it by status — a young player loses minutes/games, a star just loses
goodwill (a negative hit to the franchise standing). The mature choice tends to
be `neutral` (it blows over); the dramatic one carries the `role` / `standing` /
`chemistry` / `focus` cost (or `forceTrade`).

**Franchise standing** (`season/franchise.ts`, v4.2). A per-team score accrues
each season from role, playoff finish, awards, and a loyalty bonus at 4+ years;
mid-season "standing" hits subtract from it. `franchiseTier` maps it to
`known → favorite → cornerstone → idol` (a ring with that team) `→ legend` (a
historic career and 6+ years). An idol / legend retires his own jersey. Shown
as `summary.franchises`.

**Career moments** (`season/moments.ts`, v4.2). `detectSeasonMoments` flags the
big end-of-season beats — a ring, an MVP / DPOY / ROY, a deadline trade, a
franchise tier-up, a career-points milestone. They ride the next season's
`preview.moments` (the web pops a card stack) and land in full on
`summary.moments`. Ids are stable so award / team art can slot in later.

**Web.** A persistent `CareerHud` — big OVERALL, FAME on its own, the franchise
standing, money line, and a `RatingStrip` (interior + perimeter D collapsed to
one DEFENSE tile for presentation) — sits above every in-career decision; a
`MomentsBanner` stacks the season's big cards on top; a collapsible `PerksDrawer`
rides the season screen; the legacy card adds a franchise-standing panel and a
career-moments strip.

**Rating economy** (v4.3). Every written scenario bump now passes through a global
slowdown (`RATING_SCALE` 0.85, basketball IQ 0.32 — it barely declines with age),
so ratings climb slowly and IQ is a normal stat again. `EffectChip` gains
`nominal`: `optionView(option, ratings)` trims each chip's `delta` to the room
actually left under 99 (a `+8` on a 95 shows `+4`, strike-through `+8`; a maxed
stat shows `MAX`), so the card never over-promises. A `once`-per-career
`scn_breakthrough` scenario carries four `rare` options — they skip the slowdown
and land a true `+9` (finishing / three-point / defense / playmaking), rendered
gold. Mid-season situations now also emit a `midseason` career moment carrying
the option chosen, so the season summary shows the bizarre call you made.

**A longer prime + more randomness** (v4.4). `ageCurveDelta` climbs (decelerating)
through the early 30s then flips to a hard decline at 34 — "steady growth to ~34,
then age catches up" — with the age-out retirement cascade shifted up four years
and layered with `rng` so careers end anywhere from the mid-30s to ~40, not on
the same birthday. `simulateDraft` gets a flat ±13 spread plus a ~1-in-6 real
swing, so the same college run lands anywhere from the mid-lottery to undrafted.
College years get a wide form multiplier; a freshman who doesn't move his draft
stock past ~34 isn't offered the "declare" option — he stays another year.

**Idolatry bars** (v4.4). `FranchiseStanding` and a new `NationalStanding` both
carry `progress` (0..100 toward legend) for a bar. National-team rep accrues from
call-ups and medals; `summary.nationalTeam` + `preview.nationalTeam` expose the
standing. `preview.raisedKeys` lists the ratings the last call bumped so the
strip can tint them orange.

**Profile** (v4.4). `PlayerProfile` gains `handedness` (`'left' | 'right'` — pick
your shooting hand); the country list expands to ~120 (El Salvador, Moldova,
Cabo Verde, …).

**Randomised prologue + performance-driven fame** (v4.5). The high-school and
recruiting nodes are now `build…Node(rng)` builders seeded off a
`${seed}::prologue` stream instead of static tables: every option carries the
same card-visible value (a `balancedEffect` helper trades scaled rating points
against unscaled athleticism/durability so differently-shaped options read as
equal), one option gets a small `rollEdge` bump per career, and which skills each
moves is rerolled — so no summer-circuit pick is a permanent best. Static
`*_TEMPLATE` label maps stay for `describeChoice`'s "N% also chose" rollup.
**Fame** (`state.hype`) is no longer a trainable offseason stat: every themed
scenario pool (`money`/`media`/`team`/`mind`/`body`/`legacy`) dropped its `hype`
chips (endorsements pay `money` instead), and a `perfHype` term now moves fame
from on-court impact, awards, and rings each season. Fame still shifts from the
off-court scenes — the mid-season forks and the shoe deal — where a `−2 FAME`
chip now visibly lands (it applied 1:1 all along; the bug was competing
offseason `+hype` contributors absorbing it).

**Perk shop payload + award modal** (v4.5). `buildPerkShop(state, n)` returns a
`PerkShop { nodeId, bank, items: PerkShopItem[] }` — every not-owned unlocked
perk _plus_ the owned ones, each with `owned` / `affordable` flags, a positive
`cost`, `highlight` tiles, and `tags`. The web renders a compact tile grid: bank
in the header, owned tiles orange, unaffordable tiles greyed + `disabled`,
prices green (`$2M`, never `-$2M`). A new `MomentModal` takes over the screen for
headline moments (`mvp`/`dpoy`/`finals_mvp`/`roy`/`champion` + rings); lesser
beats stay in the banner. `apps/web/src/lib/art.ts` resolves optional artwork by
id from `src/assets/{awards,teams,clubs}/` via `import.meta.glob` — `undefined`
until a file is dropped, so glyphs remain the default.

**Injuries as a real system, honoured contracts + a farewell (v4.6).**
`season/injuries.ts` — a per-season `rollSeasonInjury(rng, ctx)` independent of
the single flavour event, so a career can no longer dodge every injury.
`seasonInjuryChance` is driven mainly by durability (frail bodies get hurt far
more), plus age and a compounding injury count, cut by medical perks; ~100% of
careers now pick up something, averaging ~7–8 over a 19-season run. A named
`INJURY_CATALOG` runs from `jammed finger` up to `torn ACL` / `torn Achilles` /
`ruptured patellar tendon`; only the `severe` tier carries an `endBase`
career-ending chance (age- and wear-scaled), and `severityScale` skews the
_type_ nastier for old / frail players. Each injury lands via the season
`effect` (`injuredGames` + permanent `athleticism` / `durability` hits) and is
recorded on `injuryHistory` by its real name + `severity`; `moderate` / `severe`
ones also pop an `injury` `CareerMoment`. The old `ankle_sprain` / `knee_injury`
/ `career_ending_injury` entries left `events.ts`.

Contract years are now honoured: the age-out and early-washout cascades are
gated behind `contractYearsLeft <= 1`, so a signed multi-year deal is always
played out (a career-ending injury aside) — no more "sign at 36, retire after
one game". `contractLenFor` gains an age cap (≤1yr at 36+, ≤2 at 34, ≤3 at 32)
so honouring late deals doesn't stretch careers past 40. When age (not injury)
does end it, a `farewell` pending node offers `farewell_tour` (one more
ceremonial, non-FA season, then a locked retirement) vs `quiet_goodbye` (stop
now). New `CareerState` flags `farewellChosen` / `onFarewellTour`; nodeId regex
learns `farewell\d{1,2}`.

**Awards — noted vs. headline (v4.6).** `AWARD_MOMENTS` covers _every_ `AwardId`
now, so `all_rookie` / `all_star` / titles all get a recap card ("noted"); the
`all_*` selections card only the first time (`everyTime: false`), the rest every
time. The web's `HEADLINE_AWARDS` (the full-screen modal set) is the curated
"main" list — `mvp` `dpoy` `finals_mvp` `roy` `champion` `clutch_poy` `mip`
`sixth_man` + the Olympic / World Cup medal spread + `euroleague_*`. Artwork is
present for most; `mip` / `sixth_man` fall back to a glyph until their PNGs land.
`art.ts` globs now accept upper-case extensions (`DEN.PNG`).

**Trades, status, dynasties, no World Cup (v4.7).** `season/status.ts` adds
`statusTier` (`fringe → role_player → star → superstar → generational`, from
overall with accolade lifts) and `tradeChance` — an RNG-free 0..~~0.26 estimate
from team strength / role / contract year / franchise idolatry / status. The HUD
shows the status tier always and "Trade risk N%" once it's tense; the sim rolls
once against it (after `seasonsWithTeam >= 3`) to force a move. Star-and-up
players get a `DEMAND A TRADE` option on the season screen — it forces a move and
docks 14 franchise points. Any trade now pops the award-style `MomentModal`
("Traded to <team>" with the destination logo); the trade `CareerMoment`'s
`title` is the new team's label, `id` is `trade` / `trade_demand`. A
championship opens a 5-season `ringWindowLeft` that adds a decaying `teamMult`
(~~+12%→+5%) so repeat titles are a real chance, not automatic (a trade eats two
years of it). Washout-to-overseas now scales with draft slot — a pick ≥46 or
undrafted adds up to +0.24 to the washout roll and a higher overall ceiling, so
late-second-rounders reach the EuroLeague ~7× more often than lottery picks. The
**World Cup is gone** as a trophy: `international.ts` is Olympics-only, and
`wc_gold` / `wc_silver` / `wc_bronze` are removed from `AWARD_IDS` (and every
label / points / moment / trophy-order table).

`ENGINE_VERSION` → `4.6.0` then `4.7.0` (each of the injury roll, contract
gating, farewell node, the trade roll, the dynasty `teamMult`, the WC removal,
and the washout re-tune shifts replay results); packages → `0.4.7`. `MomentKind`
and `careerMomentSchema` gained `injury`; `injuryEntrySchema` gained optional
`severity`. `OptionView` gained an optional `teamId` — the client draws that
team's logo on contract cards (free agency, landing, overseas), while the recap
`MomentCard` deliberately drops team logos to keep the notification stack clean.
The web keys its persisted run to `ENGINE_VERSION`, wraps every in-render
`runCareer` in a `runCareerSafe` try/catch, mounts a top-level `ErrorBoundary`,
renders the perks shop as a modal, shows the idolatry bars and an injury-record
card on the legacy screen, and labels the overseas school route "International".

**Team chemistry, honest games-played, surgery-grade injuries (v4.8).**
`CareerState.chemistry` (0..100, starts 40–70) tracks how you gel with the room.
`SeasonEffect` gains `chemistry` and `overallHit`; the mid-season resolver was
rewritten from a five-way `consequence` enum to **per-option resolvers** that
produce concrete outcomes — a colder front office ("the situation gets tense",
which is now a real `tradeChance` input), a real overall drop, or a genuine
spark — and forks where it matters (`msx_pos_resist` coin-flips "the staff fixes
the rotation, you shine again" vs the tense front office). Two chemistry
scenarios landed: a teammate's birthday (`msx_bday_out` → +chemistry, −2 OVR;
`msx_bday_home` → −chemistry) and a burner account (`msx_burner_own` →
−60 chemistry; `msx_burner_deny` → −3 OVR). Chemistry drifts back toward ~55 each
season and resets toward neutral on a trade; **low chemistry is the dominant
`tradeChance` term** (up to +0.4, ceiling raised to 0.6). Games-played is now
exact: `simulateSeason` returns `gamesMissed = 82 − gp`, and every
`injuryHistory` entry / `SeasonRecord.injuredGames` uses that — no more a
"58 games missed" line next to a 40-game season. `INJURY_CATALOG` gained
`seasonEnding` (`true` for ACL / Achilles / ruptured patellar — always 82 games;
a 0.55 surgery-or-rehab roll for a torn meniscus) and `ovrHit` (a flat 2–6 OVR
drop spread across every rating). `OptionView.teamId` also drives a crest next
to the team name on the season screen; `EURO_CLUBS` is trimmed to the seven with
crest art (Real Madrid, Barça, Panathinaikos, Olympiacos, Fenerbahçe, Monaco,
Žalgiris) so every overseas offer shows a badge. `g_league_ignite` left the
recruiting node (three tiers now). Every extra college year ages the rookie:
`state.age += collegeYears − 1`, so a two-year prospect reaches the NBA at 20.
`quiet_goodbye` explicitly locks retirement in (no stray extra season). The web
`Create` screen drops the Home-market picker — it's rolled with the career now.

`ENGINE_VERSION` → `4.8.0`; packages → `0.4.8`. `injuryEntrySchema.gamesMissed`
and `seasonRecordSchema.injuredGames` keep the `0..82` bound (the value's meaning
tightened, the range didn't).

**A dedicated chemistry channel, a real postseason, tidied recap (v4.9).**
Chemistry questions get their own `chem{n}` pending node (`kind: "chemistry"`,
`season/chemistry.ts`), so a fame / mid-season question and a locker-room one can
both land in a season. It's on a cooldown (`CareerState.lastChemistrySeason`, a
minimum two-season gap plus a 0.6 roll) so it fires roughly every 2-3 seasons,
not back-to-back. Every chemistry scenario is the same fork: the sociable pick
lifts chemistry but costs a small overall dip (1, occasionally 2, via
`SeasonEffect.overallHit`); the professional pick trades chemistry away.
Chemistry also drifts toward a baseline that **rises with `seasonsWithTeam`**
(42 fresh … 74 after eight years together, reset by a trade), and positive
chemistry swings from choices are multiplied by a familiarity factor
(1 → ~1.48× at six years) — you learn the room the longer you're in it.
`TeamResult` gains `play_in`; `teamStrengthFor` is centred higher
and `simulatePlayoffs` was rebuilt around a play-in bubble, so the median team
makes the postseason (lottery ~11% of seasons, down from ~40%) and champions are
rarer (~2.5%/season). Team USA now needs `statusRank >= star` to be picked for
the Olympics (`maybeInternational` gains `deepPool` / `status`); smaller nations
keep the lenient gate. `buildSummary` collapses the career-points milestones to
just the highest one. `sampleSchools` takes an `exclude` set so a transfer can't
re-pick the school you just left, and the summary lists each college / overseas
stint (school + year range) instead of one final name. The `g_league_ignite`
school is gone; the overseas school ids are the seven with crest art
(`real_madrid` … `zalgiris`) so a logo shows on the pick and the season screen.
Farewell hardening: the tour season is force-flagged non-FA, and the node only
fires from age 33+. The web replaces the emoji glyph maps in `MomentCard` /
`MomentModal` with lucide icons, adds an opacity fade-in on every decision
screen, shows the team crest by the name on the season screen, marks All-Star
seasons in the season-by-season table with `all_star.png`, and drops the
"career-defining calls" panel. Every em dash was stripped from user-facing
strings.

`ENGINE_VERSION` → `4.9.0` then `4.10.0` (v4.10 re-paces the chemistry channel,
softens its overall cost, and adds the tenure baseline); packages → `0.4.10`.
`teamResultSchema` and `TEAM_RESULT_LABELS` gain `play_in`; `SeasonDecisionNode.kind`
and `PendingDecision.kind` gain `chemistry`; the nodeId regex learns `chem\d{1,2}`;
`CareerState` gains `firedChemistryIds` and `lastChemistrySeason`.

**Spread the draft, a gala award reveal, a hover trophy case (v4.11).**
`simulateDraft` was too kind: most careers landed in the top half of the first
round. The stock→slot slope steepened (`(100 − stock) * 0.92 + 2`, was `* 0.62 + 1`),
the flat spread widened to ±16, the swing roll went to ~1-in-4 biased toward a
slide, and the undrafted gate rose. The lottery is now the exception (~10% of
autoplayed careers, was ~33%), with ~36% mid-first, ~36% early second round, and
a real ~10% undrafted tail that feeds the overseas path. `MomentModal` becomes a
proper gala reveal - a gold top rail over a dark radial gradient, a wide-tracked
kicker, a big italic gold-gradient badge (`.text-gold-gradient`), a `SEASON n`
line, the trophy under a soft glow, a white headline, a line of italic flavour
per award, and a solid-gold "Follow the career" button. The legacy screen's
trophy case is now `TrophyShelf`: each image-backed award (mvp/dpoy/champion/…)
is a stack of that many trophies, overlapping at rest and easing apart on hover
or focus (`.trophy-group` margin transition, opacity untouched); non-image
honours stay a text row below.

`ENGINE_VERSION` → `4.11.0`; packages → `0.4.11`. No schema changes.

**Draft slot drives talent, DPOY by position, journeyman deals, scenario framing
(v4.12).** The talent ceiling now keys off the _actual_ draft slot, not the
pre-draft scouting grade: `slotCeiling = clamp(1.19 − pick * 0.0135, …)` plus a
small "second-round steal" roll (a ~15% shot at a real bump for picks 31+, ~3%
for the lottery). Peak overall by slot comes out roughly top-5 ~94, lottery ~91,
mid-first ~84, early second ~79, late/undrafted ~73 - and ~20% of the second-
round group still peaks star-level, so a few steals happen without it being the
norm. The early-washout → EuroLeague path got harsher for the deep picks
(`draftRisk` up to 0.30 for pick 46+ / undrafted, roll `< 0.32 + risk`, euro-
interest floor 67 → 64), so more of the tail actually goes overseas. `statusTier`
thresholds eased a notch (superstar 88 → 87, `allNba >= 2` lifts) and `resolveAwards`
now takes `position` / `defenseRating` / `status`: the MVP base rate rose
(`0.055` + a superstar/generational bump, floor 24 → 22.5) and DPOY leans hard on
size - a `dpoyPosBonus` of +2 (C) / +1.5 (PF) / +1.1 (SF) / +0.2 (SG) / 0 (PG),
an extra bump and a higher final gate for a superstar defender with a merged
defense rating of 85+. `contractLenFor` takes `overall`: a sub-77 player past 23
is a journeyman, capped to 1-2 years (young players and stars untouched). Web:
`ScenarioFrame` wraps every in-career question - a coloured top strand (amber
season / sky locker-room / emerald mid-season), the kicker/title/prompt, then the
options directly beneath it with an `option-enter` opacity fade; the ratings +
money HUD moves to a `footer` below the options instead of between the question
and the answer. `ChoiceCard` gains an `accent` (left strand + matching hover
border). The trophy shelf hover is now per-award: `.trophy-group:hover` /
`:focus-visible` spreads just that stack.

`ENGINE_VERSION` → `4.12.0`; packages → `0.4.12`. No schema changes.

**Contender markets, a real free-agent market, a season recap, softer chemistry
(v4.13).** The five glamour franchises (`LAL` `GSW` `NYK` `BOS` `MIA`) carry a
`+0.06` standing edge to `teamStrengthFor` every season, and free agents skew
toward them. `freeAgencyOffers` now sizes the field by `overall`
(`suitorCount`): a role player gets the incumbent plus one look, a solid starter
4-5, a star 7-8, a superstar 12-17, a generational 16-20. Each `TeamOffer` carries
a `contender` value (`contenderOdds` = roster strength lifted by the player's own
ceiling); the offers are ranked best-title-shot first and the card shows a
`contenderLabel` ("Title favorite" … "Rebuild") plus "title odds with you ~N%".
Every `SeasonRecord` gets a `recap`: a seeded, one-line account of how the year
ended, built from a derived `recap` stream so it never perturbs the sim -
"Lost the first round in a heartbreaking five, a buzzer-beater on the road ending
it", "Swept out of the second round in four, never in the series", "Won it all,
closing out the Finals in six". The chemistry channel is no longer one-directional:
`resolveChemistry` still has the sociable option gain chemistry and the pro option
lose it, but a per-scenario coin flip decides which of the two _sharpens_ your
game (+~0.4 across the board) and which _dulls_ it (an `overallHit` of ~0.4, down
from a flat 1-2), so neither option is always the safe pick. `msx_bday_out`'s
overall cost drops 2 → 1. Web: the scenario frame no longer fades on a new
question (only the option cards ease in - `ScenarioFrame` loses `decision-enter`,
`SeasonScreen` too); the "last decision raised these" orange tint is gone
(`RatingStrip` drops `raised`, `SeasonPreview.raisedKeys` removed); the season
screen's "Last season" card leads with the recap, and the legacy season table
carries it as a tooltip.

`ENGINE_VERSION` → `4.13.0`; packages → `0.4.13`. `seasonRecordSchema` gains
`recap: z.string()`.

**Defense reads honestly, superstar exemptions, a rarer breakthrough, tidier
recaps (v4.14).** `defenseRatingOf(interior, perimeter)` folds the two D ratings
weighted `0.66 / 0.34` toward the stronger one, so a one-way stopper reads as an
elite defender and a true two-way one climbs past 85 into the 90s - used for the
merged DEFENSE tile / radar and the DPOY `eliteDefender` gate (the old mean
capped a specialist around 85). Two mid-season scenarios (`msx_star_fight`,
`msx_benched_4th`) now gate out for the team's clear best player -
`role !== 'franchise'`, `overall < 86`, and no MVP / first-team All-NBA - and
`tradeChance` hard-caps a superstar at 0.04 (generational 0.02) no matter the
chemistry: he dictates his destination through `demand_trade`, the front office
does not ship him out. `KEEP_RATE` 0.52 → 0.62 so the bank tracks the contract
more closely and perks feel proportional. `describeEffects` drops a rating chip
entirely once that stat is at the 99 cap (no more `MAX +0`). The `scn_breakthrough`
weight drops 0.5 → 0.3 (about one career in ten now sees it) and its options land
`+12` instead of `+9` (finishing / three-point / defense / playmaking, trimmed
only by the cap). The mid-season and chemistry outcomes no longer push a
`kind: 'midseason'` career moment - they live on `SeasonRecord.midseasonHeadline`,
which the "Last season" recap card already shows, instead of a card at the top of
the next screen. Web: the perks shop shrinks to a `ShoppingCart` button in the
season header (by the team name); the legacy screen's "Career moments" card is
gone (the trophy case plus its non-image-award tag row cover it). The full-loop
e2e now skips the perks button by `aria-label` rather than visible text.

`ENGINE_VERSION` → `4.14.0`; packages → `0.4.14`. No schema changes.

## Consequences

- The legacy score/grade bands were re-tuned (perks and the mid-season pool lift
  outcomes) so the population spread stays "centred on B, rare S, a real
  washout tail" — still constant-driven, still covered by population property
  tests plus new economy / perk / mid-season / overseas assertions.
- `choices` can now run past 100 entries (busy perks shops); the schema cap is
  generous and `choiceSelectionSchema` learns `perks|ms|overseas_offer|farewell`
  node ids.
- Honouring contracts lengthens the always-optimal-play tail (retire-age p50
  ~38, career p50 ~19 seasons) — realistic for a star, and the age-cap on
  offers keeps it from running away. Random-strategy careers still spread and
  still bottom out (grade C/D present).
- The involuntary trade roll adds ~2 moves to a journeyman's career and ~0 to a
  franchise idol's; `seasonsWithTeam >= 3` keeps a just-signed player from being
  flipped. `buildFranchiseStandings` now drops 0-season phantom entries.
- The dynasty `teamMult` is deliberately modest: ~29% of optimal-play careers
  win a ring, ~1 in 8 of those win another within five years — dynasties happen,
  they aren't the norm.
- Node resolution stays RNG-free (offers use derived streams) so partial
  evaluation replays byte-identically.
- Real EuroLeague club names join the static-data files disclaimed in the README.

# Award artwork

Drop an image named exactly `<awardId>.<ext>` here and it's picked up
automatically (`src/lib/art.ts`, via `import.meta.glob`).

- Extensions: `.png` `.jpg` `.jpeg` `.webp` `.svg` · filenames are **case-sensitive**
- Recommended: square, ~256×256 or an SVG, transparent background
- Renders 128×128 in the **award modal**, 48×48 in the season **moment cards**;
  an emoji glyph shows until the file exists.

## "Main" awards — these get the full-screen modal

`mvp` `dpoy` `finals_mvp` `roy` `champion` `clutch_poy` `mip` `sixth_man`
`oly_gold` `oly_silver` `oly_bronze` `wc_gold` `wc_silver` `wc_bronze`
`euroleague_mvp` `euroleague_champion` (plus any `kind: "ring"` moment).

Present now: `champion` `clutch_poy` `dpoy` `finals_mvp` `mip` `mvp` `oly_bronze`
`oly_gold` `oly_silver` `roy` `sixth_man`
**Still needed:** optionally the `wc_*` / `euroleague_*` set — they fall back to
🥇/🏆 for now.

Edit `HEADLINE_AWARDS` in `src/components/MomentModal.tsx` to change the set.

## Every other award — noted in the recap banner only, no modal

`all_rookie` `all_star` `all_nba_1` `all_nba_2` `all_nba_3` `all_defense_1`
`all_defense_2` `scoring_title` `rebounding_title` `assists_title` `steals_title`
`blocks_title` `euro_domestic_title`

(The `all_*` selections only card the **first** time; the titles card every time.)

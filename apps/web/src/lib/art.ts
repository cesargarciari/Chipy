/**
 * Optional artwork lookup for awards, NBA teams, and overseas clubs.
 *
 * Every getter returns `undefined` until a matching image file is added, so the
 * UI keeps working with emoji glyphs / plain names in the meantime.
 *
 * ─── HOW TO ADD IMAGES ──────────────────────────────────────────────────────
 *   Awards →  src/assets/awards/<awardId>.<png|jpg|jpeg|webp|svg>
 *             e.g. mvp.png, dpoy.png, champion.png, finals_mvp.png, roy.png
 *   Teams  →  src/assets/teams/<TEAMID>.<png|jpg|jpeg|webp|svg>
 *             e.g. BOS.png, LAL.svg   (3-letter uppercase ids from TEAMS)
 *   Clubs  →  src/assets/clubs/<clubId>.<png|jpg|jpeg|webp|svg>
 *             e.g. real_madrid.png    (snake_case ids from EURO_CLUBS)
 *
 * Drop the file in the right folder with the id as its name and it is wired up
 * automatically (Vite `import.meta.glob`) — no import, no re-deploy step.
 * Filenames are case-sensitive. See the README in each folder for the full id
 * list.
 */

type UrlMap = Record<string, string>;

/** Re-key a glob result (`../assets/x/mvp.png` → url) by bare id (`mvp` → url). */
function byId(mods: Record<string, unknown>): UrlMap {
  const out: UrlMap = {};
  for (const [path, url] of Object.entries(mods)) {
    const stem = path
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '');
    if (stem && typeof url === 'string') out[stem] = url;
  }
  return out;
}

const AWARD_ART = byId(
  import.meta.glob('../assets/awards/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,svg,SVG}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
);

const TEAM_ART = byId(
  import.meta.glob('../assets/teams/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,svg,SVG}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
);

const CLUB_ART = byId(
  import.meta.glob('../assets/clubs/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,svg,SVG}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
);

/** URL for an award's artwork, or `undefined` if none has been added. */
export function awardArt(id: string | null | undefined): string | undefined {
  return id ? AWARD_ART[id] : undefined;
}

/** URL for an NBA team's logo (3-letter id), or `undefined`. */
export function teamLogo(id: string | null | undefined): string | undefined {
  return id ? TEAM_ART[id] : undefined;
}

/** URL for an overseas club's crest (snake_case id), or `undefined`. */
export function clubCrest(id: string | null | undefined): string | undefined {
  return id ? CLUB_ART[id] : undefined;
}

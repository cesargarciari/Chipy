/** Optional images for awards, teams and clubs. Add a file named by id to src/assets/awards, teams or clubs and it's picked up automatically. Returns undefined when no image exists. */

type UrlMap = Record<string, string>;

/** Turns file paths into a map from id to url. */
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

/** Award artwork url, or undefined. */
export function awardArt(id: string | null | undefined): string | undefined {
  return id ? AWARD_ART[id] : undefined;
}

/** NBA team logo url, or undefined. */
export function teamLogo(id: string | null | undefined): string | undefined {
  return id ? TEAM_ART[id] : undefined;
}

/** Overseas club crest url, or undefined. */
export function clubCrest(id: string | null | undefined): string | undefined {
  return id ? CLUB_ART[id] : undefined;
}

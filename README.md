# games.samcbarth.com (Lunchbreak Arcade)

Free, original browser games plus a gaming news section (Lunchbreak Dispatch). Plain static HTML, CSS and JS. Part of the samcbarth.com network; shared rules live in `C:\SamSites\NETWORK.md`.

## Run it locally

```
python build.py              # regenerates every page, image, feed and sitemap
python -m http.server 8823   # then open http://localhost:8823
python tools/check.py        # link, metadata, JSON-LD and writing-rule check
```

The Claude preview entry is `games-site` (port 8823) in `.claude/launch.json`.

## Layout

| Path | What it is |
|---|---|
| `content/games.json` | Game page text: how to play, controls, tips, FAQ, card colors |
| `content/news/*.json` | One file per news story |
| `games/<slug>/game.js` | Hand-written game code (canvas). Never generated. |
| `assets/kit.js` | Shared game kit: canvas setup, Play overlay, HUD, best score (localStorage in try/catch), swipe and text input helpers |
| `assets/config.js` | Ad ids (see below) |
| `assets/site.js` | Theme toggle and ad slot rendering |
| `build.py` | Generates all HTML, `news/feed.json`, `rss.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`, card images, `CNAME` |

Generated files are committed because GitHub Pages serves the repo root as is.

## How to add a news story

1. Add `content/news/YYYY-MM-DD-short-slug.json`:

```json
{
  "slug": "short-slug",
  "date": "2026-11-12",
  "title": "Plain headline",
  "summary": "One or two sentence answer-first summary.",
  "body": ["What happened.", "Details from the source.", "Why it matters: ..."],
  "source_name": "Outlet or press release name",
  "source_url": "https://primary-source",
  "tags": ["indie", "industry"],
  "related": ["tangleword"]
}
```

2. Run `python build.py` then `python tools/check.py`.

Rules: original write-up only, every fact from the linked source, at most one short attributed quote, no em dashes, no hype verbs. `related` takes game slugs and adds cross-links both ways. The story appears in `/news/`, its own page, `news/feed.json` (JSON Feed 1.1 for news.samcbarth.com) and `rss.xml`. A card image is generated once per story.

## How to add a game

1. Write `games/<slug>/game.js` using `Kit.setup({slug, w, h, title, intro, onStart})`, then `Kit.score(n)` while playing and `Kit.over(finalScore, message)` at the end. Look at `games/glowworm/game.js` for a small example.
2. Add an entry to `content/games.json` (copy an existing one).
3. Optional on-screen buttons go in `EXTRA_CONTROLS` in `build.py`.
4. Rebuild and play it through: start, score, game over, Play again.

Each game sets `Kit.t` (a few getters) and the kit has `Kit.step(dt, n)` so automated play-tests can drive a game even when the tab is in the background.

## Where the account ids go

`assets/config.js`:

- `ADSENSE_CLIENT`: the `ca-pub-...` id once AdSense is approved.
- `AD_SLOTS`: ad unit ids for `intro`, `mid`, `end`, `sidebar` and `between`. Empty ids render nothing (no empty boxes).
- `between` only shows below the game after a round ends. No slot ever sits over the play area, and nothing shows before Play.

`build.py` `SITE` block:

- `contact_email`: currently `samcbarth@gmail.com` on the Contact page. Change it, or set `hubspot_form_id` (portal 20693956) to use a HubSpot form instead.
- `SAM_GAMES`: the "More from Sam" list. Add a `url` for Lantern Survivors, Dead Acre and Starforge when each has a public page; until then they show as plain names with "link coming soon". Nothing from those projects is copied here.

`ads.txt` belongs at the root domain samcbarth.com (HubSpot), not on this subdomain.

## DNS (Squarespace)

| Type | Host | Value |
|---|---|---|
| CNAME | `games` | `samcbarth.github.io` |

Then in the GitHub repo settings, Pages: deploy from `main`, root folder, custom domain `games.samcbarth.com`, enforce HTTPS. The `CNAME` file is already in the repo.

## Waiting on accounts

- AdSense approval (then fill `assets/config.js`).
- GitHub repo creation and push (waiting on Sam's yes).
- Public URLs for Sam's own games for the "More from Sam" section.

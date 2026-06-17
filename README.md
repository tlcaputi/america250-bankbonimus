# america250.bankbonimus.com

A personal, no-login guide to **what to do over the July 4th, 2026 weekend** (America's
250th / Semiquincentennial) across **Philadelphia**, **Bucks & Montgomery Counties (PA)**,
and **Central New Jersey** — centered on New Hope, PA. Built to *see everything going on*
with dates, **hours**, locations, links, and maps so we can decide what to do.

Window covered: **Sun Jun 28 – Sun Jul 5, 2026** (the 250th itself is **Sat Jul 4**).

## How it's built

- **Jekyll + GitHub Pages**, reusing the shared Bankbonimus theme (`assets/css/custom.css`,
  fonts, favicon, and the shared `bankbonimus-nav.html`). America250-specific styles live in
  `assets/css/america250.css`.
- **All events live in one data file:** [`_data/events.yml`](_data/events.yml). Each event
  has a `region` (`philadelphia` | `bucks` | `nj`), `category`, `date`, `start`/`end` times,
  `venue`, `address`, `lat`/`lng`, `cost`, `description`, `url`, and a **`source`** URL.
- **`index.html`** renders events **by day → by region** as cards (server-side, SEO- and
  no-JS-friendly) and embeds the event data as JSON for the maps.
- **`assets/js/map.js`** builds one **overview map** plus a **per-day mini-map** (Leaflet +
  CARTO tiles), and wires the shared filter bar (region / type / free-only / search) to both
  the maps and the cards.

## Data integrity

Every event is backed by a real `source:` URL that a research pass actually fetched. Nothing
is invented. Where a time, address, or price was not confirmed by the source, it is flagged
in `time_note`/`description` (e.g. "Time TBA — confirm") rather than guessed. **Confirm
details with the organizer before you go** — community parade/fair times in particular are
often posted late.

Research notes (not deployed) are in `.research/` (gitignored).

## Editing

Add or change an event by editing `_data/events.yml`. To preview locally:

```bash
# global jekyll 4 (no bundler); the repo Gemfile targets GH Pages
mv Gemfile _Gemfile.bak
jekyll build --destination /tmp/a250-site && (cd /tmp/a250-site && python3 -m http.server 8765)
mv _Gemfile.bak Gemfile
```

## Deploy

GitHub Pages (classic) builds from the default branch. Repo: `tlcaputi/america250-bankbonimus`.
DNS: Cloudflare CNAME `america250` → `tlcaputi.github.io` (DNS-only), `CNAME` file pins the
custom domain. Just commit + push to deploy.

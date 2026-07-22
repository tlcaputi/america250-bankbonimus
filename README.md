# america250.bankbonimus.com

A personal, no-login guide to **what to do over the July 4th, 2026 weekend** (America's
250th / Semiquincentennial) across **Philadelphia**, **Bucks & Montgomery Counties (PA)**,
and **Central New Jersey** — centered on New Hope, PA. Built to *see everything going on*
with dates, **hours**, locations, links, and maps so we can decide what to do.

Window covered: **Sun Jun 28 – Tue Jul 14, 2026** (the 250th itself is **Sat Jul 4**). The guide
runs from the Fourth through the **July 11–12 weekend** and on into **MLB All-Star week**
(Jul 13 Home Run Derby, Jul 14 All-Star Game in Philadelphia), including events that were
rescheduled/rain-dated out of the Fourth. **385 source-verified events / 17 days.** Extended
2026-07-06 (→Jul 12) and 2026-07-09 (→Jul 14).

> **New here? Start with the full handoff:** `.CHANGELOG/CURRENT_STATE.md` (gitignored) — current
> state, file map, gotchas, and the reusable multi-agent window-extension workflow.

## How it's built

- **Jekyll + GitHub Pages**, reusing the shared Bankbonimus theme (`assets/css/custom.css`,
  fonts, favicon). This site is **standalone** — it has its own nav (`_layouts/`), and does
  *not* use the shared `bankbonimus-nav.html`. America250-specific styles live in
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

`_data/events.yml` is the **single source of truth**. After editing it, regenerate the
per-event collection and commit both:

```bash
python3 gen_events.py            # _data/events.yml -> _events/<id>.md (one page per event)
git add -A && git commit -m "..." && git push
```

Preview locally (global jekyll 4; the repo Gemfile targets GH Pages so move it aside):

```bash
mv Gemfile _Gemfile.bak
jekyll build --destination /tmp/a250-site && (cd /tmp/a250-site && python3 -m http.server 8765)
mv _Gemfile.bak Gemfile
```

## Gotchas (read before touching templates/config)

- **Use `eday`, not `date`, for the event date.** Jekyll auto-parses collection `date:` into a
  Time and breaks string `where:` matching (day pages/tiles silently show 0). `gen_events.py`
  emits `eday`.
- **No Liquid `sort`/`push` over collection docs** — GitHub Pages' Jekyll 3.10 crashes on them
  (builds fine on local Jekyll 4, FAILS on GH Pages). The collection is pre-sorted via
  `collections.events.sort_by: start`. Always check the Actions build after pushing.
- The official external link is `ext_url` on event pages (`url` is the page's own URL).

## Deploy

GitHub Pages (classic) builds from the default branch. Repo: `tlcaputi/america250-bankbonimus`.
DNS: Cloudflare CNAME `america250` → `tlcaputi.github.io` (DNS-only), `CNAME` file pins the
custom domain. HTTPS is enforced. Just commit + push to deploy; confirm the Actions build is green.

## Full handoff

See `.CHANGELOG/CURRENT_STATE.md` (gitignored) for the complete state, file map, debugging
history, and HTTPS-cert recipe.

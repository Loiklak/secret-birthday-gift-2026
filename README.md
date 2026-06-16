# 🏃 Projet Levalloisienne — reveal d'anniversaire

A funny "secret login" reveal site. A non-runner friend scans a QR code, enters
their personal code, spots a glitching head in a running-pack photo, taps it, and
**BOOM** — their own face appears, then dezooms into the pack: they're in.
Ends by nudging them to open their physical gift (a race bib for *La Levalloisienne*).

Pure static site — vanilla HTML/CSS/JS + GSAP (CDN). No backend, no build step.

## The two codes (frontend only — it's a gag, not security)

| Friend | Code to type | Reveal | Ends on |
|--------|--------------|--------|---------|
| **Gilou** | `michelle`    | his face → joins the pack (4 → **5**) |
| **Matth** | `bacon hart`  | his face → pack complete (5 → **6**) |

Codes are case-insensitive and space-tolerant. Put each friend's code on/near the QR they scan.

## Run locally

```bash
python3 -m http.server 8123
# open http://localhost:8123
```

On desktop the rotate prompt is skipped (already landscape), so you can test the
whole flow there. On a phone it asks you to turn to landscape for the photo.

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "La Levalloisienne reveal"
git branch -M main
git remote add origin git@github.com:<you>/projet-levalloisienne.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.
Your URL will be `https://<you>.github.io/projet-levalloisienne/`. Point the QR code at it.

> `.gitignore` keeps the full-res original photos out of the repo — only the
> optimized files in `assets/` are published.

## Regenerate / swap assets

Originals live in the repo root (`4-runners.png`, `5-runners.png`, `6-runners.png`,
`gilou.jpg`, `matth.jpg`). To rebuild the web-optimized versions in `assets/`:

```bash
python3 scripts/process_assets.py
```

## Tuning the tap targets (calibrate mode)

If a head's hotspot ever feels off, open the site with `?calibrate=1`, tap the
target head, and it prints the normalized `x/y` coords. Paste them into the
`hotspot` values in `app.js`. Current values were derived automatically by
diffing the montages.

## Files

- `index.html` / `style.css` / `app.js` — the site
- `assets/` — web-optimized montages + cropped faces (published)
- `scripts/process_assets.py` — asset pipeline + hotspot coords

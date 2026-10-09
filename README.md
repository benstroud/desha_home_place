# The Franklin Desha House

A family heritage website for the **Franklin Desha House** — a double-pen dogtrot in Desha,
Independence County, Arkansas, built in 1847 and in the family ever since. The site provides
a QR-code room tour for guests, plus the history of the house and the Desha–Searcy families.

- **Stack:** [Astro](https://astro.build) (static site), Markdown content collections
- **Hosting:** GitHub Pages (deploy via GitHub Actions)
- **Domain:** [franklin-desha-house.com](https://franklin-desha-house.com)

---

## Quickstart

```bash
npm install
npm run dev        # local dev server (http://localhost:4321)
npm run build      # builds dist/ (automatically regenerates QR cards)
npm run qr         # regenerate QR card SVGs into public/qr/
npm run preview    # preview the production build locally
```

## Project layout

```
public/               static assets copied verbatim into the build
  CNAME               the custom domain (franklin-desha-house.com)
  favicon.svg
  qr/                 generated QR cards (gitignored; rebuilt on `build`)
src/
  content/
    rooms/*.md        one file per tour room -> /tour/<slug>  (each is a QR endpoint)
    family/*.md       one file per family member -> shown on /family
  content.config.ts   schema for the collections
  layouts/            BaseLayout (page shell), etc.
  components/         Header, Footer, RoomCard, QRCard
  pages/              index, tour (+ per-room + print), history, family, visit, 404
  styles/global.css   the design system (colors, type, layout)
scripts/
  generate-qr.mjs     builds the printable QR cards
.github/workflows/    GitHub Pages deploy
```

---

## Editing content (no code needed)

Content lives as simple Markdown files. Everything is plain text — edit with any text editor
(you can edit files right on GitHub in the browser).

**Add a room** — create `src/content/rooms/my-room.md`:

```
---
title: The Study
description: A quiet room at the back of the house.
order: 7
qr: true
roomArea: The study
---

## What you're looking at
Write the story here in plain text or Markdown.
```

**Add a family member** — create `src/content/family/name.md` with a `name`, optional
`born`/`died`/`relationship`, and the biography as the body.

**Room `order`** controls tour order (lower = earlier). Set `qr: false` to skip a QR card.

> The URL is derived from the **filename** (e.g. `my-room.md` → `/tour/my-room`). **Do not
> rename a room file after QR cards are printed** — that would break the printed codes. Once a
> room is in the tour, its filename (its URL) is permanent.

## QR cards

Run `npm run build` (or `npm run qr`) to generate print-ready, labeled QR cards into
`public/qr/<slug>-card.svg`. Print at 100% on card stock, trim, and laminate. Every room gets
one code pointing to `https://franklin-desha-house.com/tour/<slug>`; a `welcome` card points to
the home page. The site URL is read from `SITE_URL` (defaults to the production domain).

## Adding photographs

Create `public/photos/` and drop images in (e.g. `public/photos/parlor-1940.jpg`), then
reference them in Markdown as `![Alt text](/photos/parlor-1940.jpg)`. Optimize large images
before committing (a few hundred KB each is fine for mobile visitors on rural connections).

---

## Deploying

1. Push to the `main` branch of the GitHub repo.
2. GitHub Actions builds the site and deploys it to GitHub Pages.
3. The domain is set via the `CNAME` file and the repo's **Settings → Pages** page.

One-time setup (doesn't change after):
- Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
- Repo **Settings → Pages → Custom domain**: `franklin-desha-house.com`
- DNS (at Namecheap) points the apex `A` records to GitHub's four Pages IPs and `www` via
  `CNAME` → `benstroud.github.io`.

## Licensing & accuracy notes

- Text adapted from Wikipedia is CC BY-SA and is credited on the **History** page.
  Family photographs and family-written passages are © the Desha family.
- Genealogy is presented as family knowledge; several points contradict the published record and
  are flagged on the site. **A full family tree with source citations is a planned Phase 2.**
- The house history includes a contextual acknowledgment of plantation-era enslaved labor; the
  wording is intentionally conservative and should be reviewed by the family.

---

## Handoff note (read me eventually)

This is a family legacy site. It is intentionally boring under the hood so it **outlives any one
maintainer**. The durable assets are the plain-Markdown files in `src/content/` — whoever takes
this over next only needs to edit text files and run `npm run build`. The build system and
deploy workflow are standard Astro + GitHub Pages; see `astro.build` for the (stable) docs.

## Phase 2 backlog (not yet built)

- Genealogy page with per-person source citations and footnotes
- "The two Roberts" mystery page (sourced resolution)
- The cotton gin page
- "The land" page (Alderbrook, Greenbrier Bottoms, de Soto / Coliqua)
- Hartwell Boswell biography
- Full photo gallery
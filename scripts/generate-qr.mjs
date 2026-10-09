// ============================================================
// generate-qr.mjs
// Generates print-ready QR code cards for every tour room, plus
// a "Welcome" card for the front door.
//
//   Run:  npm run qr          (also runs automatically via `prebuild`)
//   Out:  public/qr/<slug>-card.svg   (vector — print at 100%)
//
// Each QR encodes a stable, permanent URL built from SITE_URL
// (defaults to the production domain in astro.config.mjs).
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ROOMS_DIR = path.join(ROOT, 'src', 'content', 'rooms');
const OUT_DIR = path.join(ROOT, 'public', 'qr');

const BASE_URL = (process.env.SITE_URL || 'https://franklin-desha-house.com').replace(/\/+$/, '');

// Palette matches the site design system (see src/styles/global.css).
const CARD_BG = '#faf6ec';
const CARD_FRAME = '#274a32';
const INK = '#2b2118';
const INK_SOFT = '#5a4b3a';
const GOLD = '#a8874a';
const QR_DARK = '#1c3825';
const QR_LIGHT = '#faf6ec';

const W = 900;
const H = 1180;
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, Arial, sans-serif';

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function qrModule(url) {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    width: 600,
    color: { dark: QR_DARK, light: QR_LIGHT },
  });
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [null, '0 0 29 29'])[1];
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return { viewBox, inner };
}

function buildCard({ title, description, url, viewBox, inner }) {
  const qrSize = 480;
  const qrX = (W - qrSize) / 2;
  const qrY = 205;
  const lines = wrap(description, 60).slice(0, 3);

  const body = [];
  body.push(`<text x="${W / 2}" y="740" text-anchor="middle" font-family='${SERIF}' font-size="52" font-weight="700" fill="${CARD_FRAME}">${esc(title)}</text>`);
  lines.forEach((ln, i) => {
    body.push(`<text x="${W / 2}" y="${810 + i * 35}" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${INK_SOFT}">${esc(ln)}</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CARD_BG}"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${CARD_FRAME}" stroke-width="3"/>
  <rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${CARD_FRAME}" stroke-width="1" opacity="0.5"/>

  <text x="${W / 2}" y="118" text-anchor="middle" font-family='${SERIF}' font-size="44" font-weight="700" fill="${CARD_FRAME}" letter-spacing="1">THE FRANKLIN DESHA HOUSE</text>
  <text x="${W / 2}" y="162" text-anchor="middle" font-family="${SANS}" font-size="23" fill="${INK_SOFT}">Desha, Independence County, Arkansas \u00b7 est. 1847</text>

  <svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="${viewBox}">
    ${inner}
  </svg>

  ${body.join('\n  ')}

  <text x="${W / 2}" y="986" text-anchor="middle" font-family="${SANS}" font-size="24" font-style="italic" fill="${INK_SOFT}">Scan with your phone camera</text>
  <line x1="${W / 2 - 140}" y1="1012" x2="${W / 2 + 140}" y2="1012" stroke="${GOLD}" stroke-width="3"/>

  <text x="${W / 2}" y="1120" text-anchor="middle" font-family="${SANS}" font-size="24" fill="${INK}">${esc(url)}</text>
</svg>
`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const roomFiles = fs
    .readdirSync(ROOMS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const cards = [];
  for (const file of roomFiles) {
    const raw = fs.readFileSync(path.join(ROOMS_DIR, file), 'utf8');
    const { data } = matter(raw);
    if (data.qr === false) continue;
    const slug = file.replace(/\.md$/, '');
    const url = `${BASE_URL}/tour/${slug}`;
    cards.push({
      slug,
      title: data.title || slug,
      description: data.description || '',
      url,
      module: await qrModule(url),
    });
  }

  // Front-door "Welcome" card.
  cards.unshift({
    slug: 'welcome',
    title: 'Welcome',
    description: 'Open the house website — your guide to this family home and its story.',
    url: BASE_URL + '/',
    module: await qrModule(BASE_URL + '/'),
  });

  for (const card of cards) {
    const { title, description, url, module } = card;
    const svg = buildCard({ title, description, url, viewBox: module.viewBox, inner: module.inner });
    fs.writeFileSync(path.join(OUT_DIR, `${card.slug}-card.svg`), svg.trim() + '\n');
  }

  console.log(`Generated ${cards.length} QR card(s) in public/qr/`);
  for (const c of cards) {
    console.log(`  - ${c.slug}-card.svg`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
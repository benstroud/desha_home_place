#!/usr/bin/env node
/**
 * process-photos.mjs — conservative batch photo prep for The Franklin Desha House.
 *
 * Why it exists: the authoring workflow is "drop a scan in, see it on the site."
 * This script does the safe, mechanical parts of cropping/touch-up — resize,
 * optional center-crop to a portrait ratio, an optional gentle sharpen, and
 * conversion to a web-optimized format (webp default, jpeg available). It always
 * leaves your original files untouched and writes new files elsewhere.
 *
 * It deliberately does NOT attempt creative restoration (no guesswork fill,
 * no heavy filter chains) — archival photos deserve a human eye first. The flags
 * that change pixels at all (--portrait, --sharpen) are opt-in.
 *
 * Usage:
 *   node scripts/process-photos.mjs                     # src/ -> public/photos
 *   node scripts/process-photos.mjs --input ./scans     # custom source dir
 *   node scripts/process-photos.mjs --output ./photos   # custom out dir
 *   node scripts/process-photos.mjs --portrait --sharpen   # Franklin's portraits
 *   node scripts/process-photos.mjs --width 1200 --format jpeg --quality 84
 *   node scripts/process-photos.mjs --keep-meta         # preserve EXIF/IPTC
 *   node scripts/process-photos.mjs --dry-run --verbose
 *
 * Notes:
 *   - Requires Node 18+ and the `sharp` devDependency (npm install first).
 *   - Default output folder is public/photos so results are ready to reference
 *     as /photos/<name>.
 *   - The source folder is NOT cleaned; originals stay put.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const INPUT_EXTS = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);

function parseArgs(argv) {
  const opts = {
    input: path.join(ROOT, 'scans'),
    output: path.join(ROOT, 'public', 'photos'),
    width: 1200,
    format: 'webp',
    quality: 82,
    portrait: false,
    sharpen: false,
    keepMeta: false,
    dryRun: false,
    verbose: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    switch (a) {
      case '--input': opts.input = path.resolve(ROOT, val()); break;
      case '--output': opts.output = path.resolve(ROOT, val()); break;
      case '--width': opts.width = Number(val()); break;
      case '--format': opts.format = val().toLowerCase(); break;
      case '--quality': opts.quality = Number(val()); break;
      case '--portrait': opts.portrait = true; break;
      case '--sharpen': opts.sharpen = true; break;
      case '--keep-meta': opts.keepMeta = true; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--verbose': opts.verbose = true; break;
      case '--help':
      case '-h': opts.help = true; break;
      default:
        console.error(`Unknown option: ${a}`);
        opts.help = true;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(`
process-photos.mjs — batch-resize / crop / optimize photos for the site.

  --input DIR     source images        (default: ./scans)
  --output DIR    where results go     (default: ./public/photos)
  --width N       resize longest edge  (default: 1200; --portrait maxwidth 900)
  --format F      webp (default) | jpeg
  --quality N     1-100                (default: 82)
  --portrait      center-crop to 3:4 portrait (good for family busts)
  --sharpen       apply a gentle output sharpen
  --keep-meta     keep EXIF/IPTC metadata (default: strips it — privacy-aware)
  --dry-run       list what would be processed, write nothing
  --verbose       log each file
  -h, --help      this help

Originals are never deleted or modified; results go to --output.
`);
    return;
  }

  if (!['webp', 'jpeg'].includes(opts.format)) {
    console.error(`Unsupported --format "${opts.format}" (use webp or jpeg).`);
    process.exit(1);
  }

  let files;
  try {
    files = (await fs.readdir(opts.input)).filter((f) =>
      INPUT_EXTS.has(path.extname(f).toLowerCase()),
    );
  } catch {
    console.error(
      `Could not read source folder: ${opts.input}\n` +
        `Create it and drop scans there, or pass --input <dir>.`,
    );
    process.exit(1);
  }

  if (files.length === 0) {
    console.log(`No image files found in ${opts.input}`);
    return;
  }

  await fs.mkdir(opts.output, { recursive: true });

  const results = [];
  for (const file of files.sort()) {
    const ext = path.extname(file);
    const stem = path.basename(file, ext);
    const outName = `${stem}.${opts.format}`;
    const outPath = path.join(opts.output, outName);
    const cap = opts.portrait ? 900 : opts.width;

    if (opts.dryRun) {
      results.push(`${file} -> ${outName} (longest edge ~${cap}px)`);
      continue;
    }

    let image = sharp(path.join(opts.input, file)).rotate(); // honour EXIF orientation
    const meta = await image.metadata();

    if (opts.portrait) {
      // Center-crop to a 3:4 portrait, then cap the width.
      image = image.resize({ width: 900, height: 1200, fit: 'cover', position: 'centre' });
    } else {
      // Keep aspect ratio; only ever downscale.
      image = image.resize({ width: cap, height: cap, fit: 'inside', withoutEnlargement: true });
    }

    if (opts.sharpen) {
      // Gentle, general-purpose sharpen (sharp's defaults are modest).
      image = image.sharpen({ sigma: 1 });
    }

    if (opts.keepMeta) {
      image = image.withMetadata();
    }

    const out =
      opts.format === 'jpeg'
        ? { quality: opts.quality, mozjpeg: true }
        : { quality: opts.quality };

    await image[opts.format](out).toFile(outPath);

    if (opts.verbose) {
      const { size } = await fs.stat(outPath);
      const mb = (size / 1024 / 1024).toFixed(2);
      const srcW = meta.width ?? '?';
      const srcH = meta.height ?? '?';
      const srcMB = meta.size ? (meta.size / 1024 / 1024).toFixed(2) : '?';
      console.log(
        `${file} (${srcW}x${srcH}, ${srcMB}MB) -> ${outName} (${mb}MB)`,
      );
    }
    results.push(outName);
  }

  if (opts.dryRun) {
    console.log('DRY RUN — nothing written. Would process:\n');
    results.forEach((r) => console.log(`  ${r}`));
  } else {
    console.log(`Wrote ${results.length} file(s) to ${opts.output}`);
    if (!opts.verbose) results.forEach((r) => console.log(`  ${r}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
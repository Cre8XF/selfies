import path from "node:path";
import fs from "fs-extra";
import { globby } from "globby";
import sharp from "sharp";

const SRC_ROOT = "assets/images-scr";  // her ligger originalene
const OUT_ROOT = "assets/images";      // her skal webp lagres
const DATA_ROOT = "assets/data";

const THUMB_WIDTH = 480;
const FULL_MAX_WIDTH = 1600;
const WEBP_QUALITY = 75;

async function getCategories() {
  const dirs = await fs.readdir(SRC_ROOT);
  return dirs.filter(d => d !== "Ny mappe"); // ignorér midlertidige mapper
}

async function ensureDirs(...dirs) {
  await Promise.all(dirs.map(d => fs.ensureDir(d)));
}

async function processImage(inFile, outThumb, outFull) {
  // Thumbnail
  await sharp(inFile)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outThumb);

  // Full
  const meta = await sharp(inFile).metadata();
  const targetW = Math.min(meta.width || FULL_MAX_WIDTH, FULL_MAX_WIDTH);

  await sharp(inFile)
    .resize({ width: targetW, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outFull);
}

async function buildCategory(cat) {
  const srcDir = path.join(SRC_ROOT, cat);
  const outThumbDir = path.join(OUT_ROOT, cat, "thumbs");
  const outFullDir = path.join(OUT_ROOT, cat, "full");

  await ensureDirs(outThumbDir, outFullDir);

  // Finn alle bilder i kategorimappen
  const files = await globby(["**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}"], { cwd: srcDir });
  const items = [];

  for (const rel of files) {
    // hopp over thumbs/full hvis de finnes
    if (rel.includes("thumbs/") || rel.includes("full/")) continue;

    const abs = path.join(srcDir, rel);
    const base = path.parse(rel).name;

    const thumbRel = `./assets/images/${cat}/thumbs/${base}.webp`;
    const fullRel  = `./assets/images/${cat}/full/${base}.webp`;

    await processImage(abs, path.join(outThumbDir, `${base}.webp`), path.join(outFullDir, `${base}.webp`));

    items.push({
      id: `${cat}-${base}`,
      src: `./assets/images/${cat}/full/${base}.webp`, // peker nå til konvertert versjon
      thumb: thumbRel,
      full: fullRel,
      title: base,
      category: cat
    });
  }

  const outFile = path.join(DATA_ROOT, `${cat}.json`);
  await fs.writeJson(outFile, items, { spaces: 2 });
  return { cat, count: items.length };
}

(async () => {
  try {
    const categories = await getCategories();
    const results = [];
    for (const cat of categories) {
      const res = await buildCategory(cat);
      results.push(res);
    }
    console.log("✅ Ferdig med konvertering:", results);
  } catch (err) {
    console.error("❌ Feil under bygging:", err);
  }
})();

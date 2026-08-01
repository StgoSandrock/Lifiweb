import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const target = path.join(root, "apps", "mobile", "assets");
const clubsTarget = path.join(target, "clubs");
await mkdir(clubsTarget, { recursive: true });

const clubSources = {
  israelita: "israelita.png",
  espanol: "espanol.png",
  manquehue: "manquehue.png",
  palestino: "palestino.jpeg",
  bianconero: "bianconero.png",
  italiano: "italiano.png",
  lif: "lif.png",
  ultimate: "ultimate.png",
  croata: "croata.avif",
  inter: "inter.png",
};

for (const [club, file] of Object.entries(clubSources)) {
  if (file.endsWith(".avif")) {
    await copyFile(path.join(root, "public", "clubs", file), path.join(clubsTarget, `${club}.avif`));
    continue;
  }
  await sharp(path.join(root, "public", "clubs", file))
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(clubsTarget, `${club}.png`));
}

const logo = sharp(path.join(root, "public", "lifi-logo.png"));
for (const [name, size, padding] of [
  ["icon.png", 1024, 130],
  ["adaptive-icon.png", 1024, 190],
  ["splash-icon.png", 512, 72],
  ["favicon.png", 96, 12],
]) {
  const inner = size - padding * 2;
  const mark = await logo.clone().resize(inner, inner, { fit: "contain" }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 7, g: 26, b: 54, alpha: 1 } } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(path.join(target, name));
}

console.log(`Mobile assets generated in ${target}`);

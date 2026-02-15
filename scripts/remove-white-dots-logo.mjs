/**
 * إزالة النقاط البيضاء من اللوقو (جعلها شفافة).
 * الاستخدام: node scripts/remove-white-dots-logo.mjs [مسار_الصورة أو مجلد logos]
 */
import { readFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logosDir = join(root, "public", "logos");

async function processImage(sharp, inputPath, outputPath) {
  const inputBuffer = readFileSync(inputPath);
  const pipeline = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const threshold = 245;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isWhiteDot = r >= threshold && g >= threshold && b >= threshold;
    if (isWhiteDot) data[i + 3] = 0;
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);
}

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("تثبيت sharp أولاً: npm install sharp --save-dev");
    process.exit(1);
  }

  const inputPath = process.argv[2];
  const filesToProcess = [];

  if (inputPath) {
    if (!existsSync(inputPath)) {
      console.error("الملف غير موجود:", inputPath);
      process.exit(1);
    }
    filesToProcess.push({ in: inputPath, out: inputPath });
  } else {
    if (!existsSync(logosDir)) {
      console.error("مجلد اللوقو غير موجود:", logosDir);
      process.exit(1);
    }
    for (const name of readdirSync(logosDir)) {
      if (name.endsWith(".png")) {
        const full = join(logosDir, name);
        filesToProcess.push({ in: full, out: full });
      }
    }
  }

  for (const { in: inp, out } of filesToProcess) {
    await processImage(sharp, inp, out);
    console.log("تم إزالة النقاط البيضاء:", inp);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

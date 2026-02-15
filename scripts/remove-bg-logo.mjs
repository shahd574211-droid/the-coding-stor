/**
 * إزالة الخلفية الفاتحة من صورة اللوجو وجعلها شفافة.
 * الاستخدام: node scripts/remove-bg-logo.mjs <مسار_الصورة_المدخلة> [مسار_الخروج]
 */
import { readFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("تثبيت sharp أولاً: npm install sharp --save-dev");
    process.exit(1);
  }

  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || join(root, "public", "logos", "logo.png");

  if (!inputPath) {
    console.error("الاستخدام: node scripts/remove-bg-logo.mjs <مسار_الصورة>");
    process.exit(1);
  }

  const inputBuffer = readFileSync(inputPath);
  const pipeline = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const threshold = 228;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isBackground = r >= threshold && g >= threshold && b >= threshold;
    if (isBackground) data[i + 3] = 0;
  }

  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log("تم حفظ اللوجو بدون خلفية:", outputPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

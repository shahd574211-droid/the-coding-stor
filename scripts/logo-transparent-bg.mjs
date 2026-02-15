/**
 * جعل خلفية اللوقو والنقاط الفاتحة شفافة، ثم حفظه في logo.png و footer-logo.png
 * الاستخدام: node scripts/logo-transparent-bg.mjs <مسار_الصورة_المدخلة>
 */
import { readFileSync, mkdirSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logosDir = join(root, "public", "logos");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("تثبيت sharp أولاً: npm install sharp --save-dev");
    process.exit(1);
  }

  const inputPath = process.argv[2] || join(logosDir, "logo-new.png");
  if (!existsSync(inputPath)) {
    console.error("الملف غير موجود:", inputPath);
    process.exit(1);
  }

  const inputBuffer = readFileSync(inputPath);
  const pipeline = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const threshold = 232;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isLight = r >= threshold && g >= threshold && b >= threshold;
    if (isLight) data[i + 3] = 0;
  }

  if (!existsSync(logosDir)) mkdirSync(logosDir, { recursive: true });

  const logoPath = join(logosDir, "logo.png");
  const footerLogoPath = join(logosDir, "footer-logo.png");

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(logoPath);

  copyFileSync(logoPath, footerLogoPath);

  if (inputPath !== logoPath && inputPath !== footerLogoPath) {
    try {
      unlinkSync(inputPath);
    } catch (_) {}
  }

  console.log("تم: خلفية شفافة + إزالة النقاط الفاتحة");
  console.log("  logo.png");
  console.log("  footer-logo.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

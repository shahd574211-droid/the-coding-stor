import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_STORAGE_KEY = process.env.SECRET_KEY_STOREG ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.BACKEND_NAME ?? process.env.SUPABASE_STORAGE_BUCKET ?? "thecoding";

/** Upload image from URL to Supabase Storage and return public URL. Skips if env not set. */
async function uploadImageToStorage(
  imageUrl: string,
  storagePath: string
): Promise<string | null> {
  if (!SUPABASE_URL?.trim() || !SUPABASE_STORAGE_KEY?.trim() || !STORAGE_BUCKET?.trim()) {
    console.warn("  Supabase Storage env not set (NEXT_PUBLIC_SUPABASE_URL, SECRET_KEY_STOREG, BACKEND_NAME). Using original URL.");
    return imageUrl;
  }
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const supabase = createClient(SUPABASE_URL, SUPABASE_STORAGE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    console.warn(`  Upload failed for ${storagePath}:`, e instanceof Error ? e.message : e);
    return imageUrl;
  }
}

// High-quality Unsplash images (1200px width for good quality)
const SEED_IMAGES = {
  "notion-life-planner":
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=85",
  "figma-ui-kit":
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=85",
  "react-nextjs-course":
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=85",
  "wireless-earbuds":
    "https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=1200&q=85",
  "desk-organizer":
    "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=1200&q=85",
};

async function main() {
  console.log("Seeding database…");

  // ——— Main categories (parentId: null) ———
  const mainDigital = await prisma.category.upsert({
    where: { slug: "digital" },
    create: {
      name: "Digital",
      slug: "digital",
      description: "Digital products: templates, courses, and downloads.",
      sortOrder: 1,
    },
    update: {},
  });
  const mainPhysical = await prisma.category.upsert({
    where: { slug: "physical" },
    create: {
      name: "Physical",
      slug: "physical",
      description: "Physical goods with optional shipping.",
      sortOrder: 2,
    },
    update: {},
  });

  // ——— Subcategories (parentId set to main) ———
  const digitalTemplates = await prisma.category.upsert({
    where: { slug: "digital-templates" },
    create: {
      name: "Templates",
      slug: "digital-templates",
      description: "Templates and design files for immediate download.",
      parentId: mainDigital.id,
      sortOrder: 1,
    },
    update: { parentId: mainDigital.id },
  });
  const courses = await prisma.category.upsert({
    where: { slug: "courses" },
    create: {
      name: "Courses",
      slug: "courses",
      description: "Online courses and learning materials.",
      parentId: mainDigital.id,
      sortOrder: 2,
    },
    update: { parentId: mainDigital.id },
  });
  const physicalElectronics = await prisma.category.upsert({
    where: { slug: "physical-electronics" },
    create: {
      name: "Electronics",
      slug: "physical-electronics",
      description: "Electronics and gadgets.",
      parentId: mainPhysical.id,
      sortOrder: 1,
    },
    update: { parentId: mainPhysical.id },
  });
  const physicalOffice = await prisma.category.upsert({
    where: { slug: "physical-office" },
    create: {
      name: "Office",
      slug: "physical-office",
      description: "Office supplies and desk accessories.",
      parentId: mainPhysical.id,
      sortOrder: 2,
    },
    update: { parentId: mainPhysical.id },
  });

  // Upload product images to Supabase Storage and get public URLs
  const productImageUrls: Record<string, string> = {};
  for (const [slug, url] of Object.entries(SEED_IMAGES)) {
    const storagePath = `products/${slug}.jpg`;
    console.log(`  Uploading image for ${slug}…`);
    const publicUrl = await uploadImageToStorage(url, storagePath);
    if (publicUrl) productImageUrls[slug] = publicUrl;
  }

  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: "notion-life-planner" },
      create: {
        name: "Notion Life Planner Template",
        slug: "notion-life-planner",
        shortDescription: "All-in-one Notion template for goals, habits, and projects.",
        description:
          "A comprehensive Notion template to plan your life. Includes goal tracking, habit tracker, project boards, and weekly reviews. Duplicate and start using in minutes.",
        price: 19.99,
        compareAtPrice: 29.99,
        currency: "USD",
        type: "DIGITAL",
        published: true,
        categoryId: digitalTemplates.id,
        imageUrl: productImageUrls["notion-life-planner"] ?? SEED_IMAGES["notion-life-planner"],
      },
      update: productImageUrls["notion-life-planner"]
        ? { imageUrl: productImageUrls["notion-life-planner"] }
        : {},
    }),
    prisma.product.upsert({
      where: { slug: "figma-ui-kit" },
      create: {
        name: "Figma UI Kit — Dashboard",
        slug: "figma-ui-kit",
        shortDescription: "Modern dashboard UI kit for Figma.",
        description:
          "50+ responsive components for dashboards and admin panels. Includes tables, charts, forms, and navigation. Compatible with Figma auto-layout.",
        price: 49.99,
        currency: "USD",
        type: "DIGITAL",
        published: true,
        categoryId: digitalTemplates.id,
        imageUrl: productImageUrls["figma-ui-kit"] ?? SEED_IMAGES["figma-ui-kit"],
      },
      update: productImageUrls["figma-ui-kit"]
        ? { imageUrl: productImageUrls["figma-ui-kit"] }
        : {},
    }),
    prisma.product.upsert({
      where: { slug: "react-nextjs-course" },
      create: {
        name: "React & Next.js — Full Course",
        slug: "react-nextjs-course",
        shortDescription: "From zero to production with React and Next.js.",
        description:
          "Video course with 12 hours of content. Build a full-stack app with App Router, auth, and deployment. Lifetime access and downloadable resources.",
        price: 89.99,
        compareAtPrice: 129.99,
        currency: "USD",
        type: "DIGITAL",
        published: true,
        categoryId: courses.id,
        metadata: { duration: "12h", lessons: 85 },
        imageUrl: productImageUrls["react-nextjs-course"] ?? SEED_IMAGES["react-nextjs-course"],
      },
      update: productImageUrls["react-nextjs-course"]
        ? { imageUrl: productImageUrls["react-nextjs-course"] }
        : {},
    }),
    prisma.product.upsert({
      where: { slug: "wireless-earbuds" },
      create: {
        name: "Wireless Earbuds Pro",
        slug: "wireless-earbuds",
        shortDescription: "Noise-cancelling wireless earbuds.",
        description:
          "High-quality sound, 24h battery life, and comfortable fit. Includes charging case and three ear tip sizes.",
        price: 79.99,
        currency: "USD",
        type: "PHYSICAL",
        published: true,
        stock: 100,
        categoryId: physicalElectronics.id,
        imageUrl: productImageUrls["wireless-earbuds"] ?? SEED_IMAGES["wireless-earbuds"],
      },
      update: productImageUrls["wireless-earbuds"]
        ? { imageUrl: productImageUrls["wireless-earbuds"] }
        : {},
    }),
    prisma.product.upsert({
      where: { slug: "desk-organizer" },
      create: {
        name: "Desk Organizer Set",
        slug: "desk-organizer",
        shortDescription: "Bamboo desk organizer with trays and pen holder.",
        description:
          "Sustainable bamboo desk organizer. Keeps cables, pens, and small items tidy. Set of 4 pieces.",
        price: 34.99,
        currency: "USD",
        type: "PHYSICAL",
        published: true,
        stock: 50,
        categoryId: physicalOffice.id,
        imageUrl: productImageUrls["desk-organizer"] ?? SEED_IMAGES["desk-organizer"],
      },
      update: productImageUrls["desk-organizer"]
        ? { imageUrl: productImageUrls["desk-organizer"] }
        : {},
    }),
  ]);

  const adminPhone = "+15550000001";
  const adminPhoneNormalized = adminPhone.replace(/\D/g, "");

  const adminUser = await prisma.user.upsert({
    where: { phoneNormalized: adminPhoneNormalized },
    create: {
      phone: adminPhone,
      phoneNormalized: adminPhoneNormalized,
      name: "Admin User",
      role: "ADMIN",
    },
    update: {},
  });

  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    create: {
      userId: adminUser.id,
      role: "SUPER_ADMIN",
    },
    update: {},
  });

  const customerUser = await prisma.user.upsert({
    where: { phoneNormalized: "+15550000002" },
    create: {
      phone: "+15550000002",
      phoneNormalized: "+15550000002",
      name: "Sample Customer",
      role: "USER",
    },
    update: {},
  });

  const existingOrders = await prisma.order.count({ where: { userId: customerUser.id } });
  if (existingOrders === 0) {
    await prisma.order.create({
      data: {
        userId: customerUser.id,
        status: "COMPLETED",
        subtotal: 19.99,
        total: 19.99,
        currency: "USD",
        paidAt: new Date(),
        completedAt: new Date(),
        orderItems: {
          create: {
            productId: products[0].id,
            quantity: 1,
            priceAtPurchase: 19.99,
          },
        },
      },
    });
    await prisma.order.create({
      data: {
        userId: customerUser.id,
        status: "PAID",
        subtotal: 129.98,
        total: 129.98,
        currency: "USD",
        paidAt: new Date(),
        orderItems: {
          create: [
            { productId: products[1].id, quantity: 1, priceAtPurchase: 49.99 },
            { productId: products[3].id, quantity: 1, priceAtPurchase: 79.99 },
          ],
        },
      },
    });
  }

  const digitalProduct = products[0];
  const existingAsset = await prisma.digitalAsset.findFirst({
    where: { productId: digitalProduct.id },
  });
  if (!existingAsset) {
    await prisma.digitalAsset.create({
      data: {
        productId: digitalProduct.id,
        filePath: "digital-templates/notion-life-planner.zip",
        fileName: "notion-life-planner.zip",
        mimeType: "application/zip",
        sizeBytes: 2_500_000,
        downloadExpiresInHours: 24,
        sortOrder: 0,
      },
    });
  }

  console.log("Seed complete.");
  console.log("  Main categories: 2 (Digital, Physical)");
  console.log("  Subcategories: 4 (Templates, Courses, Electronics, Office)");
  console.log("  Products:", products.length);
  console.log("  Admin user:", adminUser.phone, "(login via OTP to access dashboard)");
  console.log("  Sample orders: created if none existed for customer.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import Image from "next/image";
import Link from "next/link";

const skinCareGroups = [
  {
    title: "مقشر",
    images: [
      "https://images.unsplash.com/photo-1556229010-aa3f7ff66b24?w=900&q=85",
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=900&q=85",
      "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=900&q=85",
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=900&q=85",
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=900&q=85",
      "https://images.unsplash.com/photo-1556227702-d1e4e7b3f8c6?w=900&q=85",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=85",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=85",
      "https://images.unsplash.com/photo-1526758097130-bab247274f58?w=900&q=85",
      "https://images.unsplash.com/photo-1571781565036-d3f759be73e4?w=900&q=85",
    ],
  },
  {
    title: "مرطب",
    images: [
      "https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?w=900&q=85",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=900&q=85",
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=900&q=85",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=85",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900&q=85",
      "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=900&q=85",
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=85",
      "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=900&q=85",
      "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=900&q=85",
      "https://images.unsplash.com/photo-1556228724-4f6f4f2ab6ca?w=900&q=85",
    ],
  },
  {
    title: "تونر",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=85",
      "https://images.unsplash.com/photo-1629198735660-e39ea93f5c18?w=900&q=85",
      "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=900&q=85",
      "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=900&q=85",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=85",
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=900&q=85",
      "https://images.unsplash.com/photo-1571781565036-d3f759be73e4?w=900&q=85",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=85",
      "https://images.unsplash.com/photo-1526758097130-bab247274f58?w=900&q=85",
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=900&q=85",
    ],
  },
  {
    title: "سيروم",
    images: [
      "https://images.unsplash.com/photo-1629198735660-e39ea93f5c18?w=900&q=85",
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=900&q=85",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=900&q=85",
      "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=900&q=85",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=85",
      "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=900&q=85",
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=900&q=85",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=85",
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=900&q=85",
      "https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?w=900&q=85",
    ],
  },
  {
    title: "ماسك",
    images: [
      "https://images.unsplash.com/photo-1556227702-d1e4e7b3f8c6?w=900&q=85",
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=900&q=85",
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=85",
      "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=900&q=85",
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=900&q=85",
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=900&q=85",
      "https://images.unsplash.com/photo-1571781565036-d3f759be73e4?w=900&q=85",
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=900&q=85",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=85",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=900&q=85",
    ],
  },
];

export default function SkinCarePage() {
  return (
    <div className="space-y-8 text-start">
      <div className="flex items-center justify-between gap-3 flex-wrap rtl:flex-row-reverse">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-on-dark">عناية ب البشرة</h1>
        <Link
          href="/"
          className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition-all"
        >
          رجوع للرئيسية
        </Link>
      </div>

      {skinCareGroups.map((group) => (
        <section key={group.title} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">{group.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {group.images.map((image, index) => (
              <article
                key={`${group.title}-${index}`}
                className="overflow-hidden rounded-2xl border border-white/20 bg-black/20"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image}
                    alt={`${group.title} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

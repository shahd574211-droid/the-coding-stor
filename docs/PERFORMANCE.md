# أداء وقابلية الصيانة — Performance & Maintainability

## فهارس قاعدة البيانات (Indexes)

تم إضافة فهارس مركبة لتسريع الاستعلامات الأكثر استخداماً:

| الجدول | الفهرس | الاستخدام |
|--------|--------|-----------|
| **Product** | `(published, createdAt)` | قائمة المنتجات مرتبة بالتاريخ |
| **Product** | `(published, categoryId)` | تصفية حسب التصنيف |
| **Category** | `(parentId, sortOrder)` | جلب التصنيفات الرئيسية مع الفرعية مرتبة |
| **Order** | `(userId, createdAt)` | طلبات المستخدم مرتبة بالتاريخ |
| **Order** | `(status, createdAt)` | لوحة الإدارة — الطلبات حسب الحالة |
| **OTP** | `(phone, createdAt)` | التحقق من الرمز (أحدث رمز أولاً) |

### تطبيق الفهارس

بعد تعديل `prisma/schema.prisma` شغّل:

```bash
npx prisma migrate dev --name add_performance_indexes
```

للإنتاج:

```bash
npx prisma migrate deploy
```

---

## الكاش (Cache)

- **قائمة المنتجات** (`getPublishedProducts`): كاش لمدة 45 ثانية، مع إبطال عند إنشاء/تحديث/حذف منتج (`revalidateTag('products')`).
- **التصنيفات** (`getCategories`): كاش لمدة 5 دقائق (التصنيفات تتغير نادراً).

الإبطال التلقائي يتم من `admin-products` عند أي تعديل على المنتجات.

---

## تحسين الاستعلامات

- استخدام **select** بدل **include** حيث يكفي حقول محددة (تقليل حجم البيانات).
- **OTP**: جلب `id` و `otpHash` فقط في `findValidOtp`.
- **Product list**: جلب الحقول المعروضة فقط (بدون `description`, `metadata` في القوائم).

---

## اتصال قاعدة البيانات

- في الإنتاج يمكن إضافة **connection pooling** في `DATABASE_URL` (مثل `?connection_limit=10` أو استخدام PgBouncer).
- عميل Prisma مُهيأ كـ singleton لتجنب فتح اتصالات زائدة.

---

## الصيانة والتعديل

- **الفهارس**: أي استعلام جديد يُستخدم كثيراً يُفضّل أن يكون له فهرس مركب مناسب في `schema.prisma`.
- **الكاش**: تغيير مدة أو منطق الكاش من `src/server/actions/products.ts` (ثوابت `REVALIDATE_*` و `unstable_cache`).
- **إبطال الكاش**: استدعاء `revalidateTag('products')` أو `revalidateTag('categories')` عند تغيير البيانات من لوحة التحكم أو الـ API.

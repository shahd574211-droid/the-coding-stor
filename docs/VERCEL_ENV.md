# متغيرات البيئة المطلوبة على Vercel

للنشر على Vercel، أضف المتغيرات التالية في **Project Settings → Environment Variables**:

## مطلوبة للتشغيل

| المتغير | الوصف | أين تجدها |
|---------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | عنوان مشروع Supabase | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام (anon key) | نفس الصفحة → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح الخدمة (سري) | نفس الصفحة → service_role |
| `DATABASE_URL` | رابط PostgreSQL | Supabase → Settings → Database → Connection string |
| `ENCRYPTION_KEY` | مفتاح التشفير (32 حرف) | يُولَّد محلياً، راجع `env.auth.example.txt` |

## للمزايا الإضافية

| المتغير | متى تحتاجه |
|---------|------------|
| `API_INSTANT_WHATSAPP` + `API_TOKEN_WHATSAPP` | لإرسال OTP عبر واتساب |
| `BACKEND_NAME` أو `SUPABASE_STORAGE_BUCKET` | لرفع الصور والملفات |
| `SECRET_KEY_STOREG` أو `SECRET_KEY_STORAGE` | لتوقيع طلبات التخزين |

---

**ملاحظة:** تأكد من اختيار البيئة المناسبة (Production / Preview / Development) لكل متغير.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ProductType = "DIGITAL" | "PHYSICAL";

/** Minimal shape for category dropdown (matches getCategories() select) */
export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
  children?: { id: string; name: string; slug: string; sortOrder: number }[];
};

interface ProductFormProps {
  categories: CategoryOption[];
  submit: (form: {
    name: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    currency?: string;
    type: ProductType;
    published?: boolean;
    stock?: number | null;
    categoryId?: string | null;
    imageUrl?: string;
  }) => Promise<{ id: string } | unknown>;
  initialValues: {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    compareAtPrice?: number;
    currency?: string;
    type: ProductType;
    published: boolean;
    stock: number | null;
    categoryId: string | null;
    imageUrl: string;
  };
}

export function ProductForm({
  categories,
  submit,
  initialValues,
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialValues);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await submit({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        currency: form.currency ?? "IQD",
        type: form.type,
        published: form.published,
        stock: form.stock ?? undefined,
        categoryId: form.categoryId || undefined,
        imageUrl: form.imageUrl || undefined,
      });
      if (result && typeof result === "object" && "id" in result) {
        router.push("/admin/products");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Slug</label>
        <Input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="auto from name"
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Short description</label>
        <Input
          value={form.shortDescription}
          onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Price</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Compare at price (optional)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.compareAtPrice ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined,
              }))
            }
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Type</label>
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProductType }))}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="PHYSICAL">Physical</option>
          <option value="DIGITAL">Digital</option>
        </select>
      </div>
      {form.type === "PHYSICAL" && (
        <div>
          <label className="text-sm font-medium">Stock (leave empty for unlimited)</label>
          <Input
            type="number"
            min="0"
            value={form.stock ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                stock: e.target.value ? parseInt(e.target.value, 10) : null,
              }))
            }
            className="mt-1"
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Category</label>
        <select
          value={form.categoryId ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value || null }))}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Image (Supabase Storage)</label>
        <div className="mt-1 flex gap-2">
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://... or upload file"
            className="flex-1"
          />
          <label className="cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.set("file", f);
                try {
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  const data = await res.json();
                  if (data.url) setForm((prev) => ({ ...prev, imageUrl: data.url }));
                } catch {
                  // ignore
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Paste URL or upload to store in Supabase Storage (BACKEND_NAME bucket).
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          checked={form.published}
          onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="published" className="text-sm font-medium">
          Published (visible on storefront)
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

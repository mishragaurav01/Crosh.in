"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { Product, Category, ProductCreateInput, ProductUpdateInput } from "../types";
import { validateSlug } from "../validation";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: ProductCreateInput | ProductUpdateInput) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export default function ProductForm({
  product,
  categories,
  onSubmit,
  onCancel,
  error,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isEditing = !!product;

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const slugError = validateSlug(slug);
    if (slugError) {
      setFieldErrors({ slug: [slugError] });
      setLoading(false);
      return;
    }

    try {
      await onSubmit({ name, description: description || null, slug, categoryId });
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string; details?: Record<string, string[]> };
      if (apiErr.details) {
        setFieldErrors(apiErr.details);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-md">
      {error && (
        <div className="bg-error-container text-on-error-container px-lg py-md rounded-xl text-body-md">
          {error}
        </div>
      )}
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Product name"
        required
        error={fieldErrors.name?.[0]}
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description"
        error={fieldErrors.description?.[0]}
      />
      <Input
        label="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="product-slug"
        required
        maxLength={120}
        error={fieldErrors.slug?.[0]}
        hint="URL-friendly identifier (lowercase, hyphens)"
      />
      <Select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
        placeholder="Select a category"
        required
        error={fieldErrors.categoryId?.[0]}
      />
      <div className="flex justify-end gap-sm pt-sm">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { Category, CategoryCreateInput, CategoryUpdateInput } from "../types";

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryCreateInput | CategoryUpdateInput) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export default function CategoryForm({
  category,
  onSubmit,
  onCancel,
  error,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isEditing = !!category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);
    try {
      await onSubmit({ name, description: description || null, slug });
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
        placeholder="Category name"
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
        placeholder="category-slug"
        required
        error={fieldErrors.slug?.[0]}
        hint="URL-friendly identifier (lowercase, hyphens)"
      />
      <div className="flex justify-end gap-sm pt-sm">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? "Save Changes" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}

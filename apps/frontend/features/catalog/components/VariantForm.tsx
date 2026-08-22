"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { Variant, VariantCreateInput, VariantUpdateInput } from "../types";

interface VariantFormProps {
  variant?: Variant;
  onSubmit: (data: VariantCreateInput | VariantUpdateInput) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export default function VariantForm({
  variant,
  onSubmit,
  onCancel,
  error,
}: VariantFormProps) {
  const [sku, setSku] = useState(variant?.sku ?? "");
  const [size, setSize] = useState(variant?.size ?? "");
  const [color, setColor] = useState(variant?.color ?? "");
  const [price, setPrice] = useState(variant?.price?.toString() ?? "");
  const [stock, setStock] = useState(variant?.stock?.toString() ?? "0");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isEditing = !!variant;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const priceInt = parseInt(price, 10);
    const stockInt = parseInt(stock, 10);

    const validationErrors: Record<string, string[]> = {};
    if (isNaN(priceInt) || priceInt < 0) {
      validationErrors.price = ["Price must be a non-negative integer (in cents)"];
    }
    if (isNaN(stockInt) || stockInt < 0) {
      validationErrors.stock = ["Stock must be a non-negative integer"];
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      await onSubmit({ sku, size, color, price: priceInt, stock: stockInt });
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
        label="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        placeholder="e.g. TSHIRT-BLK-M"
        required
        error={fieldErrors.sku?.[0]}
      />
      <div className="grid grid-cols-2 gap-md">
        <Input
          label="Size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="e.g. M, L, XL"
          required
          error={fieldErrors.size?.[0]}
        />
        <Input
          label="Color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="e.g. Black"
          required
          error={fieldErrors.color?.[0]}
        />
      </div>
      <div className="grid grid-cols-2 gap-md">
        <Input
          label="Price (cents)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 2999"
          type="number"
          min="0"
          required
          error={fieldErrors.price?.[0]}
          hint="Amount in cents (e.g. 2999 = $29.99)"
        />
        <Input
          label="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="0"
          type="number"
          min="0"
          required
          error={fieldErrors.stock?.[0]}
        />
      </div>
      <div className="flex justify-end gap-sm pt-sm">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditing ? "Save Changes" : "Create Variant"}
        </Button>
      </div>
    </form>
  );
}

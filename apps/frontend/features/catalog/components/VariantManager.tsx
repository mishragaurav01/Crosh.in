"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import { PageLoading } from "@/components/ui/Loading";
import VariantForm from "./VariantForm";
import CatalogError from "./CatalogError";
import type { Variant, VariantCreateInput, VariantUpdateInput, ApiError } from "../types";
import {
  listVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../api";

const PAGE_LIMIT = 20;

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface VariantManagerProps {
  productId: string;
}

export default function VariantManager({ productId }: VariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [formError, setFormError] = useState<ApiError | string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const mounted = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  useEffect(() => {
    mounted.current = true;
    listVariants(productId, page, PAGE_LIMIT)
      .then((data) => {
        if (!mounted.current) return;
        setVariants(data.data);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (mounted.current) setError(err as ApiError);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [productId, page, refreshKey]);

  function reload(targetPage?: number) {
    setLoading(true);
    setError(null);
    if (targetPage !== undefined && targetPage !== page) {
      setPage(targetPage);
    }
    setRefreshKey((k) => k + 1);
  }

  function handlePageChange(nextPage: number) {
    setLoading(true);
    setError(null);
    setPage(nextPage);
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(variant: Variant) {
    setEditing(variant);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleFormSubmit(
    data: VariantCreateInput | VariantUpdateInput,
  ) {
    setFormError(null);
    try {
      if (editing) {
        await updateVariant(productId, editing.id, data as VariantUpdateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Variant updated");
        reload();
      } else {
        await createVariant(productId, data as VariantCreateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Variant created");
        reload(1);
      }
    } catch (err: unknown) {
      if (mounted.current) setFormError(err as ApiError);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVariant(productId, deleteTarget.id);
      if (!mounted.current) return;
      setDeleteTarget(null);
      setSuccess("Variant deleted");
      if (variants.length === 1 && page > 1) {
        reload(page - 1);
      } else {
        reload();
      }
    } catch (err: unknown) {
      if (!mounted.current) return;
      setDeleteTarget(null);
      setError(err as ApiError);
    } finally {
      if (mounted.current) setDeleting(false);
    }
  }

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {total} variant{total === 1 ? "" : "s"}
        </p>
        <Button onClick={openCreate}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Variant
        </Button>
      </div>

      {error && (
        <CatalogError error={error} onDismiss={() => setError(null)} />
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading ? (
        <PageLoading message="Loading variants..." />
      ) : variants.length === 0 && total === 0 ? (
        <EmptyState
          icon="style"
          title="No variants yet"
          description="Create a variant to define SKU, size, color, price, and stock for this product."
          action={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Variant
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={[
              { key: "sku", header: "SKU" },
              { key: "size", header: "Size" },
              { key: "color", header: "Color" },
              {
                key: "price",
                header: "Price",
                render: (v) => formatPrice(v.price),
              },
              { key: "stock", header: "Stock" },
              {
                key: "actions",
                header: "",
                render: (v) => (
                  <div className="flex justify-end gap-xs">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(v)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            data={variants}
            keyExtractor={(v) => v.id}
            emptyMessage="No variants found"
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit variant" : "Create variant"}
        maxWidth="md"
      >
        <div className="space-y-md">
          {formError && (
            <CatalogError error={formError} onDismiss={() => setFormError(null)} />
          )}
          <VariantForm
            variant={editing ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete variant"
        message={
          deleteTarget
            ? `Delete variant "${deleteTarget.sku}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

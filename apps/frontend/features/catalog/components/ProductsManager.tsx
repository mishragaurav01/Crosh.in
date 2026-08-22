"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import { PageLoading } from "@/components/ui/Loading";
import ProductForm from "./ProductForm";
import CatalogError from "./CatalogError";
import type { Product, Category, ProductCreateInput, ProductUpdateInput, ApiError } from "../types";
import {
  listProducts,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api";

const PAGE_LIMIT = 20;
const CATEGORY_LIMIT = 100;

export default function ProductsManager() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formError, setFormError] = useState<ApiError | string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const mounted = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  useEffect(() => {
    mounted.current = true;
    listCategories(1, CATEGORY_LIMIT)
      .then((data) => {
        if (!mounted.current) return;
        setCategories(data.data);
      })
      .catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    mounted.current = true;
    listProducts(page, PAGE_LIMIT, categoryFilter || undefined)
      .then((data) => {
        if (!mounted.current) return;
        setProducts(data.data);
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
  }, [page, categoryFilter, refreshKey]);

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

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

  function handleFilterChange(categoryId: string) {
    setLoading(true);
    setError(null);
    setCategoryFilter(categoryId);
    if (page !== 1) {
      setPage(1);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleFormSubmit(
    data: ProductCreateInput | ProductUpdateInput,
  ) {
    setFormError(null);
    try {
      if (editing) {
        await updateProduct(editing.id, data as ProductUpdateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Product updated");
        reload();
      } else {
        await createProduct(data as ProductCreateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Product created");
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
      await deleteProduct(deleteTarget.id);
      if (!mounted.current) return;
      setDeleteTarget(null);
      setSuccess("Product deleted");
      if (products.length === 1 && page > 1) {
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

  const startIndex = (page - 1) * PAGE_LIMIT;

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage products and their categories"
        actions={
          <Button onClick={openCreate}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Product
          </Button>
        }
      />

      {error && (
        <div className="mb-md">
          <CatalogError error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {success && (
        <div className="mb-md">
          <Alert variant="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </div>
      )}

      {loading ? (
        <PageLoading message="Loading products..." />
      ) : products.length === 0 && total === 0 ? (
        <EmptyState
          icon="inventory_2"
          title={categoryFilter ? "No products in this category" : "No products yet"}
          description={
            categoryFilter
              ? "Try a different category or clear the filter."
              : "Create your first product to start building the catalog."
          }
          action={
            categoryFilter ? (
              <Button variant="outline" onClick={() => handleFilterChange("")}>
                Clear filter
              </Button>
            ) : (
              <Button onClick={openCreate}>
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create Product
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-md">
          <div className="flex items-center justify-between gap-sm flex-wrap">
            <p className="text-body-md text-on-surface-variant">
              {total === 0
                ? "No products on this page"
                : `Showing ${startIndex + 1}\u2013${Math.min(startIndex + products.length, total)} of ${total} product${total === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-sm">
              <div className="w-56">
                <Select
                  placeholder="Filter by category"
                  value={categoryFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  aria-label="Filter by category"
                />
              </div>
              {categoryFilter && (
                <Button size="sm" variant="ghost" onClick={() => handleFilterChange("")}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <Table
            columns={[
              { key: "name", header: "Name" },
              { key: "slug", header: "Slug" },
              {
                key: "category",
                header: "Category",
                render: (p) =>
                  categoryNames.get(p.categoryId) ?? (
                    <span className="text-on-surface-variant">{"\u2014"}</span>
                  ),
              },
              {
                key: "createdAt",
                header: "Created",
                render: (p) => new Date(p.createdAt).toLocaleDateString(),
              },
              {
                key: "actions",
                header: "",
                render: (p) => (
                  <div className="flex justify-end gap-xs">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/catalog/products/${p.id}`)}
                    >
                      Variants
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(p)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            data={products}
            keyExtractor={(p) => p.id}
            emptyMessage="No products found"
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit product" : "Create product"}
        maxWidth="md"
      >
        <div className="space-y-md">
          {formError && (
            <CatalogError error={formError} onDismiss={() => setFormError(null)} />
          )}
          <ProductForm
            product={editing ?? undefined}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete product"
        message={
          deleteTarget
            ? `Delete product "${deleteTarget.name}"? This cannot be undone. Products with variants cannot be deleted; the product will also be removed from any collections it belongs to.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

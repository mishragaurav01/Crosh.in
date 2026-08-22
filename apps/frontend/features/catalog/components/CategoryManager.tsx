"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import { PageLoading } from "@/components/ui/Loading";
import CategoryForm from "./CategoryForm";
import CatalogError from "./CatalogError";
import type { Category, CategoryCreateInput, CategoryUpdateInput, ApiError } from "../types";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api";

const PAGE_LIMIT = 20;

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formError, setFormError] = useState<ApiError | string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const mounted = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  useEffect(() => {
    mounted.current = true;
    listCategories(page, PAGE_LIMIT)
      .then((data) => {
        if (!mounted.current) return;
        setCategories(data.data);
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
  }, [page, refreshKey]);

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

  function openEdit(category: Category) {
    setEditing(category);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleFormSubmit(
    data: CategoryCreateInput | CategoryUpdateInput,
  ) {
    setFormError(null);
    try {
      if (editing) {
        await updateCategory(editing.id, data as CategoryUpdateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Category updated");
        reload();
      } else {
        await createCategory(data as CategoryCreateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Category created");
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
      await deleteCategory(deleteTarget.id);
      if (!mounted.current) return;
      setDeleteTarget(null);
      setSuccess("Category deleted");
      if (categories.length === 1 && page > 1) {
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
        title="Categories"
        description="Manage product categories"
        actions={
          <Button onClick={openCreate}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Category
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
        <PageLoading message="Loading categories..." />
      ) : categories.length === 0 && total === 0 ? (
        <EmptyState
          icon="category"
          title="No categories yet"
          description="Create your first category to start organizing products."
          action={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Category
            </Button>
          }
        />
      ) : (
        <div className="space-y-md">
          <p className="text-body-md text-on-surface-variant">
            {total === 0
              ? "No categories on this page"
              : `Showing ${startIndex + 1}\u2013${Math.min(startIndex + categories.length, total)} of ${total} categor${total === 1 ? "y" : "ies"}`}
          </p>

          <Table
            columns={[
              { key: "name", header: "Name" },
              { key: "slug", header: "Slug" },
              {
                key: "description",
                header: "Description",
                render: (c) =>
                  c.description ? (
                    <span className="block max-w-[20rem] truncate">{c.description}</span>
                  ) : (
                    <span className="text-on-surface-variant">{"\u2014"}</span>
                  ),
              },
              {
                key: "createdAt",
                header: "Created",
                render: (c) => new Date(c.createdAt).toLocaleDateString(),
              },
              {
                key: "actions",
                header: "",
                render: (c) => (
                  <div className="flex justify-end gap-xs">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(c)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            data={categories}
            keyExtractor={(c) => c.id}
            emptyMessage="No categories found"
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
        title={editing ? "Edit category" : "Create category"}
        maxWidth="md"
      >
        <div className="space-y-md">
          {formError && (
            <CatalogError error={formError} onDismiss={() => setFormError(null)} />
          )}
          <CategoryForm
            category={editing ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete category"
        message={
          deleteTarget
            ? `Delete category "${deleteTarget.name}"? This cannot be undone. Categories with products assigned cannot be deleted.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

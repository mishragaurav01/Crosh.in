"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import { PageLoading } from "@/components/ui/Loading";
import CollectionForm from "./CollectionForm";
import CatalogError from "./CatalogError";
import type { Collection, CollectionCreateInput, CollectionUpdateInput, ApiError } from "../types";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from "../api";

const PAGE_LIMIT = 20;

export default function CollectionsManager() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [formError, setFormError] = useState<ApiError | string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const mounted = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  useEffect(() => {
    mounted.current = true;
    listCollections(page, PAGE_LIMIT)
      .then((data) => {
        if (!mounted.current) return;
        setCollections(data.data);
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

  function openEdit(collection: Collection) {
    setEditing(collection);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleFormSubmit(
    data: CollectionCreateInput | CollectionUpdateInput,
  ) {
    setFormError(null);
    try {
      if (editing) {
        await updateCollection(editing.id, data as CollectionUpdateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Collection updated");
        reload();
      } else {
        await createCollection(data as CollectionCreateInput);
        if (!mounted.current) return;
        setFormOpen(false);
        setSuccess("Collection created");
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
      await deleteCollection(deleteTarget.id);
      if (!mounted.current) return;
      setDeleteTarget(null);
      setSuccess("Collection deleted");
      if (collections.length === 1 && page > 1) {
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
        title="Collections"
        description="Manage product collections"
        actions={
          <Button onClick={openCreate}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Collection
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
        <PageLoading message="Loading collections..." />
      ) : collections.length === 0 && total === 0 ? (
        <EmptyState
          icon="collections"
          title="No collections yet"
          description="Create your first collection to start grouping products."
          action={
            <Button onClick={openCreate}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Collection
            </Button>
          }
        />
      ) : (
        <div className="space-y-md">
          <p className="text-body-md text-on-surface-variant">
            {total === 0
              ? "No collections on this page"
              : `Showing ${startIndex + 1}\u2013${Math.min(startIndex + collections.length, total)} of ${total} collection${total === 1 ? "" : "s"}`}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/catalog/collections/${c.id}`)}
                    >
                      Products
                    </Button>
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
            data={collections}
            keyExtractor={(c) => c.id}
            emptyMessage="No collections found"
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
        title={editing ? "Edit collection" : "Create collection"}
        maxWidth="md"
      >
        <div className="space-y-md">
          {formError && (
            <CatalogError error={formError} onDismiss={() => setFormError(null)} />
          )}
          <CollectionForm
            collection={editing ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete collection"
        message={
          deleteTarget
            ? `Delete collection "${deleteTarget.name}"? This cannot be undone. Products will not be deleted \u2014 they will only be removed from this collection.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

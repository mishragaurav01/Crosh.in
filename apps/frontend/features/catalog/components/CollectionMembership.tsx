"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { PageLoading } from "@/components/ui/Loading";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import CatalogError from "./CatalogError";
import type { Product, ProductCollection, ApiError } from "../types";
import {
  listProducts,
  listCollectionProducts,
  addProductToCollection,
  removeProductFromCollection,
} from "../api";

const PAGE_LIMIT = 20;
const PRODUCT_LIMIT = 100;

interface CollectionMembershipProps {
  collectionId: string;
  collectionName: string;
}

export default function CollectionMembership({
  collectionId,
  collectionName,
}: CollectionMembershipProps) {
  const [memberships, setMemberships] = useState<ProductCollection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addError, setAddError] = useState<ApiError | string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ProductCollection | null>(null);
  const [removing, setRemoving] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    listCollectionProducts(collectionId, page, PAGE_LIMIT)
      .then((data) => {
        if (!mounted.current) return;
        setMemberships(data.data);
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
  }, [collectionId, page, refreshKey]);

  useEffect(() => {
    listProducts(1, PRODUCT_LIMIT)
      .then((data) => {
        if (!mounted.current) return;
        setProducts(data.data);
      })
      .catch(() => {});
  }, [collectionId]);

  function reload(targetPage?: number) {
    setLoading(true);
    setError(null);
    if (targetPage !== undefined && targetPage !== page) {
      setPage(targetPage);
    }
    setRefreshKey((k) => k + 1);
  }

  function openAddDialog() {
    setShowAddDialog(true);
    setSearch("");
    setAddError(null);
    listProducts(1, PRODUCT_LIMIT)
      .then((data) => {
        if (!mounted.current) return;
        setProducts(data.data);
      })
      .catch(() => {});
  }

  async function handleAdd(productId: string) {
    setAddingId(productId);
    setAddError(null);
    try {
      await addProductToCollection(collectionId, productId);
      if (!mounted.current) return;
      setShowAddDialog(false);
      setSearch("");
      setSuccess("Product added to collection");
      reload(1);
    } catch (err: unknown) {
      if (!mounted.current) return;
      setAddError(err as ApiError);
    } finally {
      if (mounted.current) setAddingId(null);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeProductFromCollection(collectionId, removeTarget.productId);
      if (!mounted.current) return;
      setRemoveTarget(null);
      setSuccess("Product removed from collection");
      if (memberships.length === 1 && page > 1) {
        reload(page - 1);
      } else {
        reload();
      }
    } catch (err: unknown) {
      if (!mounted.current) return;
      setRemoveTarget(null);
      // The backend reuses DUPLICATE_COLLECTION_MEMBERSHIP (404) to mean
      // "product is not in this collection"; its message is accurate here,
      // whereas the shared code map reads oddly for removals.
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to remove product");
    } finally {
      if (mounted.current) setRemoving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const memberProductIds = useMemo(
    () => new Set(memberships.map((m) => m.productId)),
    [memberships],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          !memberProductIds.has(p.id) &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.slug.toLowerCase().includes(search.toLowerCase())),
      ),
    [products, memberProductIds, search],
  );

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {total} product{total === 1 ? "" : "s"} in{" "}
          <span className="font-label-md text-on-surface">{collectionName}</span>
        </p>
        <Button onClick={openAddDialog}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Product
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
        <PageLoading message="Loading collection products..." />
      ) : memberships.length === 0 && total === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="No products in this collection"
          description="Add products to this collection to get started."
          action={
            <Button onClick={openAddDialog}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Product
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={[
              {
                key: "productId",
                header: "Product",
                render: (m) => {
                  const product = productById.get(m.productId);
                  return product ? (
                    <div>
                      <p className="text-body-md text-on-surface">{product.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{product.slug}</p>
                    </div>
                  ) : (
                    <span className="text-on-surface-variant">{m.productId}</span>
                  );
                },
              },
              {
                key: "createdAt",
                header: "Added",
                render: (m) => new Date(m.createdAt).toLocaleDateString(),
              },
              {
                key: "actions",
                header: "",
                render: (m) => (
                  <div className="flex justify-end">
                    <Button size="sm" variant="danger" onClick={() => setRemoveTarget(m)}>
                      Remove
                    </Button>
                  </div>
                ),
              },
            ]}
            data={memberships}
            keyExtractor={(m) => m.id}
            emptyMessage="No products in this collection"
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              setLoading(true);
              setError(null);
              setPage(nextPage);
            }}
          />
        </>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove from collection"
        message="Remove this product from the collection? The product itself will not be deleted."
        confirmLabel="Remove"
        loading={removing}
      />

      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSearch("");
          setAddError(null);
        }}
        title="Add product to collection"
        maxWidth="md"
      >
        <div className="space-y-md">
          {addError && (
            <CatalogError error={addError} onDismiss={() => setAddError(null)} />
          )}
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-xs">
            {filteredProducts.length === 0 ? (
              <p className="text-body-md text-on-surface-variant text-center py-md">
                {search ? "No products match your search" : "No available products to add"}
              </p>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-md py-sm rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  <div>
                    <p className="text-body-md text-on-surface">{p.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{p.slug}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdd(p.id)}
                    loading={addingId === p.id}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

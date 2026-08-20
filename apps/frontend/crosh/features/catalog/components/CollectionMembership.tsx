"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { PageLoading } from "@/components/ui/Loading";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import type { Product, ProductCollection, ApiError } from "../types";
import {
  listProducts,
  listCollectionProducts,
  addProductToCollection,
  removeProductFromCollection,
} from "../api";

interface CollectionMembershipProps {
  collectionId: string;
  collectionName: string;
}

export default function CollectionMembership({
  collectionId,
  collectionName,
}: CollectionMembershipProps) {
  const [memberships, setMemberships] = useState<ProductCollection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProductCollection | null>(null);
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCollectionProducts(collectionId);
      if (mounted.current) setMemberships(data.data);
    } catch {
      if (mounted.current) setError("Failed to load collection products");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    mounted.current = true;
    listCollectionProducts(collectionId)
      .then((data) => { if (mounted.current) setMemberships(data.data); })
      .catch(() => { if (mounted.current) setError("Failed to load collection products"); })
      .finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [collectionId]);

  async function loadProductsForAdd() {
    try {
      const data = await listProducts(1, 100);
      setProducts(data.data);
    } catch {
      setError("Failed to load products");
    }
  }

  async function handleAdd(productId: string) {
    setAdding(true);
    try {
      await addProductToCollection(collectionId, productId);
      setShowAddDialog(false);
      await refresh();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.code === "DUPLICATE_COLLECTION_MEMBERSHIP") {
        setError("This product is already in the collection");
      } else {
        setError(apiErr.message || "Failed to add product");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeProductFromCollection(collectionId, removeTarget.productId);
      setRemoveTarget(null);
      await refresh();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to remove product");
    } finally {
      setRemoving(false);
    }
  }

  const memberProductIds = new Set(memberships.map((m) => m.productId));

  const filteredProducts = products.filter(
    (p) =>
      !memberProductIds.has(p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())),
  );

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-md">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {memberships.length} product{memberships.length !== 1 ? "s" : ""} in{" "}
          <span className="font-label-md text-on-surface">{collectionName}</span>
        </p>
        <Button
          size="sm"
          onClick={() => {
            setShowAddDialog(true);
            loadProductsForAdd();
          }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Product
        </Button>
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="No products in this collection"
          description="Add products to this collection to get started."
        />
      ) : (
        <Table
          columns={[
            { key: "productId", header: "Product ID" },
            { key: "createdAt", header: "Added", render: (m) => new Date(m.createdAt).toLocaleDateString() },
          ]}
          data={memberships}
          keyExtractor={(m) => m.id}
          emptyMessage="No products in this collection"
        />
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
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
        }}
        title="Add product to collection"
        maxWidth="md"
      >
        <div className="space-y-md">
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
                    loading={adding}
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

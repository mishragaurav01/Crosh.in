"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { PageLoading } from "@/components/ui/Loading";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import CatalogError from "./CatalogError";
import { formatPrice } from "../format";
import type { Product, Variant, VariantCollection, ApiError } from "../types";
import {
  listProducts,
  listVariants,
  listCollectionVariants,
  addVariantToCollection,
  removeVariantFromCollection,
} from "../api";

const PAGE_LIMIT = 20;
const PRODUCT_LIMIT = 100;
const VARIANT_LIMIT = 100;

interface CollectionMembershipProps {
  collectionId: string;
  collectionName: string;
}

export default function CollectionMembership({
  collectionId,
  collectionName,
}: CollectionMembershipProps) {
  const [memberships, setMemberships] = useState<VariantCollection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [variantsByProduct, setVariantsByProduct] = useState<Map<string, Variant[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addError, setAddError] = useState<ApiError | string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<VariantCollection | null>(null);
  const [removing, setRemoving] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addingAllId, setAddingAllId] = useState<string | null>(null);
  const [localAdded, setLocalAdded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    listCollectionVariants(collectionId, page, PAGE_LIMIT)
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
  }, [collectionId, page, refreshKey]);

  useEffect(() => {
    listProducts(1, PRODUCT_LIMIT)
      .then(async (data) => {
        if (!mounted.current) return;
        setProducts(data.data);
        const results = await Promise.all(
          data.data.map((p) =>
            listVariants(p.id, 1, VARIANT_LIMIT).catch(() => null),
          ),
        );
        if (!mounted.current) return;
        const map = new Map<string, Variant[]>();
        results.forEach((result, index) => {
          if (result) map.set(data.data[index].id, result.data);
        });
        setVariantsByProduct(map);
      })
      .catch(() => {});
  }, [collectionId]);

  function reload(targetPage?: number) {
    setLoading(true);
    setError(null);
    setLocalAdded(new Set());
    if (targetPage !== undefined && targetPage !== page) {
      setPage(targetPage);
    }
    setRefreshKey((k) => k + 1);
  }

  function openAddDialog() {
    setShowAddDialog(true);
    setSearch("");
    setAddError(null);
    setAddSuccess(null);
    listProducts(1, PRODUCT_LIMIT)
      .then(async (data) => {
        if (!mounted.current) return;
        setProducts(data.data);
        const results = await Promise.all(
          data.data.map((p) =>
            listVariants(p.id, 1, VARIANT_LIMIT).catch(() => null),
          ),
        );
        if (!mounted.current) return;
        const map = new Map<string, Variant[]>();
        results.forEach((result, index) => {
          if (result) map.set(data.data[index].id, result.data);
        });
        setVariantsByProduct(map);
      })
      .catch(() => {});
  }

  async function handleAddVariant(variant: Variant) {
    setAddingId(variant.id);
    setAddError(null);
    try {
      await addVariantToCollection(collectionId, variant.id);
      if (!mounted.current) return;
      setLocalAdded((prev) => new Set(prev).add(variant.id));
      setAddSuccess(`"${variant.sku}" added to collection`);
      reload();
    } catch (err: unknown) {
      if (!mounted.current) return;
      setAddError(err as ApiError);
    } finally {
      if (mounted.current) setAddingId(null);
    }
  }

  async function handleAddAll(product: Product) {
    const variants = variantsByProduct.get(product.id) ?? [];
    const missing = variants.filter((v) => !memberVariantIds.has(v.id));
    if (missing.length === 0) return;
    setAddingAllId(product.id);
    setAddError(null);
    let addedCount = 0;
    try {
      for (const variant of missing) {
        await addVariantToCollection(collectionId, variant.id);
        addedCount += 1;
        if (mounted.current) {
          setLocalAdded((prev) => new Set(prev).add(variant.id));
        }
      }
      if (!mounted.current) return;
      setShowAddDialog(false);
      setSearch("");
      setSuccess(
        `${addedCount} variant${addedCount === 1 ? "" : "s"} added to collection`,
      );
      reload(1);
    } catch (err: unknown) {
      if (!mounted.current) return;
      setAddError(err as ApiError);
      if (addedCount > 0) {
        setAddSuccess(
          `${addedCount} variant${addedCount === 1 ? "" : "s"} added before the error`,
        );
        reload();
      }
    } finally {
      if (mounted.current) setAddingAllId(null);
    }
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeVariantFromCollection(collectionId, removeTarget.variantId);
      if (!mounted.current) return;
      setRemoveTarget(null);
      setSuccess("Variant removed from collection");
      if (memberships.length === 1 && page > 1) {
        reload(page - 1);
      } else {
        reload();
      }
    } catch (err: unknown) {
      if (!mounted.current) return;
      setRemoveTarget(null);
      // The backend reuses DUPLICATE_COLLECTION_MEMBERSHIP (404) to mean
      // "variant is not in this collection"; its message is accurate here,
      // whereas the shared code map reads oddly for removals.
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to remove variant");
    } finally {
      if (mounted.current) setRemoving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const variantById = useMemo(() => {
    const map = new Map<string, Variant>();
    for (const variants of variantsByProduct.values()) {
      for (const variant of variants) map.set(variant.id, variant);
    }
    return map;
  }, [variantsByProduct]);

  const productByVariantId = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) {
      for (const variant of variantsByProduct.get(product.id) ?? []) {
        map.set(variant.id, product);
      }
    }
    return map;
  }, [products, variantsByProduct]);

  const memberVariantIds = new Set(localAdded);
  for (const membership of memberships) memberVariantIds.add(membership.variantId);

  const filteredGroups = useMemo(
    () =>
      products
        .map((product) => {
          const variants = variantsByProduct.get(product.id) ?? [];
          const query = search.trim().toLowerCase();
          const productMatches =
            query === "" ||
            product.name.toLowerCase().includes(query) ||
            product.slug.toLowerCase().includes(query);
          const visibleVariants = productMatches
            ? variants
            : variants.filter(
                (v) =>
                  v.sku.toLowerCase().includes(query) ||
                  v.size.toLowerCase().includes(query) ||
                  v.color.toLowerCase().includes(query),
              );
          return { product, variants: visibleVariants };
        })
        .filter((group) => group.variants.length > 0),
    [products, variantsByProduct, search],
  );

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {total} variant{total === 1 ? "" : "s"} in{" "}
          <span className="font-label-md text-on-surface">{collectionName}</span>
        </p>
        <Button onClick={openAddDialog}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Variants
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
        <PageLoading message="Loading collection variants..." />
      ) : memberships.length === 0 && total === 0 ? (
        <EmptyState
          icon="style"
          title="No variants in this collection"
          description="Add variants to this collection to get started."
          action={
            <Button onClick={openAddDialog}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Variants
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={[
              {
                key: "variant",
                header: "Variant",
                render: (m) => {
                  const variant = variantById.get(m.variantId);
                  return variant ? (
                    <div>
                      <p className="text-body-md text-on-surface">{variant.sku}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {variant.size} · {variant.color}
                      </p>
                    </div>
                  ) : (
                    <span className="text-on-surface-variant">{m.variantId}</span>
                  );
                },
              },
              {
                key: "product",
                header: "Product",
                render: (m) => {
                  const product = productByVariantId.get(m.variantId);
                  return product ? (
                    <span className="text-body-md text-on-surface">{product.name}</span>
                  ) : (
                    <span className="text-on-surface-variant">{"\u2014"}</span>
                  );
                },
              },
              {
                key: "price",
                header: "Price",
                render: (m) => {
                  const variant = variantById.get(m.variantId);
                  return variant ? (
                    formatPrice(variant.price)
                  ) : (
                    <span className="text-on-surface-variant">{"\u2014"}</span>
                  );
                },
              },
              {
                key: "stock",
                header: "Stock",
                render: (m) => {
                  const variant = variantById.get(m.variantId);
                  return variant ? (
                    variant.stock
                  ) : (
                    <span className="text-on-surface-variant">{"\u2014"}</span>
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
            emptyMessage="No variants in this collection"
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
        message="Remove this variant from the collection? The variant itself will not be deleted."
        confirmLabel="Remove"
        loading={removing}
      />

      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSearch("");
          setAddError(null);
          setAddSuccess(null);
        }}
        title="Add variants to collection"
        maxWidth="md"
      >
        <div className="space-y-md">
          {addError && (
            <CatalogError error={addError} onDismiss={() => setAddError(null)} />
          )}
          {addSuccess && (
            <Alert variant="success" onClose={() => setAddSuccess(null)}>
              {addSuccess}
            </Alert>
          )}
          <Input
            placeholder="Search products or variants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-sm">
            {filteredGroups.length === 0 ? (
              <p className="text-body-md text-on-surface-variant text-center py-md">
                {search ? "No products or variants match your search" : "No products available to add"}
              </p>
            ) : (
              filteredGroups.map(({ product, variants }) => {
                const assignedCount = variants.filter((v) =>
                  memberVariantIds.has(v.id),
                ).length;
                const allAssigned =
                  assignedCount === variants.length &&
                  (variantsByProduct.get(product.id)?.length ?? 0) > 0;
                const busy = addingAllId !== null || addingId !== null;
                return (
                  <div key={product.id} className="space-y-xs">
                    <div className="flex items-center justify-between px-md py-sm">
                      <div>
                        <p className="text-body-md text-on-surface">{product.name}</p>
                        <p className="text-label-sm text-on-surface-variant">{product.slug}</p>
                      </div>
                      {allAssigned ? (
                        <Badge variant="primary">All in collection</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddAll(product)}
                          loading={addingAllId === product.id}
                          disabled={busy && addingAllId !== product.id}
                        >
                          Add all{assignedCount > 0 ? ` (${variants.length - assignedCount})` : ""}
                        </Button>
                      )}
                    </div>
                    {(variantsByProduct.get(product.id)?.length ?? 0) === 0 ? (
                      <p className="text-label-md text-on-surface-variant px-md pl-lg">
                        No variants — create variants on the product first.
                      </p>
                    ) : (
                      variants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between px-md pl-lg py-xs rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                          <div>
                            <p className="text-body-md text-on-surface">{v.sku}</p>
                            <p className="text-label-sm text-on-surface-variant">
                              {v.size} · {v.color} · {formatPrice(v.price)}
                            </p>
                          </div>
                          {memberVariantIds.has(v.id) ? (
                            <Badge variant="primary">In collection</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddVariant(v)}
                              loading={addingId === v.id}
                              disabled={busy && addingId !== v.id}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

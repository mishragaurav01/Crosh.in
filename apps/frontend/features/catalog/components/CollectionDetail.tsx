"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { PageLoading } from "@/components/ui/Loading";
import CatalogError from "./CatalogError";
import CollectionMembership from "./CollectionMembership";
import type { Collection, ApiError } from "../types";
import { getCollection } from "../api";

interface CollectionDetailProps {
  collectionId: string;
}

export default function CollectionDetail({ collectionId }: CollectionDetailProps) {
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    getCollection(collectionId)
      .then((data) => {
        if (!mounted.current) return;
        setCollection(data);
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
  }, [collectionId]);

  if (loading) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-md"
          onClick={() => router.push("/catalog/collections")}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Collections
        </Button>
        <PageLoading message="Loading collection..." />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-md"
          onClick={() => router.push("/catalog/collections")}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Collections
        </Button>
        <CatalogError error={error ?? "Collection not found"} />
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-md"
        onClick={() => router.push("/catalog/collections")}
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Collections
      </Button>

      <PageHeader title={collection.name} description={collection.description ?? undefined} />

      <CollectionMembership collectionId={collection.id} collectionName={collection.name} />
    </div>
  );
}

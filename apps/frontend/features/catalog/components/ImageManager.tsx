"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import MediaGallery from "./MediaGallery";
import type { ImageOwnerType } from "../types";

interface ImageManagerProps {
  ownerType: ImageOwnerType;
  ownerId: string;
  maxImages: number;
}

/**
 * Pairs the gallery and uploader for one owner so their capacity stays in
 * sync: uploads trigger a gallery refetch, gallery changes update the
 * uploader's remaining slots.
 */
export default function ImageManager({
  ownerType,
  ownerId,
  maxImages,
}: ImageManagerProps) {
  const [imageCount, setImageCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-md">
      <MediaGallery
        ownerType={ownerType}
        ownerId={ownerId}
        refreshKey={refreshKey}
        onChange={(images) => setImageCount(images.length)}
      />
      <ImageUploader
        ownerType={ownerType}
        ownerId={ownerId}
        maxImages={maxImages}
        currentCount={imageCount}
        onUploaded={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
}

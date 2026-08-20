import Alert from "@/components/ui/Alert";
import type { ApiError } from "../types";

interface CatalogErrorProps {
  error: ApiError | string | null;
  onDismiss?: () => void;
}

function getErrorMessage(error: ApiError | string): { title: string; message: string } {
  if (typeof error === "string") {
    return { title: "Error", message: error };
  }

  const codeMessages: Record<string, string> = {
    CATEGORY_NOT_FOUND: "The category was not found.",
    COLLECTION_NOT_FOUND: "The collection was not found.",
    PRODUCT_NOT_FOUND: "The product was not found.",
    VARIANT_NOT_FOUND: "The variant was not found.",
    DUPLICATE_SLUG: "A record with this slug already exists.",
    DUPLICATE_SKU: "A variant with this SKU already exists.",
    DUPLICATE_COLLECTION_MEMBERSHIP: "This product is already in the collection.",
    INVALID_CATEGORY: "The selected category does not exist.",
    INVALID_PRODUCT: "The selected product does not exist.",
    VALIDATION_ERROR: "Please check your input and try again.",
    UNAUTHENTICATED: "Your session has expired. Please sign in again.",
    FORBIDDEN: "You do not have permission to perform this action.",
  };

  return {
    title: "Error",
    message: codeMessages[error.code] || error.message || "An unexpected error occurred.",
  };
}

export default function CatalogError({ error, onDismiss }: CatalogErrorProps) {
  if (!error) return null;

  const { title, message } = getErrorMessage(error);

  return (
    <Alert variant="error" title={title} onClose={onDismiss}>
      {message}
    </Alert>
  );
}

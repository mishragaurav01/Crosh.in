import ProductDetail from "@/features/catalog/components/ProductDetail";

export const metadata = {
  title: "Product | Catalog Admin",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}

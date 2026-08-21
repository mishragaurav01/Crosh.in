import CollectionDetail from "@/features/catalog/components/CollectionDetail";

export const metadata = {
  title: "Collection | Catalog Admin",
};

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetail collectionId={id} />;
}

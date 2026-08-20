import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Collections | Catalog Admin",
};

export default function CollectionsPage() {
  return (
    <div>
      <PageHeader
        title="Collections"
        description="Manage product collections"
      />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-xl text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-md block">
          collections
        </span>
        <p className="text-body-md text-on-surface-variant">
          Collections management coming soon.
        </p>
      </div>
    </div>
  );
}

import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Products | Catalog Admin",
};

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage catalog products"
      />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-xl text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-md block">
          inventory_2
        </span>
        <p className="text-body-md text-on-surface-variant">
          Products management coming soon.
        </p>
      </div>
    </div>
  );
}

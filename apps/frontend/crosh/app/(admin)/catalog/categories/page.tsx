import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Categories | Catalog Admin",
};

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage product categories"
      />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-xl text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-md block">
          category
        </span>
        <p className="text-body-md text-on-surface-variant">
          Categories management coming soon.
        </p>
      </div>
    </div>
  );
}

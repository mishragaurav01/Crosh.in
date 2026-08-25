export default function ProductLoading() {
  return (
    <div
      role="status"
      aria-label="Loading product"
      className="pb-32 animate-pulse"
    >
      <div className="h-[487px] w-full bg-surface-container-high" />

      <div className="mt-xl flex items-start justify-between px-container-margin">
        <div className="h-6 w-48 rounded-full bg-surface-container-high" />
        <div className="h-6 w-20 rounded-full bg-surface-container-high" />
      </div>

      <div className="mt-md space-y-sm px-container-margin">
        <div className="h-4 w-full rounded-full bg-surface-container-high" />
        <div className="h-4 w-2/3 rounded-full bg-surface-container-high" />
      </div>

      <div className="mt-xl flex gap-md px-container-margin">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-12 w-12 rounded-full bg-surface-container-high" />
        ))}
      </div>

      <div className="mt-xl px-container-margin">
        <div className="h-[68px] w-full rounded-xl bg-surface-container-high" />
      </div>
    </div>
  );
}

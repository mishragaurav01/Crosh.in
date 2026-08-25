export default function ProductsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className="flex flex-col gap-xl pt-md pb-32 animate-pulse"
    >
      <div className="flex items-end justify-between px-container-margin">
        <div className="h-[38px] w-40 rounded-full bg-surface-container-high" />
        <div className="h-[42px] w-24 rounded-full bg-surface-container-high" />
      </div>

      <div className="flex gap-sm overflow-hidden px-container-margin pt-sm">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[42px] w-20 shrink-0 rounded-full bg-surface-container-high" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-gutter gap-y-[31px] px-container-margin">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-full aspect-[3/4] rounded-3xl bg-surface-container-high" />
        ))}
      </div>
    </div>
  );
}

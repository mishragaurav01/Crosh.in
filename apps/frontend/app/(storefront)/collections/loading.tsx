export default function CollectionsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading collections"
      className="pt-md pb-32 animate-pulse"
    >
      <div className="h-[38px] w-48 rounded-full bg-surface-container-high mx-container-margin" />

      <div className="mt-xl grid grid-cols-2 gap-y-xl px-container-margin">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-sm">
            <div className="h-[140px] w-[140px] rounded-full bg-surface-container-high" />
            <div className="h-4 w-24 rounded-full bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CollectionLoading() {
  return (
    <div
      role="status"
      aria-label="Loading collection"
      className="pt-md pb-32 animate-pulse"
    >
      <div className="mx-md h-[200px] rounded-3xl bg-surface-container-high" />

      <div className="mt-lg h-[38px] w-56 rounded-full bg-surface-container-high mx-container-margin" />

      <div className="mt-xl flex flex-col gap-xl px-container-margin">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex}>
            <div className="h-5 w-40 rounded-full bg-surface-container-high" />
            <div className="mt-sm space-y-sm">
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <div key={rowIndex} className="h-8 w-full rounded-full bg-surface-container-high" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

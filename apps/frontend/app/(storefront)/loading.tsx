export default function StorefrontLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-col gap-[47px] pt-md pb-32 animate-pulse"
    >
      <div className="mx-container-margin w-full h-[437px] rounded-3xl bg-surface-container-high" />
      <div className="flex flex-col gap-md">
        <div className="px-container-margin h-6 w-48 rounded-full bg-surface-container-high" />
        <div className="flex gap-md overflow-hidden px-container-margin">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="shrink-0 w-[200px] h-[200px] rounded-full bg-surface-container-high"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-gutter px-container-margin">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="w-full aspect-[3/4] rounded-3xl bg-surface-container-high" />
        ))}
      </div>
    </div>
  );
}

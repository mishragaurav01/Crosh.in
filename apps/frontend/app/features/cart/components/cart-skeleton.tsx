export default function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your cart"
      className="flex flex-col gap-md px-container-margin pt-md pb-32 animate-pulse"
    >
      <div className="h-[38px] w-40 rounded-full bg-surface-container-high" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-md py-lg">
          <div className="w-20 h-[100px] shrink-0 rounded-xl bg-surface-container-high" />
          <div className="flex-1 flex flex-col gap-sm justify-center">
            <div className="h-[22px] w-3/4 rounded-full bg-surface-container-high" />
            <div className="h-[16px] w-1/2 rounded-full bg-surface-container-high" />
            <div className="h-[16px] w-1/3 rounded-full bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}

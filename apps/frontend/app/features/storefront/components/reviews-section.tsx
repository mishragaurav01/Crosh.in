import type { ReactNode } from "react";

function Stars() {
  return (
    <span
      aria-hidden="true"
      className="flex gap-[2px] text-primary"
      role="img"
      aria-label="5 out of 5 stars"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="material-symbols-outlined text-[15px]">
          star
        </span>
      ))}
    </span>
  );
}

interface Review {
  author: string;
  quote: string;
}

/**
 * STATIC sample layout only — no reviews backend exists this pass
 * (Integration Gap table). Copy is sample text, not user data; when a real
 * backend arrives, submitted text must render as text, never HTML.
 */
const SAMPLE_REVIEWS: Review[] = [
  {
    author: "Aarav S.",
    quote:
      "Beautifully made and even lovelier in person. The weave has a warmth you can feel — packaging was thoughtful too.",
  },
];

export default function ReviewsSection({
  rating = "4.8",
  count = 24,
  children,
}: {
  rating?: string;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <section aria-label="Reviews" className="mt-xl px-container-margin">
      <div className="flex items-center gap-sm">
        <h2 className="font-playfair text-[16px] leading-[24px] text-on-background">
          Reviews
        </h2>
        <Stars />
        <span className="font-label-md text-[14px] leading-[20px] font-medium tracking-[0.7px] text-on-background">
          {rating}
        </span>
        <span className="font-body-md text-body-md text-on-surface-variant">
          ({count})
        </span>
      </div>

      <ul className="mt-md flex flex-col gap-md">
        {SAMPLE_REVIEWS.map((review) => (
          <li
            key={review.author}
            className="rounded-2xl bg-surface-container-low p-6 shadow-review-card"
          >
            <p className="font-inter text-[12px] leading-[17px] font-semibold text-on-background">
              {review.author}
            </p>
            <div className="mt-xs">
              <Stars />
            </div>
            <p className="mt-sm text-[16px] leading-[26px] font-inter text-on-surface-variant">
              “{review.quote}”
            </p>
          </li>
        ))}
      </ul>

      {children}
    </section>
  );
}

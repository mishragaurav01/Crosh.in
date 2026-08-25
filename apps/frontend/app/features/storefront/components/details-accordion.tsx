"use client";

import { useState } from "react";

export interface AccordionItem {
  title: string;
  content: string;
}

/**
 * Details accordion per design-notes: dividers #E8E1E0, Inter 500 14/20
 * tracked headers, rotating chevron. Rows are composed by the page from real
 * product fields only — no invented copy.
 */
export default function DetailsAccordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-xl space-y-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.title}
            className={`group border-t border-outline-variant/30 py-md ${index === items.length - 1 ? "border-b" : ""
              }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="font-label-md text-on-surface">
                {item.title}
              </span>
              <span
                aria-hidden="true"
                className={`material-symbols-outlined text-on-surface transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                  }`}
              >
                expand_more
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-400 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div className="pt-md text-body-md text-on-surface-variant whitespace-pre-line">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

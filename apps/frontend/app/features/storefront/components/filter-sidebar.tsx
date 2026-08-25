"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CategoryListItemDto } from "../types";

interface FilterDrawerProps {
    categories: CategoryListItemDto[];
    activeCategory?: string;
}

const ALL_COLORS = [
    { name: "Sage", hex: "#E5E9E2" },
    { name: "Oatmeal", hex: "#F3ECEC" },
    { name: "Petal", hex: "#F7D8D8" },
    { name: "Golden", hex: "#DCC08C" },
];

const ALL_SIZES = ["S", "M", "L"];

export default function FilterSidebar({
    categories,
    activeCategory,
}: FilterDrawerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Mobile drawer state
    const [isOpen, setIsOpen] = useState(false);

    // Decorative states (no backend support for these yet)
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    function selectCategory(slug: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (slug === null) {
            params.delete("category");
        } else {
            params.set("category", slug);
        }
        params.delete("page");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }

    return (
        <>
            {/* ─── Mobile Dynamic Filter Drawer (Hidden on desktop) ─── */}
            <div className="md:hidden mt-md mb-xl">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-xs font-label-md py-sm px-md rounded-full border transition-all duration-300 w-full justify-center ${isOpen
                            ? "bg-secondary text-primary-fixed border-secondary"
                            : "border-secondary/20 bg-surface-container-low text-secondary active:scale-95"
                        }`}
                >
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                    <span>{isOpen ? "Close Filters" : "Filter"}</span>
                </button>

                {isOpen && (
                    <div className="flex flex-col gap-lg py-lg border-b border-outline-variant/30 mt-md animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="space-y-sm">
                            <span className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">
                                By Category
                            </span>
                            <div className="flex gap-sm overflow-x-auto no-scrollbar py-sm">
                                <button
                                    type="button"
                                    onClick={() => selectCategory(null)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full font-label-sm border transition-colors ${activeCategory === undefined
                                            ? "bg-primary-container text-on-primary-container border-primary/10"
                                            : "bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                                        }`}
                                >
                                    All items
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() =>
                                            selectCategory(
                                                activeCategory === category.slug ? null : category.slug
                                            )
                                        }
                                        className={`whitespace-nowrap px-4 py-2 rounded-full font-label-sm border transition-colors ${activeCategory === category.slug
                                                ? "bg-primary-container text-on-primary-container border-primary/10"
                                                : "bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-sm">
                            <span className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">
                                By Color
                            </span>
                            <div className="flex flex-wrap gap-sm">
                                {ALL_COLORS.map((color) => (
                                    <button
                                        key={color.name}
                                        title={color.name}
                                        onClick={() =>
                                            setSelectedColor(
                                                selectedColor === color.name ? null : color.name
                                            )
                                        }
                                        style={{ backgroundColor: color.hex }}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.name
                                                ? "border-primary scale-110 shadow-md ring-2 ring-primary/20"
                                                : "border-white shadow-sm ring-1 ring-black/5"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-sm">
                            <span className="font-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">
                                Price Range
                            </span>
                            <div className="grid grid-cols-3 gap-sm">
                                <button className="py-2 px-3 border border-outline-variant rounded-xl text-label-sm text-on-surface-variant active:bg-surface-container">
                                    Under $50
                                </button>
                                <button className="py-2 px-3 border border-outline-variant rounded-xl text-label-sm text-on-surface-variant active:bg-surface-container">
                                    $50 - $150
                                </button>
                                <button className="py-2 px-3 border border-outline-variant rounded-xl text-label-sm text-on-surface-variant active:bg-surface-container">
                                    $150+
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Desktop Left Sidebar Filter ─── */}
            <aside className="hidden md:block w-64 flex-shrink-0">
                <div className="sticky top-24 space-y-xl">
                    <div>
                        <h3 className="text-label-md font-label-md text-primary uppercase tracking-widest mb-md">
                            Filter By
                        </h3>
                        <div className="w-8 h-[2px] bg-primary-container mb-xl" />
                    </div>

                    <div className="space-y-md">
                        <label className="text-label-sm font-label-sm font-bold text-on-surface uppercase">
                            Category
                        </label>
                        <div className="flex flex-col gap-sm">
                            <button
                                type="button"
                                onClick={() => selectCategory(null)}
                                className={`text-left text-body-md transition-colors ${activeCategory === undefined
                                        ? "text-primary font-semibold"
                                        : "text-on-surface-variant hover:text-primary"
                                    }`}
                            >
                                All Items
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() =>
                                        selectCategory(
                                            activeCategory === category.slug ? null : category.slug
                                        )
                                    }
                                    className={`text-left text-body-md transition-colors ${activeCategory === category.slug
                                            ? "text-primary font-semibold"
                                            : "text-on-surface-variant hover:text-primary"
                                        }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-md">
                        <label className="text-label-sm font-label-sm font-bold text-on-surface uppercase">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-sm">
                            {ALL_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() =>
                                        setSelectedColor(
                                            selectedColor === color.name ? null : color.name
                                        )
                                    }
                                    title={color.name}
                                    style={{ backgroundColor: color.hex }}
                                    className={`w-8 h-8 rounded-full border transition-all ${selectedColor === color.name
                                            ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                                            : "border-outline-variant hover:ring-2 hover:ring-primary hover:ring-offset-2"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-md">
                        <label className="text-label-sm font-label-sm font-bold text-on-surface uppercase">
                            Size
                        </label>
                        <div className="flex flex-wrap gap-xs">
                            {ALL_SIZES.map((size) => (
                                <button
                                    key={size}
                                    onClick={() =>
                                        setSelectedSize(selectedSize === size ? null : size)
                                    }
                                    className={`px-md py-xs rounded-full border text-label-sm font-label-sm transition-all ${selectedSize === size
                                            ? "border-primary bg-primary text-on-primary"
                                            : "border-outline-variant hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-md">
                        <label className="text-label-sm font-label-sm font-bold text-on-surface uppercase">
                            Price Range
                        </label>
                        <div className="px-xs">
                            <input
                                type="range"
                                min="0"
                                max="500"
                                className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between mt-sm text-label-sm text-on-surface-variant">
                                <span>$0</span>
                                <span>$500</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

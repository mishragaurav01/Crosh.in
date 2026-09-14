"use client";

import { useEffect } from "react";

const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";

/**
 * Injects the Material Symbols Outlined stylesheet asynchronously after
 * hydration instead of a render-blocking <link> in <head> (T5). The CSS no
 * longer blocks first paint; icons swap in when the font is ready
 * (font-display: block hides the raw-text fallback until then).
 */
export default function MaterialSymbols() {
  useEffect(() => {
    if (document.querySelector(`link[href="${MATERIAL_SYMBOLS_HREF}"]`)) {
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = MATERIAL_SYMBOLS_HREF;
    document.head.appendChild(link);
  }, []);

  return null;
}
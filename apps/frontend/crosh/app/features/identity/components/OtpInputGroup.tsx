"use client";

import { useRef, useCallback, type ClipboardEvent, type KeyboardEvent } from "react";

interface OtpInputGroupProps {
  length?: number;
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
}

export default function OtpInputGroup({
  length = 6,
  value,
  onChange,
  disabled = false,
}: OtpInputGroupProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[clamped]?.focus();
      inputRefs.current[clamped]?.select();
    },
    [length],
  );

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (disabled) return;
      const single = digit.replace(/\D/g, "").slice(-1);
      const next = [...value];
      next[index] = single;
      onChange(next);
      if (single && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [disabled, value, length, onChange, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        const next = [...value];
        if (next[index]) {
          next[index] = "";
          onChange(next);
        } else if (index > 0) {
          next[index - 1] = "";
          onChange(next);
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [disabled, value, length, onChange, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (!pasted) return;
      const next = [...value];
      for (let i = 0; i < pasted.length && i < length; i++) {
        next[i] = pasted[i];
      }
      onChange(next);
      const focusIdx = Math.min(pasted.length, length - 1);
      focusInput(focusIdx);
    },
    [disabled, value, length, onChange, focusInput],
  );

  return (
    <div
      className="flex justify-center gap-sm"
      role="group"
      aria-label="One-time code"
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete="one-time-code"
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-12 h-12 text-center text-body-lg font-medium text-on-surface bg-surface-container-lowest border border-surface-variant rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-outline/30 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Digit ${i + 1} of ${length}`}
        />
      ))}
    </div>
  );
}

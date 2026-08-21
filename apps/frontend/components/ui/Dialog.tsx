"use client";

import { ReactNode, useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Dialog({
  open,
  onClose,
  title,
  children,
  maxWidth = "md",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-xl border-0 bg-transparent p-0 backdrop:bg-inverse-surface/60 ${maxWidthStyles[maxWidth]}`}
    >
      {open && (
        <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30">
          {title && (
            <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-xs rounded-full hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
          <div className="px-lg py-md">{children}</div>
        </div>
      )}
    </dialog>
  );
}

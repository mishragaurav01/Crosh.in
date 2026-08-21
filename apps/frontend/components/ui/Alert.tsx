import { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; icon: string; text: string }> = {
  info: {
    bg: "bg-secondary-container",
    border: "border-secondary",
    icon: "info",
    text: "text-on-secondary-container",
  },
  success: {
    bg: "bg-primary-container",
    border: "border-primary",
    icon: "check_circle",
    text: "text-on-primary-container",
  },
  warning: {
    bg: "bg-[#fff3cd]",
    border: "border-[#ffc107]",
    icon: "warning",
    text: "text-[#664d03]",
  },
  error: {
    bg: "bg-error-container",
    border: "border-error",
    icon: "error",
    text: "text-on-error-container",
  },
};

export default function Alert({
  variant = "info",
  title,
  children,
  onClose,
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`flex items-start gap-md px-lg py-md rounded-xl border ${styles.bg} ${styles.border} ${styles.text}`}
      role="alert"
    >
      <span className="material-symbols-outlined mt-0.5 shrink-0">
        {styles.icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-label-md text-label-md mb-xs">{title}</p>
        )}
        <div className="text-body-md">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-xs rounded-full hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}

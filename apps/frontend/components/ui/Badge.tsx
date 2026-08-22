import { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-container-high text-on-surface-variant",
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  success: "bg-primary-container text-on-primary-container",
  error: "bg-error-container text-on-error-container",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-sm py-xs text-label-sm font-label-sm rounded-full ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

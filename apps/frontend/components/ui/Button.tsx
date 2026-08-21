import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-on-primary-container active:bg-on-primary-container/80 shadow-sm hover:shadow-md",
  secondary:
    "bg-secondary text-on-secondary hover:bg-on-secondary-container active:bg-on-secondary-container/80",
  outline:
    "bg-transparent border border-secondary text-secondary hover:bg-secondary-container active:bg-secondary-container/80",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-highest",
  danger:
    "bg-error text-on-error hover:bg-on-error-container active:bg-on-error-container/80",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-sm py-xs text-label-sm gap-xs",
  md: "px-md py-sm text-label-md gap-sm",
  lg: "px-lg py-md text-label-md gap-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-label-md rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="material-symbols-outlined animate-spin text-[18px]">
            progress_activity
          </span>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;

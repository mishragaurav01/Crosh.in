import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-xs">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-label-sm text-label-sm text-on-secondary-fixed-variant ml-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/30 px-lg py-md text-body-md text-on-surface placeholder:text-outline/50 rounded-xl transition-all duration-200 ${
            error ? "border-error focus:border-error focus:ring-error/30" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-label-sm text-error ml-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-label-sm text-on-surface-variant ml-1">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;

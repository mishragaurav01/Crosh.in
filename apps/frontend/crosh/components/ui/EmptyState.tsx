import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-xxl text-center">
      <span className="material-symbols-outlined text-5xl text-outline mb-md">
        {icon}
      </span>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
        {title}
      </h3>
      {description && (
        <p className="text-body-md text-on-surface-variant mb-lg max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

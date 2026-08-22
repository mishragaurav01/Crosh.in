import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-lg mb-lg">
      <div>
        <h1 className="font-headline-sm text-headline-sm text-on-surface">
          {title}
        </h1>
        {description && (
          <p className="text-body-md text-on-surface-variant mt-xs">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-sm shrink-0">{actions}</div>}
    </div>
  );
}

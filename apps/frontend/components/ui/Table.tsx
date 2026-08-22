import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available",
  onRowClick,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-xl text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-sm block">
          inbox
        </span>
        <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-lg py-md text-left text-label-sm font-label-sm text-on-secondary-fixed-variant ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-outline-variant/20 last:border-b-0 transition-colors duration-150 ${
                  onRowClick
                    ? "cursor-pointer hover:bg-surface-container-low"
                    : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-lg py-md text-body-md text-on-surface ${col.className || ""}`}
                  >
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

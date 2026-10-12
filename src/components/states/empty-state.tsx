import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-none border border-dashed bg-card px-3 py-6 text-center">
      {Icon ? (
        <div className="mb-3 rounded-none border bg-muted/40 p-2.5">
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
      ) : null}
      <h2 className="text-sm font-medium">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

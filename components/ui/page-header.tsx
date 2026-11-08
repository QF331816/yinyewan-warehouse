import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  desc,
  actions,
  meta,
  className,
}: {
  title: string;
  desc?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          {meta}
        </div>
        {desc ? <p className="mt-1 text-[13px] text-ink-3">{desc}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

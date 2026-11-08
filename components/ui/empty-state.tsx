import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  desc,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="grid size-11 place-items-center rounded-xl bg-[#f1f5ef] text-ink-3 [&>svg]:size-5">
        {icon}
      </div>
      <p className="mt-3 text-[14px] font-medium text-ink">{title}</p>
      {desc ? <p className="mt-1 max-w-sm text-[12.5px] leading-5 text-ink-3">{desc}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

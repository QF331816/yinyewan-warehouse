import { cn } from "@/lib/utils";

const TONE = {
  brand: "bg-brand-soft text-brand",
  teal: "bg-teal-soft text-teal",
  out: "bg-out-soft text-out",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-[#f1f5ef] text-ink-2",
} as const;

export function StatCard({
  label,
  value,
  unit,
  icon,
  tone = "brand",
  foot,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  tone?: keyof typeof TONE;
  foot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface p-[18px] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[12.5px] font-medium text-ink-3">{label}</span>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-[9px] [&>svg]:size-4",
            TONE[tone],
          )}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="num text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {value}
        </span>
        {unit ? <span className="text-[12.5px] text-ink-3">{unit}</span> : null}
      </div>
      {foot ? <div className="mt-2 text-[12px] text-ink-3">{foot}</div> : null}
    </div>
  );
}

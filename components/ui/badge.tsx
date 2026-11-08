import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warn" | "danger" | "brand" | "teal";

const TONE: Record<Tone, string> = {
  neutral: "bg-[#f1f5ef] text-ink-2 ring-[#e6e9f0]",
  success: "bg-success-soft text-success ring-[#cdeadd]",
  warn: "bg-warn-soft text-warn ring-[#f5e4bd]",
  danger: "bg-danger-soft text-danger ring-[#f6d3ce]",
  brand: "bg-brand-soft text-brand ring-[#d5e2ff]",
  teal: "bg-teal-soft text-teal ring-[#c6e8e4]",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-ink-3",
  success: "bg-success",
  warn: "bg-[#d79a1f]",
  danger: "bg-danger",
  brand: "bg-brand",
  teal: "bg-teal",
};

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[12px] font-medium ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", DOT[tone])} /> : null}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "已完成":
      return "success";
    case "草稿":
      return "neutral";
    case "已作废":
      return "danger";
    case "进行中":
      return "brand";
    case "正常":
      return "success";
    case "低于安全库存":
      return "warn";
    case "缺货":
      return "danger";
    default:
      return "neutral";
  }
}

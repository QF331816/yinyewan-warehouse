import { cn } from "@/lib/utils";

export function TableWrap({
  children,
  className,
  fixed = false,
  minWidth = "min-w-[720px]",
}: {
  children: React.ReactNode;
  className?: string;
  fixed?: boolean;
  /** 表格最小宽度：窄屏时横向滚动，而不是把文字挤成竖排 */
  minWidth?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className={cn("w-full text-[13px]", minWidth, fixed && "table-fixed")}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-surface-2 text-[12px] font-medium text-ink-3">
      {children}
    </thead>
  );
}

export function TR({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-t border-line/80 transition-colors hover:bg-[#f8fbf7]",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

function alignClass(align: "left" | "right" | "center") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function TH({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-2.5 font-medium first:pl-5 last:pr-5",
        alignClass(align),
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
  align = "left",
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-4 py-3 align-middle first:pl-5 last:pr-5",
        alignClass(align),
        align === "right" && "num",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-t border-line">
      <td colSpan={colSpan} className="px-5 py-14 text-center text-[13px] text-ink-3">
        {children}
      </td>
    </tr>
  );
}

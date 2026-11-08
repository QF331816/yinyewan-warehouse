"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { TableWrap, THead, TR, TH, TD } from "@/components/ui/table";
import { finishStocktakeAction } from "@/lib/actions";
import { qty } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StocktakeRow = {
  itemId: string;
  name: string;
  code: string;
  spec: string;
  unit: string;
  location: string;
  bookQty: number;
};

export function StocktakeForm({
  no,
  operator,
  rows,
}: {
  no: string;
  operator: string;
  rows: StocktakeRow[];
}) {
  const [actual, setActual] = useState<Record<string, string>>(
    () => Object.fromEntries(rows.map((r) => [r.itemId, String(r.bookQty)])) as Record<string, string>,
  );

  const diffs = rows
    .map((r) => Number(actual[r.itemId] ?? r.bookQty) - r.bookQty)
    .filter((d) => Number.isFinite(d) && d !== 0);
  const gain = diffs.filter((d) => d > 0).reduce((s, d) => s + d, 0);
  const loss = diffs.filter((d) => d < 0).reduce((s, d) => s - d, 0);

  return (
    <form action={finishStocktakeAction}>
      <input type="hidden" name="no" value={no} />
      <input type="hidden" name="operator" value={operator} />

      <TableWrap fixed>
        <THead>
          <tr>
            <TH className="w-[42%]">物品</TH>
            <TH className="w-[14%]">库位</TH>
            <TH align="right" className="w-[14%]">账面数量</TH>
            <TH className="w-[18%]">实盘数量</TH>
            <TH align="right" className="w-[12%]">差异</TH>
          </tr>
        </THead>
        <tbody>
          {rows.map((row) => {
            const value = Number(actual[row.itemId] ?? row.bookQty);
            const diff = Number.isFinite(value) ? value - row.bookQty : 0;
            return (
              <TR key={row.itemId}>
                <TD>
                  <span className="block max-w-[240px] truncate text-[13px] font-medium text-ink">
                    {row.name}
                  </span>
                  <span className="num block text-[11.5px] text-ink-3">
                    {row.code}
                    {row.spec ? ` · ${row.spec}` : ""}
                  </span>
                </TD>
                <TD>
                  <span className="num text-[12.5px] text-ink-2">{row.location}</span>
                </TD>
                <TD align="right">
                  <span className="text-ink-2">{qty(row.bookQty)}</span>
                  <span className="ml-1 text-[11.5px] text-ink-3">{row.unit}</span>
                </TD>
                <TD>
                  <div className="relative">
                    <input
                      name={`actual_${row.itemId}`}
                      type="number"
                      min={0}
                      value={actual[row.itemId] ?? ""}
                      onChange={(e) =>
                        setActual((prev) => ({ ...prev, [row.itemId]: e.target.value }))
                      }
                      className="h-8 w-full rounded-lg border border-line-strong bg-surface px-2.5 pr-9 text-right text-[13px] tabular-nums hover:border-[#bfc9c1] focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/10"
                      aria-label={`${row.name} 实盘数量`}
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-3">
                      {row.unit}
                    </span>
                  </div>
                </TD>
                <TD align="right">
                  {diff === 0 ? (
                    <span className="text-[12.5px] text-ink-3">0</span>
                  ) : (
                    <span
                      className={cn(
                        "text-[12.5px] font-medium",
                        diff > 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </TD>
              </TR>
            );
          })}
        </tbody>
      </TableWrap>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
        <div className="flex items-center gap-4 text-[12.5px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <ClipboardCheck className="size-3.5" />
            差异 <span className="num font-medium text-ink">{diffs.length}</span> 项
          </span>
          <span>
            盘盈 <span className="num font-medium text-success">+{qty(gain)}</span>
          </span>
          <span>
            盘亏 <span className="num font-medium text-danger">−{qty(loss)}</span>
          </span>
        </div>
        <button type="submit" className={buttonClass("primary", "md")}>
          <CheckCircle2 className="size-4" />
          完成盘点并生成调整单
        </button>
      </div>
    </form>
  );
}

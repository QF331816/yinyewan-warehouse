import Link from "next/link";
import { Boxes, Search, TriangleAlert, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { TableWrap, THead, TR, TH, TD, TableEmpty } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { readDB } from "@/lib/store";
import { stockRows } from "@/lib/queries";
import { money, qty } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; filter?: string }>;
}) {
  const { q = "", category = "", filter = "" } = ({} as Record<string, string | undefined>);
  const db = readDB();
  const rows = stockRows(db);
  const keyword = q.trim().toLowerCase();

  const filtered = rows.filter((row) => {
    if (filter === "low" && row.status === "正常") return false;
    if (category && row.item.category !== category) return false;
    if (!keyword) return true;
    return (
      row.item.name.toLowerCase().includes(keyword) ||
      row.item.code.toLowerCase().includes(keyword) ||
      row.item.location.toLowerCase().includes(keyword)
    );
  });

  const totalQty = filtered.reduce((s, r) => s + r.qty, 0);
  const totalValue = filtered.reduce((s, r) => s + r.value, 0);
  const lowCount = rows.filter((r) => r.status !== "正常").length;

  const categories = [...new Set(rows.map((r) => r.item.category))];

  return (
    <div>
      <PageHeader
        title="库存现况"
        desc="按物品查看当前结存、安全库存与最近变动"
        actions={
          <Link
            href={filter === "low" ? "/inventory" : "/inventory?filter=low"}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[9px] border px-3 text-[13px] font-medium transition-colors",
              filter === "low"
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-line-strong bg-surface text-ink-2 hover:text-ink",
            )}
          >
            <TriangleAlert className="size-4" />
            {filter === "low" ? "只看预警" : `预警 ${lowCount} 项`}
          </Link>
        }
      />

      <div className="mb-3.5 grid grid-cols-3 gap-3.5">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface px-[18px] py-4 shadow-[var(--shadow-card)]">
          <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Boxes className="size-3.5" /> 库存总量
          </p>
          <p className="num mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-ink">
            {qty(totalQty)}
            <span className="ml-1.5 text-[12px] font-normal text-ink-3">件</span>
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface px-[18px] py-4 shadow-[var(--shadow-card)]">
          <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Wallet className="size-3.5" /> 库存金额
          </p>
          <p className="num mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-ink">
            ¥{money(totalValue, 0)}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-surface px-[18px] py-4 shadow-[var(--shadow-card)]">
          <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <TriangleAlert className="size-3.5" /> 预警物品
          </p>
          <p
            className={cn(
              "num mt-1.5 text-[22px] font-semibold tracking-[-0.02em]",
              lowCount > 0 ? "text-danger" : "text-ink",
            )}
          >
            {lowCount}
            <span className="ml-1.5 text-[12px] font-normal text-ink-3">项</span>
          </p>
        </div>
      </div>

      <Card>
        <TableWrap>
          <THead>
            <tr>
              <TH>物品</TH>
              <TH>分类</TH>
              <TH>库位</TH>
              <TH align="right">现存</TH>
              <TH className="w-[140px]">安全线</TH>
              <TH align="right">近 30 天出</TH>
              <TH align="right">近 30 天入</TH>
              <TH>最后变动</TH>
              <TH>状态</TH>
              <TH align="right" />
            </tr>
          </THead>
          <tbody>
            {filtered.length ? (
              filtered.map((row) => {
                const barColor =
                  row.status === "缺货"
                    ? "bg-danger"
                    : row.status === "低于安全库存"
                      ? "bg-[#d79a1f]"
                      : "bg-success";
                return (
                  <TR key={row.item.id}>
                    <TD>
                      <Link
                        href={`/items/${row.item.id}`}
                        className="block max-w-[240px] truncate text-[13px] font-medium text-ink hover:text-brand"
                      >
                        {row.item.name}
                      </Link>
                      <span className="num block truncate text-[11.5px] text-ink-3">
                        {row.item.code} · {row.item.spec || "无规格"}
                      </span>
                    </TD>
                    <TD>
                      <Badge>{row.item.category}</Badge>
                    </TD>
                    <TD>
                      <span className="num text-[12.5px] text-ink-2">{row.item.location}</span>
                    </TD>
                    <TD align="right">
                      <span className="text-[13px] font-medium text-ink">{qty(row.qty)}</span>
                      <span className="ml-1 text-[11.5px] text-ink-3">{row.item.unit}</span>
                    </TD>
                    <TD>
                      {/* 安全线：满格 = 安全库存的 2 倍，刻度线标出安全库存位置 */}
                      <div className="flex items-center gap-2">
                        <div className="relative w-full">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef3ec]">
                            <div
                              className={cn("h-full rounded-full", barColor)}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    (row.qty / Math.max(1, row.item.safetyStock * 2)) * 100,
                                    3,
                                  ),
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="absolute left-1/2 -top-1 h-3.5 w-px bg-ink-3/40" />
                        </div>
                        <span className="num shrink-0 text-[11px] text-ink-3">
                          {row.item.safetyStock}
                        </span>
                      </div>
                    </TD>
                    <TD align="right">
                      <span className="text-[12.5px] text-ink-2">{qty(row.outLast30)}</span>
                    </TD>
                    <TD align="right">
                      <span className="text-[12.5px] text-success">+{qty(row.inLast30)}</span>
                    </TD>
                    <TD>
                      <span className="num text-[12px] text-ink-3">{row.lastMoveAt ?? "—"}</span>
                    </TD>
                    <TD>
                      <Badge tone={statusTone(row.status)} dot>
                        {row.status}
                      </Badge>
                    </TD>
                    <TD align="right">
                      <Link
                        href={`/items/${row.item.id}`}
                        className="text-[12.5px] font-medium text-brand hover:underline"
                      >
                        明细
                      </Link>
                    </TD>
                  </TR>
                );
              })
            ) : (
              <TableEmpty colSpan={10}>
                <EmptyState
                  icon={<Boxes />}
                  title="没有符合条件的库存"
                  desc="清空筛选后再看看"
                  className="py-8"
                />
              </TableEmpty>
            )}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

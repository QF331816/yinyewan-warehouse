import Link from "next/link";
import { Package, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { TableWrap, THead, TR, TH, TD, TableEmpty } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemDialog } from "@/components/item-dialog";
import { readDB } from "@/lib/store";
import { stockRows } from "@/lib/queries";
import { money, qty } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = ({} as Record<string, string | undefined>);
  const db = readDB();
  const rows = stockRows(db);

  const keyword = q.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (category && row.item.category !== category) return false;
    if (!keyword) return true;
    const item = row.item;
    return (
      item.name.toLowerCase().includes(keyword) ||
      item.code.toLowerCase().includes(keyword) ||
      item.spec.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword)
    );
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.item.category, (counts.get(row.item.category) ?? 0) + 1);
  }

  const totalQty = filtered.reduce((s, r) => s + r.qty, 0);
  const totalValue = filtered.reduce((s, r) => s + r.value, 0);

  const chip = (label: string, value: string, count: number) => {
    const active = category === value;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("category", value);
    return (
      <Link
        key={value || "all"}
        href={`/items${params.size ? `?${params.toString()}` : ""}`}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-colors",
          active
            ? "border-brand/30 bg-brand-soft font-medium text-brand"
            : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
        )}
      >
        {label}
        <span className={cn("num text-[11.5px]", active ? "text-brand/70" : "text-ink-3")}>{count}</span>
      </Link>
    );
  };

  return (
    <div>
      <PageHeader
        title="物品台账"
        desc="幼儿园在册物资、存放位置与安全库存线"
      />

      <Card>
        <TableWrap>
          <THead>
            <tr>
              <TH>物品</TH>
              <TH>分类</TH>
              <TH>存放位置</TH>
              <TH align="right">现存量</TH>
              <TH align="right">安全库存</TH>
              <TH align="right">参考单价</TH>
              <TH>状态</TH>
              <TH align="right">操作</TH>
            </tr>
          </THead>
          <tbody>
            {filtered.length ? (
              filtered.map((row) => (
                <TR key={row.item.id}>
                  <TD>
                    <Link href={`/items/${row.item.id}`} className="group block max-w-[280px]">
                      <span className="block truncate text-[13px] font-medium text-ink group-hover:text-brand">
                        {row.item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">
                        {row.item.spec || "—"} · {row.item.code}
                      </span>
                    </Link>
                  </TD>
                  <TD>
                    <Badge>{row.item.category}</Badge>
                  </TD>
                  <TD>
                    <span className="num text-[12.5px] text-ink-2">{row.item.location || "—"}</span>
                  </TD>
                  <TD align="right">
                    <span className="text-[13px] font-medium text-ink">{qty(row.qty)}</span>
                    <span className="ml-1 text-[11.5px] text-ink-3">{row.item.unit}</span>
                  </TD>
                  <TD align="right">
                    <span className="text-[12.5px] text-ink-3">{row.item.safetyStock}</span>
                  </TD>
                  <TD align="right">
                    <span className="text-[12.5px] text-ink-2">¥{money(row.item.price)}</span>
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
                      详情
                    </Link>
                  </TD>
                </TR>
              ))
            ) : (
              <TableEmpty colSpan={8}>
                <EmptyState
                  icon={<Package />}
                  title="没有匹配的物品"
                  desc="换个关键词，或清空分类筛选再试试"
                  action={
                    <Link href="/items" className="text-[12.5px] font-medium text-brand hover:underline">
                      清空筛选
                    </Link>
                  }
                  className="py-8"
                />
              </TableEmpty>
            )}
          </tbody>
        </TableWrap>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-[12.5px] text-ink-3">
          <span>
            共 <span className="num font-medium text-ink-2">{filtered.length}</span> 项物品
          </span>
          <span className="num">
            库存合计 {qty(totalQty)} · 金额 ¥{money(totalValue, 2)}
          </span>
        </div>
      </Card>
    </div>
  );
}

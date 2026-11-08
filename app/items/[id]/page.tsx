import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, MapPin, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { TableWrap, THead, TR, TH, TD, TableEmpty } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemDialog } from "@/components/item-dialog";
import { readDB } from "@/lib/store";
import { itemTxns, stockRows } from "@/lib/queries";
import { money, qty, shortDate } from "@/lib/format";

export function generateStaticParams() {
  return readDB().items.map((item) => ({ id: item.id }));
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = readDB();
  const row = stockRows(db).find((r) => r.item.id === id);
  if (!row) notFound();

  const item = row.item;
  const txns = itemTxns(item.id, db, 40);

  return (
    <div>
      <Link
        href="/items"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        物品台账
      </Link>

      <PageHeader
        title={item.name}
        desc={`${item.spec || "无规格"} · ${item.code}`}
        meta={
          <Badge tone={statusTone(row.status)} dot>
            {row.status}
          </Badge>
        }
      />

      <div className="grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3.5">
          <Card>
            <div className="grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
              <div className="px-5 py-4">
                <p className="text-[12px] text-ink-3">现存量</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="num text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
                    {qty(row.qty)}
                  </span>
                  <span className="text-[12.5px] text-ink-3">{item.unit}</span>
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[12px] text-ink-3">安全库存</p>
                <p className="num mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
                  {item.safetyStock}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[12px] text-ink-3">近 30 天入库</p>
                <p className="num mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-success">
                  +{qty(row.inLast30)}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[12px] text-ink-3">近 30 天出库</p>
                <p className="num mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink-2">
                  −{qty(row.outLast30)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="出入库流水"
              desc="每一笔库存变化都可追溯到单据"
              action={
                <Link
                  href={`/documents?q=${encodeURIComponent(item.name)}`}
                  className="text-[12.5px] font-medium text-brand hover:underline"
                >
                  查看全部
                </Link>
              }
            />
            <TableWrap>
              <THead>
                <tr>
                  <TH>日期</TH>
                  <TH>单号</TH>
                  <TH>类型</TH>
                  <TH align="right">数量</TH>
                  <TH align="right">结存</TH>
                  <TH>经办</TH>
                </tr>
              </THead>
              <tbody>
                {txns.length ? (
                  txns.map((t) => (
                    <TR key={t.id}>
                      <TD>
                        <span className="num text-[12.5px] text-ink-2">{t.date}</span>
                      </TD>
                      <TD>
                        <Link
                          href={`/documents/${t.docNo}`}
                          className="num text-[12.5px] font-medium text-brand hover:underline"
                        >
                          {t.docNo}
                        </Link>
                      </TD>
                      <TD>
                        <Badge tone={t.qty > 0 ? "success" : "brand"}>{t.qty > 0 ? "入库" : "出库"}</Badge>
                      </TD>
                      <TD align="right">
                        <span
                          className={`font-medium ${t.qty > 0 ? "text-success" : "text-ink"}`}
                        >
                          {t.qty > 0 ? `+${qty(t.qty)}` : `−${qty(-t.qty)}`}
                        </span>
                      </TD>
                      <TD align="right">
                        <span className="text-ink-2">{qty(t.balanceAfter)}</span>
                      </TD>
                      <TD>
                        <span className="text-[12.5px] text-ink-3">{t.operator}</span>
                      </TD>
                    </TR>
                  ))
                ) : (
                  <TableEmpty colSpan={6}>
                    <EmptyState title="暂无流水" desc="这个物品还没有出入库记录" className="py-8" />
                  </TableEmpty>
                )}
              </tbody>
            </TableWrap>
          </Card>
        </div>

        <div className="space-y-3.5">
          <Card>
            <CardHeader title="基本信息" />
            <CardBody className="space-y-3.5">
              {[
                ["物品编码", item.code],
                ["规格型号", item.spec || "—"],
                ["分类", item.category],
                ["计量单位", item.unit],
                ["参考单价", `¥${money(item.price)}`],
                ["库存金额", `¥${money(row.value)}`],
                ["建档日期", item.createdAt],
                ["最后变动", row.lastMoveAt ? `${row.lastMoveAt}（${shortDate(row.lastMoveAt)}）` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="shrink-0 text-ink-3">{label}</span>
                  <span className="num truncate text-right font-medium text-ink">{value}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="存放与保管" />
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-lg bg-[#f1f5ef] text-ink-3">
                  <MapPin className="size-3.5" />
                </span>
                <div>
                  <p className="text-[12px] text-ink-3">存放位置</p>
                  <p className="num text-[13px] font-medium text-ink">{item.location || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-lg bg-[#f1f5ef] text-ink-3">
                  <User className="size-3.5" />
                </span>
                <div>
                  <p className="text-[12px] text-ink-3">保管人</p>
                  <p className="text-[13px] font-medium text-ink">{item.keeper}</p>
                </div>
              </div>
              {item.remark ? (
                <p className="rounded-lg bg-surface-2 p-3 text-[12.5px] leading-5 text-ink-2">
                  {item.remark}
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

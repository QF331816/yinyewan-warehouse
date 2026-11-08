import Link from "next/link";
import { Download, FileText, Info, Scale } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { TableWrap, THead, TR, TH, TD, TableEmpty } from "@/components/ui/table";
import { readDB } from "@/lib/store";
import { ledger, periodPresets, stockMap } from "@/lib/queries";
import { longDate, money, qty } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  const sp = ({} as Record<string, string | undefined>);
  const db = readDB();
  const presets = periodPresets(db);
  const key = sp.period ?? "thisMonth";
  const period = presets[key] ?? presets.thisMonth;
  const start = sp.start ?? period.start;
  const end = sp.end ?? period.end;

  const { rows, totals } = ledger(start, end, db);
  const stock = stockMap(db);

  const periodTabs = [
    { key: "thisMonth", label: "本月" },
    { key: "lastMonth", label: "上月" },
    { key: "term", label: "本学期" },
    { key: "last90", label: "近 90 天" },
  ];

  return (
    <div>
      <PageHeader
        title="学期对账"
        desc={`${db.settings.schoolName} · 按期间核对每种物品的期初、出入库与期末结存`}
        actions={
          <>
            <Link
              href={`/api/ledger?start=${start}&end=${end}`}
              prefetch={false}
              className={buttonClass("secondary", "md")}
            >
              <Download className="size-4" />
              导出 CSV
            </Link>
            <Link
              href="/documents"
              className={buttonClass("secondary", "md")}
            >
              <FileText className="size-4" />
              查看原始单据
            </Link>
          </>
        }
      />

      <Card className="mb-3.5">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
          <div className="text-[12.5px] text-ink-3">
            对账期间 <span className="num font-medium text-ink-2">{start}</span> 至{" "}
            <span className="num font-medium text-ink-2">{end}</span>
            <span className="ml-2 text-ink-3/80">（{longDate(end)} 截止）</span>
          </div>
          <span className="ml-auto text-[12.5px] text-ink-3">
            涉及 <span className="num font-medium text-ink-2">{rows.length}</span> 种物品
          </span>
        </div>
      </Card>

      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          { label: "期初结存", value: qty(totals.opening), amount: totals.openingValue, tone: "text-ink" },
          { label: "本期入库", value: `+${qty(totals.inQty)}`, amount: totals.inValue, tone: "text-success" },
          { label: "本期出库", value: `−${qty(totals.outQty)}`, amount: totals.outValue, tone: "text-ink-2" },
          { label: "期末结存", value: qty(totals.closing), amount: totals.value, tone: "text-ink" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-card)] border border-line bg-surface p-[18px] shadow-[var(--shadow-card)]"
          >
            <p className="text-[12.5px] text-ink-3">{item.label}</p>
            <p className={cn("num mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.02em]", item.tone)}>
              {item.value}
            </p>
            <p className="num mt-1.5 text-[11.5px] text-ink-3">金额 ¥{money(item.amount, 0)}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="对账明细"
          desc="期初 + 本期入库 − 本期出库 = 期末，逐行可核"
          action={
            <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
              <Scale className="size-3.5" />
              数据来源：库存流水
            </span>
          }
        />
        <TableWrap>
          <THead>
            <tr>
              <TH>物品</TH>
              <TH>分类</TH>
              <TH align="right">期初</TH>
              <TH align="right">入库</TH>
              <TH align="right">出库</TH>
              <TH align="right">期末</TH>
              <TH align="right">期末金额</TH>
              <TH>当前状态</TH>
            </tr>
          </THead>
          <tbody>
            {rows.length ? (
              rows.map((row) => {
                const onHand = stock.get(row.item.id) ?? 0;
                const status =
                  onHand <= 0 ? "缺货" : onHand < row.item.safetyStock ? "低于安全库存" : "正常";
                return (
                  <TR key={row.item.id}>
                    <TD>
                      <Link
                        href={`/items/${row.item.id}`}
                        className="block max-w-[240px] truncate text-[13px] font-medium text-ink hover:text-brand"
                      >
                        {row.item.name}
                      </Link>
                      <span className="num block text-[11.5px] text-ink-3">{row.item.code}</span>
                    </TD>
                    <TD>
                      <Badge>{row.item.category}</Badge>
                    </TD>
                    <TD align="right">
                      <span className="text-ink-2">{row.opening ? qty(row.opening) : "—"}</span>
                    </TD>
                    <TD align="right">
                      <span className={row.inQty ? "text-success" : "text-ink-3"}>
                        {row.inQty ? `+${qty(row.inQty)}` : "—"}
                      </span>
                    </TD>
                    <TD align="right">
                      <span className={row.outQty ? "text-ink-2" : "text-ink-3"}>
                        {row.outQty ? `−${qty(row.outQty)}` : "—"}
                      </span>
                    </TD>
                    <TD align="right">
                      <span className="font-medium text-ink">{qty(row.closing)}</span>
                    </TD>
                    <TD align="right">
                      <span className="text-ink-2">¥{money(row.value)}</span>
                    </TD>
                    <TD>
                      <Badge tone={statusTone(status)} dot>
                        {status}
                      </Badge>
                    </TD>
                  </TR>
                );
              })
            ) : (
              <TableEmpty colSpan={8}>本期没有库存变动</TableEmpty>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-surface-2 font-medium">
              <TD>合计</TD>
              <TD />
              <TD align="right">{qty(totals.opening)}</TD>
              <TD align="right" className="text-success">
                +{qty(totals.inQty)}
              </TD>
              <TD align="right">−{qty(totals.outQty)}</TD>              <TD align="right">{qty(totals.closing)}</TD>
              <TD align="right">¥{money(totals.value)}</TD>
              <TD />
            </tr>
          </tfoot>
        </TableWrap>
      </Card>

      <div className="mt-3.5 flex items-start gap-2 rounded-[10px] border border-line bg-surface px-4 py-3 text-[12px] leading-5 text-ink-3">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          对账口径：期初 = 期间开始前所有流水累计；本期入库 / 出库 = 期间内的流水；期末 = 期初 + 入库 − 出库。
          由于库存完全由流水推导，任意期间的期末都会与「库存现况」中的现存数量一致，出现不一致就说明有流水被绕过。
        </p>
      </div>
    </div>
  );
}

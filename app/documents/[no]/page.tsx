import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { TableWrap, THead, TR, TH, TD } from "@/components/ui/table";
import { DocActions } from "@/components/doc-actions";
import { readDB } from "@/lib/store";
import { docQty, docTotal, itemIndex, partnerName } from "@/lib/queries";
import { longDate, money, qty } from "@/lib/format";

export function generateStaticParams() {
  return readDB().docs.map((doc) => ({ no: doc.no }));
}

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const { no } = await params;
  const db = readDB();
  const doc = db.docs.find((d) => d.no === decodeURIComponent(no));
  if (!doc) notFound();

  const idx = itemIndex(db);
  const isIn = doc.kind === "in";
  const total = docTotal(doc);

  return (
    <div>
      <Link
        href={doc.kind === "in" ? "/inbound" : "/outbound"}
        className="no-print mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        {doc.kind === "in" ? "入库单" : "出库单"}
      </Link>

      <div className="print-plain">
        <PageHeader
          title={doc.no}
          desc={`${doc.type} · ${longDate(doc.date)}`}
          meta={
            <Badge tone={statusTone(doc.status)} dot>
              {doc.status}
            </Badge>
          }
        />

        {doc.status === "已作废" ? (
          <div className="mb-3.5 flex items-start gap-2 rounded-[10px] border border-[#f6d3ce] bg-danger-soft px-4 py-3 text-[12.5px] text-danger">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              该单据已于 {doc.voidedAt} 作废，原因：{doc.voidReason ?? "—"}。作废单据不再影响库存。
            </p>
          </div>
        ) : null}

        {doc.status === "草稿" ? (
          <div className="mb-3.5 flex items-start gap-2 rounded-[10px] border border-[#e3e8f0] bg-surface px-4 py-3 text-[12.5px] text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-ink-3" />
            <p>这是草稿单据，尚未计入库存。确认无误后点击右上角「提交过账」。</p>
          </div>
        ) : null}

        <div className="grid gap-3.5 lg:grid-cols-[1fr_320px]">
          <Card>
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span
                className={`grid size-9 place-items-center rounded-[10px] ${
                  isIn ? "bg-success-soft text-success" : "bg-out-soft text-out"
                }`}
              >
                {isIn ? <ArrowDownToLine className="size-4.5" /> : <ArrowUpFromLine className="size-4.5" />}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">
                  {doc.type}
                  <span className="ml-2 text-[12px] font-normal text-ink-3">
                    {isIn ? "入库" : "出库"}
                  </span>
                </p>
                <p className="text-[12px] text-ink-3">{db.settings.warehouseName}</p>
              </div>
              <span className="ml-auto num text-[12px] text-ink-3">{doc.no}</span>
            </div>

            <TableWrap>
              <THead>
                <tr>
                  <TH className="w-10">#</TH>
                  <TH>物品</TH>
                  <TH>编码</TH>
                  <TH align="right">数量</TH>
                  <TH align="right">单价</TH>
                  <TH align="right">金额</TH>
                </tr>
              </THead>
              <tbody>
                {doc.lines.map((line, i) => {
                  const item = idx.get(line.itemId);
                  return (
                    <TR key={`${line.itemId}-${i}`}>
                      <TD>
                        <span className="num text-[12px] text-ink-3">{i + 1}</span>
                      </TD>
                      <TD>
                        <Link
                          href={`/items/${line.itemId}`}
                          className="block max-w-[240px] truncate text-[13px] font-medium text-ink hover:text-brand"
                        >
                          {item?.name ?? "已删除物品"}
                        </Link>
                        <span className="block truncate text-[11.5px] text-ink-3">
                          {item?.spec || "—"}
                        </span>
                      </TD>
                      <TD>
                        <span className="num text-[12px] text-ink-3">{item?.code ?? "—"}</span>
                      </TD>
                      <TD align="right">
                        <span className="font-medium text-ink">{qty(line.qty)}</span>
                        <span className="ml-1 text-[11.5px] text-ink-3">{item?.unit ?? ""}</span>
                      </TD>
                      <TD align="right">
                        <span className="text-ink-2">¥{money(line.price)}</span>
                      </TD>
                      <TD align="right">
                        <span className="font-medium text-ink">¥{money(line.qty * line.price)}</span>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </TableWrap>

            <div className="flex flex-wrap items-center justify-end gap-8 border-t border-line px-5 py-3.5 text-[13px]">
              <span className="text-ink-3">
                合计数量 <span className="num ml-1 font-medium text-ink">{qty(docQty(doc))}</span>
              </span>
              <span className="text-ink-3">
                合计金额{" "}
                <span className="num ml-1 text-[16px] font-semibold text-ink">¥{money(total)}</span>
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader title="单据信息" />
            <CardBody className="space-y-3.5">
              {[
                ["单据编号", doc.no],
                [isIn ? "供应商" : "领用部门", partnerName(db, doc)],
                ["业务日期", doc.date],
                ["经办人", doc.operator],
                ...(isIn ? [] : ([["领用人", doc.receiver || "—"]] as string[][])),
                ...(isIn ? [] : ([["用途", doc.purpose || "—"]] as string[][])),
                ["创建时间", doc.createdAt],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="shrink-0 text-ink-3">{label}</span>
                  <span className="truncate text-right font-medium text-ink">{value}</span>
                </div>
              ))}

              {doc.note ? (
                <div className="rounded-lg bg-surface-2 p-3 text-[12.5px] leading-5 text-ink-2">
                  <span className="mb-1 block text-[11.5px] text-ink-3">备注</span>
                  {doc.note}
                </div>
              ) : null}

              <div className="rounded-lg border border-dashed border-line-strong p-3 text-[11.5px] leading-5 text-ink-3">
                打印时导航与按钮会自动隐藏，只保留单据本体。可使用浏览器「另存为 PDF」归档。
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

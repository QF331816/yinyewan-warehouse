import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, FileText, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { TableWrap, THead, TR, TH, TD, TableEmpty } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { readDB } from "@/lib/store";
import { docItemsSummary, docQty, docTotal, listDocs, partnerName } from "@/lib/queries";
import { money, qty } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUSES = ["全部", "草稿", "已完成", "已作废"];

export function DocList({
  kind,
  status = "全部",
  q = "",
  title,
  desc,
  showKindTabs = false,
}: {
  kind?: "in" | "out";
  status?: string;
  q?: string;
  title: string;
  desc: string;
  showKindTabs?: boolean;
}) {
  const db = readDB();
  const docs = listDocs(db, { kind, status, q });

  const tabs = [
    { key: "", label: "全部" },
    { key: "in", label: "入库" },
    { key: "out", label: "出库" },
  ];

  const href = (next: { kind?: string; status?: string }) => {
    const params = new URLSearchParams();
    const k = next.kind ?? (kind ?? "");
    const s = next.status ?? status;
    if (k) params.set("kind", k);
    if (s && s !== "全部") params.set("status", s);
    if (q) params.set("q", q);
    const path = showKindTabs ? "/documents" : kind === "in" ? "/inbound" : "/outbound";
    return `${path}${params.size ? `?${params.toString()}` : ""}`;
  };

  const totalQty = docs.reduce((s, d) => s + docQty(d), 0);
  const totalAmount = docs.reduce((s, d) => s + docTotal(d), 0);

  const newButton =
    kind === "in" ? (
      <Link href="/inbound" className={buttonClass("primary", "md")}>
        <ArrowDownToLine className="size-4" />
        入库单
      </Link>
    ) : kind === "out" ? (
      <Link href="/outbound" className={buttonClass("primary", "md")}>
        <ArrowUpFromLine className="size-4" />
        出库单
      </Link>
    ) : null;

  return (
    <div>
      <PageHeader
        title={title}
        desc={desc}
        actions={
          <>
            {showKindTabs ? (
              <>
                <Link href="/inbound" className={buttonClass("secondary", "md")}>
                  <ArrowDownToLine className="size-4 text-success" />
                  入库单
                </Link>
                <Link href="/outbound" className={buttonClass("primary", "md")}>
                  <ArrowUpFromLine className="size-4" />
                  出库单
                </Link>
              </>
            ) : (
              newButton
            )}
          </>
        }
      />

      <Card>
        <TableWrap minWidth="min-w-[1080px]" fixed>
          <THead>
            <tr>
              <TH className="w-[11%]">单据号</TH>
              <TH className="w-[22%]">物品</TH>
              <TH className="w-[8%]">类型</TH>
              <TH className="w-[9%]">日期</TH>
              <TH className="w-[13%]">
                {kind === "in" ? "供应商" : kind === "out" ? "领用部门" : "供应商 / 领用部门"}
              </TH>
              <TH className="w-[7%]">
                {kind === "in" ? "经办人" : kind === "out" ? "领用人" : "经办 / 领用人"}
              </TH>
              <TH align="right" className="w-[7%]">数量</TH>
              <TH align="right" className="w-[8%]">金额</TH>
              <TH className="w-[8%]">状态</TH>
              <TH align="right" className="w-[7%]" />
            </tr>
          </THead>
          <tbody>
            {docs.length ? (
              docs.map((doc) => {
                const isIn = doc.kind === "in";
                const itemsSummary = docItemsSummary(db, doc, 2);
                return (
                  <TR key={doc.id} className="group">
                    <TD>
                      <Link
                        href={`/documents/${doc.no}`}
                        className="num flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-ink group-hover:text-brand"
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-md",
                            isIn ? "bg-success-soft text-success" : "bg-out-soft text-out",
                          )}
                        >
                          {isIn ? (
                            <ArrowDownToLine className="size-3.5" />
                          ) : (
                            <ArrowUpFromLine className="size-3.5" />
                          )}
                        </span>
                        {doc.no}
                      </Link>
                    </TD>
                    <TD>
                      <span
                        className="line-clamp-2 block text-[12.5px] leading-[1.45] text-ink-2"
                        title={itemsSummary.full}
                      >
                        {itemsSummary.text}
                      </span>
                    </TD>
                    <TD>
                      <span className="whitespace-nowrap text-[12.5px] text-ink-2">{doc.type}</span>
                    </TD>
                    <TD>
                      <span className="num whitespace-nowrap text-[12.5px] text-ink-2">{doc.date}</span>
                    </TD>
                    <TD>
                      <span
                        className="block truncate text-[12.5px] text-ink-2"
                        title={partnerName(db, doc)}
                      >
                        {partnerName(db, doc)}
                      </span>
                    </TD>
                    <TD>
                      <span className="block truncate text-[12.5px] text-ink-2">
                        {isIn ? doc.operator : doc.receiver || doc.operator}
                      </span>
                    </TD>
                    <TD align="right">
                      <span className={cn("whitespace-nowrap text-[12.5px] font-medium", isIn ? "text-success" : "text-ink")}>
                        {isIn ? "+" : "−"}
                        {qty(docQty(doc))}
                      </span>
                    </TD>
                    <TD align="right">
                      <span className="whitespace-nowrap text-[12.5px] text-ink-2">
                        ¥{money(docTotal(doc), 2)}
                      </span>
                    </TD>
                    <TD>
                      <Badge tone={statusTone(doc.status)} dot className="whitespace-nowrap">
                        {doc.status}
                      </Badge>
                    </TD>
                    <TD align="right">
                      <Link
                        href={`/documents/${doc.no}`}
                        className="text-[12.5px] font-medium text-brand hover:underline"
                      >
                        查看
                      </Link>
                    </TD>
                  </TR>
                );
              })
            ) : (
              <TableEmpty colSpan={10}>
                <EmptyState
                  icon={<FileText />}
                  title="没有符合条件的单据"
                  desc="换个状态或关键词试试，也可以直接新建一张单据"
                  action={
                    <Link
                      href={kind === "out" ? "/outbound" : "/inbound"}
                      className={buttonClass("primary", "md")}
                    >
                      <Plus className="size-4" />
                      {kind === "out" ? "出库单" : "入库单"}
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
            共 <span className="num font-medium text-ink-2">{docs.length}</span> 张单据
          </span>
          <span className="num">
            数量合计 {qty(totalQty)} · 金额 ¥{money(totalAmount, 2)}
          </span>
        </div>
      </Card>
    </div>
  );
}

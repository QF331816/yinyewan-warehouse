import Link from "next/link";
import { CheckCircle2, ClipboardCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { TableWrap, THead, TR, TH, TD } from "@/components/ui/table";
import { StocktakeForm } from "@/components/stocktake-form";
import { readDB } from "@/lib/store";
import { itemIndex, listStocktakes } from "@/lib/queries";
import { createStocktakeAction } from "@/lib/actions";
import { longDate, qty } from "@/lib/format";

export default async function StocktakePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = ({} as Record<string, string | undefined>);
  const db = readDB();
  const list = listStocktakes(db);
  const idx = itemIndex(db);
  const active = list.find((s) => s.status === "进行中");

  return (
    <div>
      <PageHeader
        title="库存盘点"
        desc="核对账面数量与实盘数量，差异会生成盘盈 / 盘亏调整单"
        actions={
          <>
            <Link href="/inventory" className={buttonClass("secondary", "md")}>
              <ClipboardCheck className="size-4" />
              查看库存现况
            </Link>
          </>
        }
      />

      {done ? (
        <div className="mb-3.5 flex items-center gap-2 rounded-[10px] border border-[#cdeadd] bg-success-soft px-4 py-3 text-[12.5px] text-success">
          <CheckCircle2 className="size-4" />
          盘点已完成，生成 {done} 张调整单，库存已按实盘数量修正。
        </div>
      ) : null}

      {active ? (
        <Card className="mb-3.5">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                进行中的盘点单
                <span className="num text-[13px] font-normal text-ink-3">{active.no}</span>
                <Badge tone={statusTone(active.status)} dot>
                  {active.status}
                </Badge>
              </span>
            }
            desc={`${longDate(active.date)} · 盘点人 ${active.operator} · ${active.note ?? ""}`}
          />
          <div className="px-5 py-4 text-[12.5px] leading-5 text-ink-3">
            演示版不提供盘点录入。正式系统里在这里逐项填写实盘数量，完成后会自动生成盘盈 / 盘亏调整单。
          </div>
        </Card>
      ) : (
        <Card className="mb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-start gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-[#f1f5ef] text-ink-3">
                <ClipboardCheck className="size-4" />
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-ink">当前没有进行中的盘点</p>
                <p className="mt-0.5 text-[12.5px] text-ink-3">
                  建议学期末或月末盘一次。发起后系统会按当前账面数量生成盘点单，逐项录入实盘数即可。
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3.5">
        {list
          .filter((s) => s.status === "已完成")
          .map((st) => {
            const diffLines = st.lines.filter((l) => l.actualQty !== l.bookQty);
            const gain = diffLines.reduce((s, l) => s + Math.max(0, l.actualQty - l.bookQty), 0);
            const loss = diffLines.reduce((s, l) => s + Math.max(0, l.bookQty - l.actualQty), 0);
            return (
              <Card key={st.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      盘点单 <span className="num text-[13px] font-normal text-ink-3">{st.no}</span>
                      <Badge tone={statusTone(st.status)} dot>
                        {st.status}
                      </Badge>
                    </span>
                  }
                  desc={`${longDate(st.date)} · 盘点人 ${st.operator} · ${st.note ?? ""}`}
                  action={
                    <div className="flex items-center gap-3 text-[12.5px] text-ink-3">
                      <span>
                        差异 <span className="num font-medium text-ink">{diffLines.length}</span> 项
                      </span>
                      <span className="text-success">盘盈 +{qty(gain)}</span>
                      <span className="text-danger">盘亏 −{qty(loss)}</span>
                    </div>
                  }
                />
                <TableWrap fixed>
                  <THead>
                    <tr>
                      <TH className="w-[38%]">物品</TH>
                      <TH align="right" className="w-[13%]">账面</TH>
                      <TH align="right" className="w-[13%]">实盘</TH>
                      <TH align="right" className="w-[10%]">差异</TH>
                      <TH className="w-[26%]">说明</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {st.lines.map((line) => {
                      const item = idx.get(line.itemId);
                      const diff = line.actualQty - line.bookQty;
                      return (
                        <TR key={line.itemId}>
                          <TD>
                            <span className="block max-w-[260px] truncate text-[13px] text-ink">
                              {item?.name ?? "已删除物品"}
                            </span>
                            <span className="num block text-[11.5px] text-ink-3">{item?.code ?? "—"}</span>
                          </TD>
                          <TD align="right">
                            <span className="text-ink-2">{qty(line.bookQty)}</span>
                          </TD>
                          <TD align="right">
                            <span className="text-ink-2">{qty(line.actualQty)}</span>
                          </TD>
                          <TD align="right">
                            {diff === 0 ? (
                              <span className="text-ink-3">0</span>
                            ) : (
                              <span
                                className={`font-medium ${diff > 0 ? "text-success" : "text-danger"}`}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )}
                          </TD>
                          <TD>
                            <span className="text-[12px] text-ink-3">
                              {diff === 0 ? "账实相符" : diff > 0 ? "盘盈，已生成入库调整" : "盘亏，已生成出库调整"}
                            </span>
                          </TD>
                        </TR>
                      );
                    })}
                  </tbody>
                </TableWrap>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

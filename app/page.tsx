import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  Package,
  Plus,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryBars, TrendChart } from "@/components/charts";
import { readDB } from "@/lib/store";
import { dashboard, docItemsSummary, docQty, itemIndex, partnerName } from "@/lib/queries";
import { longDate, money, qty, shortDate, todayISO } from "@/lib/format";

export default function DashboardPage() {
  const db = readDB();
  const d = dashboard(db);
  const idx = itemIndex(db);
  const net = d.monthIn - d.monthOut;

  return (
    <div>
      <PageHeader
        title="工作台"
        desc={`${db.settings.schoolName} · ${db.settings.warehouseName} · ${longDate(todayISO())}`}
        actions={
          <>
            <Link href="/inbound" className={buttonClass("secondary", "md")}>
              <Plus className="size-4" />
              入库单
            </Link>
            <Link href="/outbound" className={buttonClass("primary", "md")}>
              <Plus className="size-4" />
              出库单
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="在册物品"
          value={d.itemCount}
          unit="项"
          icon={<Package />}
          tone="brand"
          foot={`${d.categories.length} 个分类 · ${new Set(db.items.map((i) => i.location)).size} 处存放位`}
        />
        <StatCard
          label="库存总量"
          value={qty(d.totalQty)}
          unit="件"
          icon={<Boxes />}
          tone="out"
          foot={
            <span>
              本月净变动{" "}
              <span className={net >= 0 ? "font-medium text-success" : "font-medium text-danger"}>
                {net >= 0 ? "+" : ""}
                {qty(net)}
              </span>
            </span>
          }
        />
        <StatCard
          label="库存金额"
          value={`¥${money(d.totalValue, 0)}`}
          icon={<Wallet />}
          tone="neutral"
          foot="按物品参考单价估算"
        />
        <StatCard
          label="需要关注"
          value={d.lowStockCount}
          unit="项"
          icon={<TriangleAlert />}
          tone={d.lowStockCount > 0 ? "danger" : "teal"}
          foot={
            <span>
              另有 <span className="font-medium text-ink-2">{d.draftCount}</span> 张草稿单待提交
            </span>
          }
        />
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="近 14 天出入库"
            desc="按数量统计，周末通常无业务"
            action={
              <div className="flex items-center gap-3 text-[12px] text-ink-3">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-brand" />入库
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px] bg-[#d08a2c]" />出库
                </span>
              </div>
            }
          />
          <CardBody className="pt-5">
            <TrendChart data={d.trend} />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[12.5px] text-ink-3">
              <span>
                今日入库 <span className="num font-medium text-ink">{d.todayIn}</span> 单
              </span>
              <span>
                今日出库 <span className="num font-medium text-ink">{d.todayOut}</span> 单
              </span>
              <span className="sm:ml-auto">
                本月入库 <span className="num font-medium text-ink">{qty(d.monthIn)}</span> · 出库{" "}
                <span className="num font-medium text-ink">{qty(d.monthOut)}</span>
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="库存金额构成" desc="按物品分类" />
          <CardBody className="pt-5">
            {d.categories.length ? (
              <CategoryBars data={d.categories} />
            ) : (
              <EmptyState title="暂无库存" desc="先建一笔入库单吧" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="库存预警"
            desc="低于安全库存或已缺货，建议尽快补货"
            action={
              <Link
                href="/inventory?filter=low"
                className="flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
              >
                全部 <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <CardBody className="px-0 py-1">
            {d.lowStock.length ? (
              <>
                <ul className="divide-y divide-line/80">
                  {d.lowStock.map((row) => (
                    <li key={row.item.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f4f6fa] text-[11px] font-medium text-ink-3">
                        {row.item.category.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{row.item.name}</p>
                        <p className="num mt-0.5 text-[11.5px] text-ink-3">
                          {row.item.location} · 现存 {row.qty} {row.item.unit} / 安全 {row.item.safetyStock}
                        </p>
                      </div>
                      <Badge tone={statusTone(row.status)} dot>
                        {row.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5">
                  <span className="text-[12px] text-ink-3">
                    建议补货合计{" "}
                    <span className="num font-medium text-ink">
                      {d.lowStock.reduce(
                        (s, r) => s + Math.max(0, r.item.safetyStock - r.qty),
                        0,
                      )}
                    </span>{" "}
                    件
                  </span>
                  <Link href="/inbound" className="text-[12.5px] font-medium text-brand hover:underline">
                    查看入库单 →
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Boxes />}
                title="库存充足"
                desc="所有物品都高于安全库存线"
                className="py-12"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="最近单据"
            desc="入库 / 出库登记记录"
            action={
              <Link
                href="/documents"
                className="flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline"
              >
                全部 <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <CardBody className="px-0 py-1">
            {d.recentDocs.length ? (
              <ul className="divide-y divide-line/80">
                {d.recentDocs.map((doc) => {
                  const isIn = doc.kind === "in";
                  return (
                    <li key={doc.id}>
                      <Link
                        href={`/documents/${doc.no}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#f8fbf7]"
                      >
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                            isIn ? "bg-success-soft text-success" : "bg-out-soft text-out"
                          }`}
                        >
                          {isIn ? (
                            <ArrowDownToLine className="size-4" />
                          ) : (
                            <ArrowUpFromLine className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="num text-[13px] font-medium text-ink">{doc.no}</span>
                            <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
                          </div>
                          <p
                            className="mt-0.5 truncate text-[12px] text-ink-2"
                            title={docItemsSummary(db, doc, 3).full}
                          >
                            {docItemsSummary(db, doc, 3).text}
                          </p>
                          <p className="truncate text-[11px] text-ink-3">
                            {doc.type} · {partnerName(db, doc)}
                            {isIn ? "" : doc.receiver ? ` · ${doc.receiver}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="num text-[13px] font-medium text-ink">
                            {isIn ? "+" : "−"}
                            {docQty(doc)}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-ink-3">{shortDate(doc.date)}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<Package />}
                title="还没有单据"
                desc="从右上角「出库单」开始"
                className="py-12"
              />
            )}
          </CardBody>
        </Card>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-[11.5px] text-ink-3">
        <span className="size-1.5 rounded-full bg-success" />
        数据保存在本地 data/db.json，可随时在「系统设置」里重置为演示数据
      </p>
    </div>
  );
}

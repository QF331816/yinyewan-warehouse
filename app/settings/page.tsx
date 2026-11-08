import { Building2, Database, MapPin, Phone, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResetDataButton } from "@/components/reset-data-button";
import { dbFilePath, readDB } from "@/lib/store";

export default function SettingsPage() {
  const db = readDB();
  const s = db.settings;

  const rows: [string, string, React.ReactNode][] = [
    ["单位", s.schoolName, <Building2 key="a" className="size-3.5" />],
    ["仓库名称", s.warehouseName, <Database key="b" className="size-3.5" />],
    ["保管员", s.keeper, <User key="c" className="size-3.5" />],
    ["联系电话", s.phone, <Phone key="d" className="size-3.5" />],
    ["存放地点", s.address, <MapPin key="e" className="size-3.5" />],
  ];

  return (
    <div>
      <PageHeader title="系统设置" desc="仓库基本信息、数据存储与演示数据管理" />

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Card>
          <CardHeader title="仓库信息" desc="打印单据时显示在抬头上" />
          <CardBody className="space-y-3.5">
            {rows.map(([label, value, icon]) => (
              <div key={label} className="flex items-center justify-between gap-4 text-[13px]">
                <span className="flex items-center gap-2 text-ink-3">
                  {icon}
                  {label}
                </span>
                <span className="font-medium text-ink">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 border-t border-line pt-3.5 text-[13px]">
              <span className="text-ink-3">本学期</span>
              <span className="num font-medium text-ink">
                {s.termStart} 至 {s.termEnd}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="数据存储"
            desc="原型阶段使用本地 JSON 文件，后续可无痛切到 PostgreSQL"
            action={<Badge tone="teal">本地文件</Badge>}
          />
          <CardBody className="space-y-3.5">
            <div>
              <p className="text-[12px] text-ink-3">数据文件</p>
              <p className="num mt-1 break-all rounded-lg bg-surface-2 px-3 py-2 text-[12px] text-ink-2">
                {dbFilePath()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-5">
              {[
                ["账号", db.users.length],
                ["物品", db.items.length],
                ["单据", db.docs.length],
                ["流水", db.txns.length],
                ["盘点", db.stocktakes.length],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
                  <p className="text-[11.5px] text-ink-3">{label}</p>
                  <p className="num text-[16px] font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-surface-2 px-3 py-2.5 text-[12px] leading-5 text-ink-3">
              账号密码、物品增删、数据库备份与修复，属于另一个系统的职责：由数据管理员在
              <span className="mx-1 rounded bg-surface px-1.5 py-0.5 text-[11.5px] text-ink-2 ring-1 ring-line">
                02-数据维护
              </span>
              里操作（默认 <span className="num">http://本机地址:3200</span>）。这里只管仓库日常业务。
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
              <p className="text-[12px] text-ink-3">演示版数据是静态快照，不支持重置。</p>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="这套系统怎么分层" desc="前端 UI / 中端逻辑 / 后端数据" />
          <CardBody>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "前端 UI 层",
                  body: "Next.js App Router + Tailwind + 自建设计系统。页面全部是服务器组件，交互部件（单据编辑器、盘点录入、新增物品）单独做成客户端组件。",
                  tags: ["app/**/page.tsx", "components/ui/*"],
                },
                {
                  title: "中端逻辑层",
                  body: "Server Actions 处理提交，queries 负责聚合计算，actions 负责过账与状态机。库存永远由流水推导，不维护冗余余额。",
                  tags: ["lib/queries.ts", "lib/actions.ts"],
                },
                {
                  title: "后端数据层",
                  body: "当前是 data/db.json 单文件存储，读写集中在 lib/store.ts。换成 Prisma + PostgreSQL 时，只需替换 readDB / mutate 两个函数。",
                  tags: ["lib/store.ts", "data/db.json"],
                },
              ].map((block) => (
                <div key={block.title} className="rounded-xl border border-line bg-surface-2 p-4">
                  <p className="text-[13px] font-medium text-ink">{block.title}</p>
                  <p className="mt-1.5 text-[12px] leading-5 text-ink-2">{block.body}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {block.tags.map((t) => (
                      <span
                        key={t}
                        className="num rounded-md bg-surface px-1.5 py-0.5 text-[11px] text-ink-3 ring-1 ring-line"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-line px-4 py-3 text-[12px] leading-5 text-ink-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>
                原型阶段没有登录与权限：这是给单个保管员用的内部工具。真正上线时需要补登录、角色（保管员 / 领用人 / 审批）
                与操作日志，这些字段与表结构在调研文档里已经预留。
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

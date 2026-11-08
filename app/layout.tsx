import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { readDB } from "@/lib/store";
import { stockMap } from "@/lib/queries";

export const metadata: Metadata = {
  title: "银叶湾幼儿园 · 物资仓库",
  description: "幼儿园物资台账、出入库登记与学期对账",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let lowStock = 0;
  let draftsIn = 0;
  let draftsOut = 0;
  let keeper = "王老师";
  let warehouse = "园务仓库";

  try {
    const db = readDB();
    const stock = stockMap(db);
    lowStock = db.items.filter((i) => (stock.get(i.id) ?? 0) < i.safetyStock).length;
    draftsIn = db.docs.filter((d) => d.status === "草稿" && d.kind === "in").length;
    draftsOut = db.docs.filter((d) => d.status === "草稿" && d.kind === "out").length;
    keeper = db.settings.keeper;
    warehouse = db.settings.warehouseName;
  } catch {
    // 首次运行时数据层尚未就绪，交给页面自身处理
  }

  return (
    <html lang="zh-CN">
      <body>
        <AppShell
          lowStock={lowStock}
          draftsIn={draftsIn}
          draftsOut={draftsOut}
          keeper={keeper}
          warehouse={warehouse}
        >
          <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[10px] border border-[#e8dcbf] bg-[#fdf7e8] px-4 py-2.5 text-[12.5px] leading-5 text-[#7a5c14]">
            <span className="font-medium">在线演示版</span>
            <span>数据是 2026-10-26 的快照，只能浏览；登记出入库请使用园内正式系统。</span>
          </div>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

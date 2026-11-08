"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  Package,
  Scale,
  Search,
  Settings,
  Warehouse,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { longDate, todayISO } from "@/lib/format";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "概览",
    items: [{ href: "/", label: "工作台", icon: LayoutDashboard }],
  },
  {
    title: "业务",
    items: [
      { href: "/items", label: "物品台账", icon: Package },
      { href: "/inbound", label: "入库单", icon: ArrowDownToLine },
      { href: "/outbound", label: "出库单", icon: ArrowUpFromLine },
      { href: "/inventory", label: "库存现况", icon: Boxes },
      { href: "/stocktake", label: "库存盘点", icon: ClipboardCheck },
    ],
  },
  {
    title: "分析",
    items: [{ href: "/ledger", label: "学期对账", icon: Scale }],
  },
];

export function AppShell({
  children,
  lowStock = 0,
  keeper = "王敏",
  warehouse = "园务仓库",
  draftsIn = 0,
  draftsOut = 0,
}: {
  children: React.ReactNode;
  lowStock?: number;
  keeper?: string;
  warehouse?: string;
  draftsIn?: number;
  draftsOut?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const badgeFor = (href: string) => {
    if (href === "/inventory") return { count: lowStock, tone: "danger" as const };
    if (href === "/inbound") return { count: draftsIn, tone: "neutral" as const };
    if (href === "/outbound") return { count: draftsOut, tone: "neutral" as const };
    return { count: 0, tone: "neutral" as const };
  };

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 pb-4">
      {GROUPS.map((group) => (
        <div key={group.title} className="mt-5 first:mt-2">
          <p className="mb-1.5 px-2.5 text-[11px] font-medium tracking-[0.08em] text-ink-3/90">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              const badge = badgeFor(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex h-9 items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] transition-colors",
                      active
                        ? "bg-brand-soft font-medium text-brand"
                        : "text-ink-2 hover:bg-[#f2f6f1] hover:text-ink",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[16px] shrink-0",
                        active ? "text-brand" : "text-ink-3 group-hover:text-ink-2",
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge.count > 0 ? (
                      <span
                        className={cn(
                          "num min-w-[18px] rounded-full px-1.5 text-center text-[11px] font-medium leading-[18px]",
                          badge.tone === "danger"
                            ? "bg-danger-soft text-danger"
                            : "bg-[#eef3ec] text-ink-3",
                        )}
                      >
                        {badge.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-5">
        <p className="mb-1.5 px-2.5 text-[11px] font-medium tracking-[0.08em] text-ink-3/90">系统</p>
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className={cn(
            "group flex h-9 items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] transition-colors",
            isActive("/settings")
              ? "bg-brand-soft font-medium text-brand"
              : "text-ink-2 hover:bg-[#f2f6f1] hover:text-ink",
          )}
        >
          <Settings
            className={cn(
              "size-[16px] shrink-0",
              isActive("/settings") ? "text-brand" : "text-ink-3 group-hover:text-ink-2",
            )}
          />
          系统设置
        </Link>
      </div>
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2.5 px-5 pb-4 pt-5">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[#17a05f] to-[#0b5a35] text-white shadow-[0_2px_6px_rgba(15,111,66,.3)]">
        <Warehouse className="size-[17px]" />
      </span>
      <span className="leading-tight">
        <span className="block text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          银叶湾幼儿园
        </span>
        <span className="block text-[11px] text-ink-3">物资仓库管理</span>
      </span>
    </Link>
  );

  const footer = (
    <div className="border-t border-line px-3 py-3">
      <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e6f3ea] text-[12px] font-semibold text-brand">
          {keeper.slice(0, 1)}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12.5px] font-medium text-ink">{keeper}</span>
          <span className="block truncate text-[11px] text-ink-3">{warehouse} · 保管员</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* 桌面侧栏 */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[228px] flex-col border-r border-line bg-surface lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* 移动端抽屉 */}
      {open ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-[#0b1220]/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[248px] flex-col border-r border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-[#f2f6f1]"
                aria-label="关闭菜单"
              >
                <X className="size-4" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[228px]">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-[#f2f6f1] lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="size-4.5" />
          </button>

          <form action="/items" className="relative hidden max-w-[340px] flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-ink-3" />
            <input
              name="q"
              placeholder="搜索物品名称、编码或单据号"
              className="h-9 w-full rounded-[9px] border border-line bg-surface-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-3/80 transition-colors hover:border-line-strong focus:border-brand focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand/10"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[12.5px] text-ink-3 md:inline">
              {longDate(todayISO())}
            </span>
            <span className="hidden h-4 w-px bg-line md:block" />
            <Link
              href="/inbound"
              className="hidden h-9 items-center gap-1.5 rounded-[9px] border border-line-strong px-3 text-[13px] font-medium text-ink-2 transition-colors hover:border-[#bfc9c1] hover:text-ink sm:inline-flex"
            >
              <ArrowDownToLine className="size-[15px] text-success" />
              入库
            </Link>
            <Link
              href="/outbound"
              className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-brand px-3.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(15,111,66,.25)] transition-colors hover:bg-brand-hover"
            >
              <ArrowUpFromLine className="size-[15px]" />
              出库
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

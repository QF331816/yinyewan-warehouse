import { readDB } from "./store";
import type { DB, Doc, Item, StockRow, Stocktake, Txn } from "./types";
import { addDaysISO, todayISO } from "./format";

export function itemIndex(db: DB) {
  const map = new Map<string, Item>();
  for (const item of db.items) map.set(item.id, item);
  return map;
}

export function partnerName(db: DB, doc: Doc) {
  if (!doc.partnerId) return "—";
  if (doc.kind === "in") {
    return db.suppliers.find((s) => s.id === doc.partnerId)?.name ?? "—";
  }
  return db.departments.find((d) => d.id === doc.partnerId)?.name ?? "—";
}

export function docTotal(doc: Doc) {
  return doc.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
}

export function docQty(doc: Doc) {
  return doc.lines.reduce((sum, l) => sum + l.qty, 0);
}

/**
 * 单据里的物品摘要：列表页要能直接看到「发了什么」，
 * 而不是只有一个单号。超过 maxItems 项时折叠成「等 N 项」。
 */
export function docItemsSummary(db: DB, doc: Doc, maxItems = 2) {
  const idx = itemIndex(db);
  const parts = doc.lines.map((line) => {
    const item = idx.get(line.itemId);
    const name = item?.name ?? "已删除物品";
    return `${name} ×${line.qty}${item?.unit ?? ""}`;
  });
  const full = parts.join("、");
  if (parts.length <= maxItems) return { text: full, full, count: parts.length };
  return {
    text: `${parts.slice(0, maxItems).join("、")} 等 ${parts.length} 项`,
    full,
    count: parts.length,
  };
}

/** 库存 = 流水聚合。永远以 txn 为准，不做增量维护。 */
export function stockMap(db: DB) {
  const map = new Map<string, number>();
  for (const t of db.txns) {
    map.set(t.itemId, (map.get(t.itemId) ?? 0) + t.qty);
  }
  return map;
}


/** 演示版：以数据中最新的单据日期当作“今天”，避免静态快照越放越旧 */
function dataAnchor(db: DB) {
  let latest = "";
  for (const d of db.docs) if (d.date > latest) latest = d.date;
  for (const t of db.txns) if (t.date > latest) latest = t.date;
  return latest || todayISO();
}

export function stockRows(db: DB = readDB()): StockRow[] {
  const stock = stockMap(db);
  const today = dataAnchor(db);
  const since = addDaysISO(today, -30);

  const recent = new Map<string, { inQty: number; outQty: number }>();
  for (const t of db.txns) {
    if (t.date < since) continue;
    const agg = recent.get(t.itemId) ?? { inQty: 0, outQty: 0 };
    if (t.qty > 0) agg.inQty += t.qty;
    else agg.outQty += -t.qty;
    recent.set(t.itemId, agg);
  }

  const lastMove = new Map<string, string>();
  for (const t of db.txns) {
    const prev = lastMove.get(t.itemId);
    if (!prev || t.date > prev) lastMove.set(t.itemId, t.date);
  }

  return db.items.map((item) => {
    const onHand = stock.get(item.id) ?? 0;
    const agg = recent.get(item.id) ?? { inQty: 0, outQty: 0 };
    return {
      item,
      qty: onHand,
      value: onHand * item.price,
      lastMoveAt: lastMove.get(item.id) ?? null,
      inLast30: agg.inQty,
      outLast30: agg.outQty,
      status:
        onHand <= 0 ? "缺货" : onHand < item.safetyStock ? "低于安全库存" : "正常",
    };
  });
}

export function getItem(id: string, db: DB = readDB()) {
  return db.items.find((i) => i.id === id) ?? null;
}

export function itemTxns(itemId: string, db: DB = readDB(), limit = 60) {
  return db.txns
    .filter((t) => t.itemId === itemId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

export type DocFilter = {
  kind?: "in" | "out";
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export function listDocs(db: DB, filter: DocFilter = {}) {
  const idx = itemIndex(db);
  const q = filter.q?.trim().toLowerCase();
  return db.docs
    .filter((doc) => {
      if (filter.kind && doc.kind !== filter.kind) return false;
      if (filter.status && filter.status !== "全部" && doc.status !== filter.status) return false;
      if (filter.from && doc.date < filter.from) return false;
      if (filter.to && doc.date > filter.to) return false;
      if (q) {
        const partner = partnerName(db, doc).toLowerCase();
        const inLines = doc.lines.some((l) => {
          const item = idx.get(l.itemId);
          return (
            item?.name.toLowerCase().includes(q) ||
            item?.code.toLowerCase().includes(q) ||
            item?.spec.toLowerCase().includes(q)
          );
        });
        const hit =
          doc.no.toLowerCase().includes(q) ||
          partner.includes(q) ||
          (doc.receiver ?? "").toLowerCase().includes(q) ||
          (doc.purpose ?? "").toLowerCase().includes(q) ||
          inLines;
        if (!hit) return false;
      }
      return true;
    })
    .slice(0, filter.limit ?? 200);
}

export function getDoc(no: string, db: DB = readDB()) {
  return db.docs.find((d) => d.no === no) ?? null;
}

export function listStocktakes(db: DB = readDB()): Stocktake[] {
  return [...db.stocktakes].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* ---------------------------------- 看板 --------------------------------- */

export function dashboard(db: DB = readDB()) {
  const rows = stockRows(db);
  const today = dataAnchor(db);
  const monthStart = `${today.slice(0, 7)}-01`;

  const monthDocs = db.docs.filter((d) => d.status === "已完成" && d.date >= monthStart);
  const monthIn = monthDocs
    .filter((d) => d.kind === "in")
    .reduce((s, d) => s + docQty(d), 0);
  const monthOut = monthDocs
    .filter((d) => d.kind === "out")
    .reduce((s, d) => s + docQty(d), 0);

  const todayDocs = db.docs.filter((d) => d.date === today && d.status === "已完成");

  // 近 14 天出入库趋势
  const trend: { date: string; inQty: number; outQty: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = addDaysISO(today, -i);
    let inQty = 0;
    let outQty = 0;
    for (const t of db.txns) {
      if (t.date !== date) continue;
      if (t.qty > 0) inQty += t.qty;
      else outQty += -t.qty;
    }
    trend.push({ date, inQty, outQty });
  }

  // 分类占比（按库存金额）
  const catMap = new Map<string, { qty: number; value: number }>();
  for (const row of rows) {
    const agg = catMap.get(row.item.category) ?? { qty: 0, value: 0 };
    agg.qty += row.qty;
    agg.value += row.value;
    catMap.set(row.item.category, agg);
  }
  const categories = [...catMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const lowStock = rows
    .filter((r) => r.status !== "正常")
    .sort((a, b) => a.qty / Math.max(1, a.item.safetyStock) - b.qty / Math.max(1, b.item.safetyStock))
    .slice(0, 6);

  const recentDocs = db.docs.slice(0, 6);

  return {
    itemCount: db.items.length,
    totalQty,
    totalValue,
    lowStockCount: rows.filter((r) => r.status !== "正常").length,
    monthIn,
    monthOut,
    todayIn: todayDocs.filter((d) => d.kind === "in").length,
    todayOut: todayDocs.filter((d) => d.kind === "out").length,
    draftCount: db.docs.filter((d) => d.status === "草稿").length,
    trend,
    categories,
    lowStock,
    recentDocs,
    rows,
  };
}

/* ---------------------------------- 对账 --------------------------------- */

export type Period = { start: string; end: string; label: string };

export function periodPresets(db: DB = readDB()): Record<string, Period> {
  const today = dataAnchor(db);
  const monthStart = `${today.slice(0, 7)}-01`;
  const prevMonthEnd = addDaysISO(monthStart, -1);
  const prevMonthStart = `${prevMonthEnd.slice(0, 7)}-01`;
  return {
    thisMonth: {
      start: monthStart,
      end: today,
      label: `${today.slice(0, 4)} 年 ${Number(today.slice(5, 7))} 月（本月）`,
    },
    lastMonth: {
      start: prevMonthStart,
      end: prevMonthEnd,
      label: `${prevMonthStart.slice(0, 4)} 年 ${Number(prevMonthStart.slice(5, 7))} 月`,
    },
    term: {
      start: db.settings.termStart,
      end: db.settings.termEnd,
      label: "本学期",
    },
    last90: {
      start: addDaysISO(today, -89),
      end: today,
      label: "近 90 天",
    },
  };
}

export type LedgerRow = {
  item: Item;
  opening: number;
  inQty: number;
  outQty: number;
  closing: number;
  value: number;
};

export function ledger(start: string, end: string, db: DB = readDB()) {
  const rows: LedgerRow[] = db.items.map((item) => {
    let opening = 0;
    let inQty = 0;
    let outQty = 0;
    for (const t of db.txns) {
      if (t.itemId !== item.id) continue;
      if (t.date < start) {
        opening += t.qty;
      } else if (t.date <= end) {
        if (t.qty > 0) inQty += t.qty;
        else outQty += -t.qty;
      }
    }
    const closing = opening + inQty - outQty;
    return { item, opening, inQty, outQty, closing, value: closing * item.price };
  });

  const active = rows.filter((r) => r.opening || r.inQty || r.outQty || r.closing);
  const totals = active.reduce(
    (acc, r) => ({
      opening: acc.opening + r.opening,
      inQty: acc.inQty + r.inQty,
      outQty: acc.outQty + r.outQty,
      closing: acc.closing + r.closing,
      openingValue: acc.openingValue + r.opening * r.item.price,
      inValue: acc.inValue + r.inQty * r.item.price,
      outValue: acc.outValue + r.outQty * r.item.price,
      value: acc.value + r.value,
    }),
    {
      opening: 0,
      inQty: 0,
      outQty: 0,
      closing: 0,
      openingValue: 0,
      inValue: 0,
      outValue: 0,
      value: 0,
    },
  );
  return { rows: active, totals };
}

export function txnsInRange(start: string, end: string, db: DB = readDB()): Txn[] {
  return db.txns.filter((t) => t.date >= start && t.date <= end);
}

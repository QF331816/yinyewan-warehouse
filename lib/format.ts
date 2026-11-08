const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function money(n: number, digits = 2) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function qty(n: number) {
  return n.toLocaleString("zh-CN");
}

/** 2026-10-25 → 10/25 */
export function shortDate(iso: string) {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 2026-10-25 → 2026 年 10 月 25 日 周日 */
export function longDate(iso: string) {
  if (!iso) return "—";
  const dt = new Date(`${iso}T00:00:00`);
  return `${dt.getFullYear()} 年 ${dt.getMonth() + 1} 月 ${dt.getDate()} 日 ${WEEK[dt.getDay()]}`;
}

export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string) {
  const t1 = new Date(`${a}T00:00:00`).getTime();
  const t2 = new Date(`${b}T00:00:00`).getTime();
  return Math.round((t2 - t1) / 86400000);
}

export function monthLabel(iso: string) {
  const [y, m] = iso.split("-");
  return `${y} 年 ${Number(m)} 月`;
}

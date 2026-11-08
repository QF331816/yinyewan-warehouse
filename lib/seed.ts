import type {
  DB,
  Doc,
  DocLine,
  Item,
  Stocktake,
  Txn,
  User,
} from "./types";
import { hashPassword } from "./auth";
import { CATEGORY_META } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function addDays(base: Date, n: number) {
  return new Date(base.getTime() + n * DAY);
}

/** 确定性伪随机：同一份种子永远生成同一批数据，方便截图与演示 */
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPERATORS = ["王老师", "赵老师", "周老师", "陈老师"];
const RECEIVERS = ["赵老师", "孙老师", "周老师", "吴老师", "郑老师", "冯老师"];
const PURPOSES = ["日常教学", "班级活动", "实验课程", "运动会筹备", "卫生打扫", "设备维护", "考试考务"];

type SeedRow = [string, string, string, string, number, number, number];

// 名称、规格、分类、单位、安全库存、参考单价、期初入库量
// 幼儿园仓库的真实构成：办公、教具、绘本、美工、玩具、户外、生活、清洁、保健、环创、电子、安全
const ROWS: SeedRow[] = [
  ["A4 复印纸", "70g / 500 张·包", "办公用品", "包", 30, 22, 160],
  ["中性笔", "0.5mm 黑色", "办公用品", "支", 60, 1.5, 240],
  ["白板笔", "可擦 黑色", "办公用品", "支", 20, 3.2, 90],
  ["文件袋", "A4 塑料 透明", "办公用品", "个", 50, 0.8, 200],
  ["订书机", "12# 中号", "办公用品", "个", 5, 18, 14],
  ["便利贴", "76×76mm 黄色", "办公用品", "本", 30, 2.5, 110],
  ["教学卡片", "数字 1-100", "教学教具", "套", 6, 15, 40],
  ["七巧板", "木质 大号", "教学教具", "套", 8, 12, 30],
  ["计数棒", "100 根装", "教学教具", "盒", 10, 9, 36],
  ["绘本《好饿的毛毛虫》", "精装 硬壳", "图书绘本", "本", 5, 32, 20],
  ["绘本合集（大班）", "20 册装", "图书绘本", "套", 3, 180, 8],
  ["幼儿认知卡片书", "硬卡 撕不烂", "图书绘本", "本", 6, 18, 24],
  ["水彩笔", "24 色 可水洗", "美工材料", "盒", 12, 16, 48],
  ["彩泥", "12 色 安全无毒", "美工材料", "盒", 15, 12, 60],
  ["A4 彩纸", "100 张 / 包", "美工材料", "包", 10, 8, 40],
  ["儿童安全剪刀", "圆头 塑料柄", "美工材料", "把", 20, 6, 80],
  ["固体胶", "15g", "美工材料", "支", 30, 3.5, 120],
  ["拼插积木", "300 粒 大颗粒", "玩具器械", "套", 8, 68, 30],
  ["桌面拼图", "60 片 动物", "玩具器械", "套", 10, 25, 40],
  ["皮球", "4 号 橡胶", "户外运动", "个", 8, 28, 30],
  ["呼啦圈", "直径 50cm", "户外运动", "个", 10, 15, 36],
  ["沙包", "200g 帆布", "户外运动", "个", 12, 6, 48],
  ["抽纸", "3 层 100 抽", "生活用品", "提", 20, 12, 80],
  ["儿童水杯", "304 不锈钢", "生活用品", "个", 15, 25, 50],
  ["小毛巾", "25×50cm 纯棉", "生活用品", "条", 30, 6, 100],
  ["垃圾袋", "45×55cm 加厚", "清洁用品", "卷", 30, 5, 120],
  ["洗手液", "500ml 按压", "清洁用品", "瓶", 15, 12, 56],
  ["创可贴", "100 片 / 盒", "保健用品", "盒", 5, 9, 20],
  ["儿童口罩", "独立包装", "保健用品", "包", 10, 15, 40],
  ["主题墙贴", "大号 可移除", "环创装饰", "套", 5, 35, 18],
  ["气球", "100 只 / 包", "环创装饰", "包", 10, 12, 40],
  ["蓝牙音箱", "便携 防水", "电子设备", "个", 2, 129, 6],
  ["U 盘", "64G USB3.0", "电子设备", "个", 3, 39, 12],
  ["防撞条", "2m / 卷 加厚", "安全防护", "卷", 10, 18, 30],
  ["安全插座盖", "10 只 / 包", "安全防护", "包", 8, 9, 24],
];

/** 数据维护系统的最高权限账号（首次建库自动写入） */
export function demoAdminUser(date = ymd(new Date())): User {
  return {
    id: "usr_admin",
    username: "演示管理员",
    name: "演示管理员",
    role: "数据管理员",
    passwordHash: hashPassword("demo-only-password"),
    passwordUpdatedAt: date,
    createdAt: date,
    updatedAt: date,
  };
}

/** 演示账号：保管员初始密码 123456；数据管理员只用于「数据维护」系统 */
export function defaultUsers(date = ymd(new Date())): User[] {
  const make = (
    id: string,
    username: string,
    name: string,
    role: User["role"],
    isPrimary = false,
  ): User => ({
    id,
    username,
    name,
    role,
    passwordHash: hashPassword("123456"),
    passwordUpdatedAt: date,
    isPrimary,
    createdAt: date,
    updatedAt: date,
  });

  return [
    
    make("usr_002", "wanglaoshi", "王老师", "保管员", true),
    make("usr_003", "chenlaoshi", "陈老师", "保管员"),
  ];
}

export function buildSeed(now = new Date()): DB {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const rand = mulberry32(20261025);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

  const counters = new Map<string, number>();
  const items: Item[] = ROWS.map((row, i) => {
    const [name, spec, category, unit, safetyStock, price] = row;
    const meta = CATEGORY_META[category] ?? { prefix: "QT", zone: "A 区" };
    const seq = ROWS.slice(0, i).filter((r) => r[2] === category).length;
    return {
      id: `itm_${String(i + 1).padStart(3, "0")}`,
      code: `${meta.prefix}-${String(101 + seq).padStart(4, "0")}`,
      name,
      spec,
      category,
      unit,
      location: `${meta.zone}-${String(Math.floor(seq / 3) + 1).padStart(2, "0")}-${String(
        (seq % 4) + 1,
      ).padStart(2, "0")}`,
      safetyStock,
      price,
      keeper: i % 3 === 0 ? "王老师" : i % 3 === 1 ? "李老师" : "陈老师",
      createdAt: ymd(addDays(today, -120)),
    };
  });

  const suppliers = [
    { id: "sup_001", name: "市新华文教用品有限公司", contact: "胡经理", phone: "138 0571 2210" },
    { id: "sup_002", name: "教学仪器设备供应站", contact: "钱经理", phone: "139 0571 8834" },
    { id: "sup_003", name: "体育用品专营店", contact: "孙店长", phone: "137 0571 5521" },
    { id: "sup_004", name: "清洁用品批发部", contact: "李经理", phone: "135 0571 6642" },
    { id: "sup_005", name: "数码配件商城", contact: "周经理", phone: "136 0571 9903" },
  ];

  const departments = [
    { id: "dep_001", name: "园长室", contact: "赵园长" },
    { id: "dep_002", name: "园务办公室", contact: "孙主任" },
    { id: "dep_003", name: "小一班", contact: "周老师" },
    { id: "dep_004", name: "小二班", contact: "吴老师" },
    { id: "dep_005", name: "中一班", contact: "郑老师" },
    { id: "dep_006", name: "大一班", contact: "冯老师" },
    { id: "dep_007", name: "保健室", contact: "陈医生" },
    { id: "dep_008", name: "图书角", contact: "褚老师" },
  ];

  const docs: Doc[] = [];
  const txns: Txn[] = [];
  const balance = new Map<string, number>(items.map((i) => [i.id, 0]));
  let docSeq = 0;
  let txnSeq = 0;

  function nextNo(kind: "in" | "out", date: string) {
    const year = date.slice(0, 4);
    const key = `${kind}${year}`;
    const n = (counters.get(key) ?? 0) + 1;
    counters.set(key, n);
    return `${kind === "in" ? "RK" : "CK"}${year}-${String(n).padStart(4, "0")}`;
  }

  function applyDoc(doc: Doc) {
    if (doc.status !== "已完成") return;
    for (const line of doc.lines) {
      const sign = doc.kind === "in" ? 1 : -1;
      const next = (balance.get(line.itemId) ?? 0) + sign * line.qty;
      balance.set(line.itemId, next);
      txns.push({
        id: `txn_${String(++txnSeq).padStart(5, "0")}`,
        date: doc.date,
        itemId: line.itemId,
        qty: sign * line.qty,
        balanceAfter: next,
        docId: doc.id,
        docNo: doc.no,
        kind: doc.kind,
        operator: doc.operator,
      });
    }
  }

  function makeDoc(opts: {
    kind: "in" | "out";
    date: string;
    type: string;
    status: Doc["status"];
    lines: DocLine[];
    partnerId?: string;
    receiver?: string;
    purpose?: string;
    note?: string;
    voidReason?: string;
  }) {
    docSeq += 1;
    const doc: Doc = {
      id: `doc_${String(docSeq).padStart(4, "0")}`,
      no: nextNo(opts.kind, opts.date),
      kind: opts.kind,
      type: opts.type as Doc["type"],
      date: opts.date,
      status: opts.status,
      operator: pick(OPERATORS),
      partnerId: opts.partnerId,
      receiver: opts.receiver,
      purpose: opts.purpose,
      note: opts.note,
      lines: opts.lines,
      createdAt: opts.date,
    };
    if (opts.status === "已作废") {
      doc.voidedAt = opts.date;
      doc.voidReason = opts.voidReason ?? "重复开单";
    }
    docs.push(doc);
    applyDoc(doc);
    return doc;
  }

  const inTypes = ["采购入库", "退回入库", "调拨入库"] as const;
  const outTypes = ["领用出库", "报废出库"] as const;

  // 期初建账：第 88 天一次性采购入库
  const initDate = ymd(addDays(today, -88));
  makeDoc({
    kind: "in",
    date: initDate,
    type: "采购入库",
    status: "已完成",
    partnerId: "sup_001",
    note: "新学期开仓建账，一次性备货",
    lines: ROWS.map((row, i) => ({
      itemId: `itm_${String(i + 1).padStart(3, "0")}`,
      qty: row[6],
      price: row[5],
    })),
  });

  // 随机日常单据
  for (let d = 86; d >= 1; d -= 1) {
    const date = addDays(today, -d);
    const weekday = date.getDay();
    const busy = weekday >= 1 && weekday <= 5;

    const inCount = busy ? (rand() < 0.45 ? 1 : 0) : rand() < 0.12 ? 1 : 0;
    for (let k = 0; k < inCount; k++) {
      const nLines = int(1, 3);
      const chosen = new Set<number>();
      const lines: DocLine[] = [];
      for (let j = 0; j < nLines; j++) {
        const idx = int(0, items.length - 1);
        if (chosen.has(idx)) continue;
        chosen.add(idx);
        const item = items[idx];
        lines.push({
          itemId: item.id,
          qty: int(6, 40),
          price: Number((item.price * (0.92 + rand() * 0.12)).toFixed(2)),
        });
      }
      if (!lines.length) continue;
      makeDoc({
        kind: "in",
        date: ymd(date),
        type: pick(inTypes),
        status: "已完成",
        partnerId: pick(suppliers).id,
        lines,
      });
    }

    const outCount = busy ? (rand() < 0.72 ? int(1, 2) : 0) : rand() < 0.15 ? 1 : 0;
    for (let k = 0; k < outCount; k++) {
      const nLines = int(1, 3);
      const chosen = new Set<number>();
      const lines: DocLine[] = [];
      for (let j = 0; j < nLines; j++) {
        const idx = int(0, items.length - 1);
        if (chosen.has(idx)) continue;
        chosen.add(idx);
        const item = items[idx];
        const avail = balance.get(item.id) ?? 0;
        if (avail <= 2) continue;
        lines.push({
          itemId: item.id,
          qty: int(1, Math.max(1, Math.min(12, Math.floor(avail * 0.35)))),
          price: item.price,
        });
      }
      if (!lines.length) continue;
      const dep = pick(departments);
      makeDoc({
        kind: "out",
        date: ymd(date),
        type: pick(outTypes),
        status: "已完成",
        partnerId: dep.id,
        receiver: pick(RECEIVERS),
        purpose: pick(PURPOSES),
        lines,
      });
    }
  }

  // 开学物资发放：把部分物品压到安全库存线以下，形成真实的补货预警。
  // 每种物品单独一天出库，避免出现一张几百件、把趋势图压扁的异常单据。
  const lowTargets = items
    .map((item) => {
      const bal = balance.get(item.id) ?? 0;
      const need = bal - Math.floor(item.safetyStock * 0.5);
      return { item, bal, need };
    })
    .filter((x) => x.bal > x.item.safetyStock && x.need > 0 && x.need <= 130)
    .sort((a, b) => b.need - a.need)
    .slice(0, 5);

  lowTargets.forEach(({ item, need }, i) => {
    makeDoc({
      kind: "out",
      date: ymd(addDays(today, -(i + 1))),
      type: "领用出库",
      status: "已完成",
      partnerId: i % 2 === 0 ? "dep_001" : "dep_002",
      receiver: i % 2 === 0 ? "赵主任" : "孙主任",
      purpose: "开学物资发放",
      note: "各年级组开学物资统一发放",
      lines: [{ itemId: item.id, qty: need, price: item.price }],
    });
  });

  // 今天：保证有今日流水
  makeDoc({
    kind: "out",
    date: ymd(today),
    type: "领用出库",
    status: "已完成",
    partnerId: "dep_005",
    receiver: "郑老师",
    purpose: "实验课程",
    lines: [
      { itemId: "itm_011", qty: 2, price: items[10].price },
      { itemId: "itm_015", qty: 1, price: items[14].price },
    ],
  });
  makeDoc({
    kind: "in",
    date: ymd(today),
    type: "采购入库",
    status: "已完成",
    partnerId: "sup_002",
    lines: [
      { itemId: "itm_012", qty: 10, price: 8.8 },
      { itemId: "itm_013", qty: 6, price: 11.5 },
    ],
    note: "实验室补充采购",
  });
  makeDoc({
    kind: "out",
    date: ymd(today),
    type: "领用出库",
    status: "草稿",
    partnerId: "dep_007",
    receiver: "陈老师",
    purpose: "运动会筹备",
    lines: [
      { itemId: "itm_016", qty: 4, price: items[15].price },
      { itemId: "itm_019", qty: 10, price: items[18].price },
    ],
    note: "待体育组确认后提交",
  });

  // 一张已作废单据（演示状态机）
  makeDoc({
    kind: "out",
    date: ymd(addDays(today, -6)),
    type: "领用出库",
    status: "已作废",
    partnerId: "dep_003",
    receiver: "周老师",
    purpose: "班级活动",
    lines: [{ itemId: "itm_002", qty: 30, price: items[1].price }],
    voidReason: "重复开单，已合并至 CK 另一张单据",
  });

  // 已完成盘点（含盘盈盘亏调整）
  const st1Date = ymd(addDays(today, -20));
  const st1Lines = items.slice(0, 12).map((item, idx) => {
    const book = balance.get(item.id) ?? 0;
    const diff = idx === 2 ? -2 : idx === 6 ? 3 : 0;
    return { itemId: item.id, bookQty: book, actualQty: book + diff };
  });
  const stocktake1: Stocktake = {
    id: "st_001",
    no: "PD2026-0001",
    date: st1Date,
    status: "已完成",
    operator: "王敏",
    note: "月末抽盘：办公用品 + 教学耗材",
    lines: st1Lines,
    createdAt: st1Date,
    finishedAt: st1Date,
  };

  for (const line of st1Lines) {
    const diff = line.actualQty - line.bookQty;
    if (!diff) continue;
    const item = items.find((i) => i.id === line.itemId)!;
    makeDoc({
      kind: diff > 0 ? "in" : "out",
      date: st1Date,
      type: diff > 0 ? "盘盈入库" : "盘亏出库",
      status: "已完成",
      partnerId: diff > 0 ? undefined : "dep_002",
      receiver: diff > 0 ? undefined : "王敏",
      purpose: "库存盘点差异调整",
      note: `盘点单 ${stocktake1.no}`,
      lines: [{ itemId: item.id, qty: Math.abs(diff), price: item.price }],
    });
  }

  // 进行中的盘点单（待录入实盘数）
  const st2Lines = items.slice(0, 8).map((item) => {
    const book = balance.get(item.id) ?? 0;
    return { itemId: item.id, bookQty: book, actualQty: book };
  });
  const stocktake2: Stocktake = {
    id: "st_002",
    no: "PD2026-0002",
    date: ymd(today),
    status: "进行中",
    operator: "王敏",
    note: "办公用品专项盘点",
    lines: st2Lines,
    createdAt: ymd(today),
  };

  return {
    version: 1,
    settings: {
      schoolName: "银叶湾幼儿园",
      warehouseName: "园务仓库",
      keeper: "王老师",
      phone: "0571-8888 1234",
      address: "行政楼 B1-07",
      termStart: "2026-09-01",
      termEnd: "2027-01-25",
    },
    users: defaultUsers(ymd(today)),
    items,
    suppliers,
    departments,
    docs: docs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    txns: txns.sort((a, b) => (a.date < b.date ? 1 : -1)),
    stocktakes: [stocktake2, stocktake1],
  };
}

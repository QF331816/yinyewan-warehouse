// 银叶湾幼儿园 · 领域模型
// 设计原则：库存只认流水（txn）。任何数量变化都必须产生一条 txn，
// 余额表由流水聚合得出，随时可以对账重算。

export type DocKind = "in" | "out";
export type DocStatus = "草稿" | "已完成" | "已作废";

export const INBOUND_TYPES = ["采购入库", "退回入库", "调拨入库", "盘盈入库"] as const;
export const OUTBOUND_TYPES = ["领用出库", "报废出库", "调拨出库"] as const;

export type InboundType = (typeof INBOUND_TYPES)[number];
export type OutboundType = (typeof OUTBOUND_TYPES)[number];
export type DocType = InboundType | OutboundType | "盘亏出库";

// 幼儿园物资分类：按「谁用、用在哪」来分，保管员一眼能归位
export const CATEGORIES = [
  "办公用品",
  "教学教具",
  "图书绘本",
  "美工材料",
  "玩具器械",
  "户外运动",
  "生活用品",
  "清洁用品",
  "保健用品",
  "环创装饰",
  "电子设备",
  "安全防护",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** 分类对应的物品编码前缀与存放区，新增物品时自动套用 */
export const CATEGORY_META: Record<string, { prefix: string; zone: string }> = {
  办公用品: { prefix: "BG", zone: "A 区" },
  教学教具: { prefix: "JJ", zone: "B 区" },
  图书绘本: { prefix: "TS", zone: "C 区" },
  美工材料: { prefix: "MG", zone: "D 区" },
  玩具器械: { prefix: "WJ", zone: "E 区" },
  户外运动: { prefix: "HW", zone: "F 区" },
  生活用品: { prefix: "SH", zone: "G 区" },
  清洁用品: { prefix: "QJ", zone: "H 区" },
  保健用品: { prefix: "BJ", zone: "I 区" },
  环创装饰: { prefix: "HC", zone: "J 区" },
  电子设备: { prefix: "DZ", zone: "K 区" },
  安全防护: { prefix: "AQ", zone: "L 区" },
};

export interface Item {
  id: string;
  code: string;
  name: string;
  spec: string;
  category: Category | string;
  unit: string;
  location: string;
  safetyStock: number;
  price: number;
  keeper: string;
  remark?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

export interface Department {
  id: string;
  name: string;
  contact: string;
}

export interface DocLine {
  itemId: string;
  qty: number;
  price: number;
  note?: string;
}

export interface Doc {
  id: string;
  no: string;
  kind: DocKind;
  type: DocType;
  date: string;
  status: DocStatus;
  operator: string;
  /** 入库：供应商；出库：领用部门 */
  partnerId?: string;
  /** 出库领用人 */
  receiver?: string;
  purpose?: string;
  note?: string;
  lines: DocLine[];
  createdAt: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface Txn {
  id: string;
  date: string;
  itemId: string;
  /** 正数入库，负数出库 */
  qty: number;
  balanceAfter: number;
  docId: string;
  docNo: string;
  kind: DocKind | "adjust";
  operator: string;
  note?: string;
}

export interface StocktakeLine {
  itemId: string;
  bookQty: number;
  actualQty: number;
  note?: string;
}

export interface Stocktake {
  id: string;
  no: string;
  date: string;
  status: "进行中" | "已完成";
  operator: string;
  lines: StocktakeLine[];
  note?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface Settings {
  schoolName: string;
  warehouseName: string;
  keeper: string;
  phone: string;
  address: string;
  termStart: string;
  termEnd: string;
}

/** 仓库账号。数据管理员只存在于「数据维护」系统，负责数据库结构与数据。 */
export type UserRole = "数据管理员" | "保管员";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  /** 格式 salt:hash，由 lib/auth.ts 生成 */
  passwordHash: string;
  passwordUpdatedAt: string;
  /** 默认保管员：仓库抬头、单据默认经办人取自它 */
  isPrimary?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DB {
  version: number;
  settings: Settings;
  users: User[];
  items: Item[];
  suppliers: Supplier[];
  departments: Department[];
  docs: Doc[];
  txns: Txn[];
  stocktakes: Stocktake[];
}

/** 库存行（由流水聚合） */
export interface StockRow {
  item: Item;
  qty: number;
  value: number;
  lastMoveAt: string | null;
  outLast30: number;
  inLast30: number;
  status: "缺货" | "低于安全库存" | "正常";
}

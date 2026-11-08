"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, PackagePlus, Plus, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Combobox, type ComboOption } from "@/components/combobox";
import { buttonClass } from "@/components/ui/button";
import { createDocumentAction } from "@/lib/actions";
import {
  CATEGORIES,
  INBOUND_TYPES,
  OUTBOUND_TYPES,
  type Department,
  type DocKind,
  type Item,
  type Supplier,
} from "@/lib/types";
import { money, qty, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

type Line = {
  key: string;
  itemId: string;
  /** 入库时直接新建的物品（还没有 id） */
  newName?: string;
  newUnit?: string;
  newSpec?: string;
  price?: number;
  /** 入库时要落库的分类 */
  category: string;
  qty: number;
};

let seq = 0;
const nextKey = () => `l${++seq}`;

export function DocEditor({
  initialKind,
  items,
  suppliers,
  departments,
  operator,
  stock,
  presetItemId,
}: {
  initialKind: DocKind;
  items: Item[];
  suppliers: Supplier[];
  departments: Department[];
  operator: string;
  stock: Record<string, number>;
  presetItemId?: string;
}) {
  const [kind, setKind] = useState<DocKind>(initialKind);
  const [type, setType] = useState<string>(
    initialKind === "in" ? INBOUND_TYPES[0] : OUTBOUND_TYPES[0],
  );
  const [date, setDate] = useState(todayISO());
  const [partnerName, setPartnerName] = useState("");
  const [receiver, setReceiver] = useState("");
  const [purpose, setPurpose] = useState("");
  const [note, setNote] = useState("");

  const preset = presetItemId ? items.find((i) => i.id === presetItemId) : undefined;
  const [lines, setLines] = useState<Line[]>(() => [
    {
      key: nextKey(),
      itemId: preset?.id ?? "",
      category: preset?.category ?? "",
      qty: 1,
    },
  ]);

  const isIn = kind === "in";

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const itemOptions = useMemo<ComboOption[]>(
    () =>
      items.map((item) => {
        const onHand = stock[item.id] ?? 0;
        return {
          value: item.id,
          label: item.name,
          hint: [item.code, item.spec].filter(Boolean).join(" · "),
          meta: `现存 ${qty(onHand)} ${item.unit}`,
          metaTone: onHand < item.safetyStock ? ("danger" as const) : ("muted" as const),
          group: item.category,
        };
      }),
    [items, stock],
  );

  const partnerOptions = useMemo<ComboOption[]>(
    () =>
      isIn
        ? suppliers.map((s) => ({
            value: s.name,
            label: s.name,
            hint: [s.contact, s.phone].filter(Boolean).join(" · "),
          }))
        : departments.map((d) => ({
            value: d.name,
            label: d.name,
            hint: d.contact,
          })),
    [isIn, suppliers, departments],
  );

  const priceOf = (line: Line) =>
    line.itemId ? itemMap.get(line.itemId)?.price ?? 0 : line.price ?? 0;

  const valid = lines.filter(
    (l) => (l.itemId || l.newName) && l.qty > 0 && (!isIn || l.category),
  );
  const totalQty = valid.reduce((s, l) => s + l.qty, 0);
  const totalAmount = valid.reduce((s, l) => s + l.qty * priceOf(l), 0);
  const overIssue = isIn ? [] : valid.filter((l) => l.qty > (stock[l.itemId] ?? 0));
  const pendingNew = valid.filter((l) => !l.itemId && l.newName).length;

  const switchKind = (next: DocKind) => {
    if (next === kind) return;
    setKind(next);
    setType(next === "in" ? INBOUND_TYPES[0] : OUTBOUND_TYPES[0]);
    setPartnerName("");
    setReceiver("");
    setPurpose("");
  };

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  /** 选中已有物品就带出它当前的分类；输入了一个不存在的名字，转成「新建物品」 */
  const onItemChange = (key: string, value: string) => {
    const existing = itemMap.get(value);
    if (existing) {
      updateLine(key, {
        itemId: existing.id,
        newName: undefined,
        newUnit: undefined,
        newSpec: undefined,
        price: undefined,
        category: existing.category,
      });
      return;
    }
    if (!value.trim()) {
      updateLine(key, { itemId: "", newName: undefined, category: "" });
      return;
    }
    updateLine(key, {
      itemId: "",
      newName: value.trim(),
      category: "",
      newUnit: "个",
      price: 0,
    });
  };

  const payload = JSON.stringify(
    valid.map((l) => ({
      itemId: l.itemId || undefined,
      newName: l.newName,
      newUnit: l.newUnit,
      newSpec: l.newSpec,
      category: l.category,
      qty: Number(l.qty),
      price: priceOf(l),
    })),
  );

  return (
    <form action={createDocumentAction} className="grid items-start gap-3.5 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="lines" value={payload} />
      <input type="hidden" name="operator" value={operator} />
      <input type="hidden" name="partnerName" value={partnerName} />

      <div className="space-y-3.5">
        <Card>
          <CardHeader
            title="单据信息"
            desc={isIn ? "记录这批物品的来源与到货日期" : "记录谁领用、用于什么"}
            action={
              <div className="flex rounded-[9px] border border-line bg-surface-2 p-0.5">
                {(
                  [
                    { k: "in" as DocKind, label: "入库", icon: ArrowDownToLine },
                    { k: "out" as DocKind, label: "出库", icon: ArrowUpFromLine },
                  ]
                ).map(({ k, label, icon: Icon }) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => switchKind(k)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-[7px] px-2.5 text-[12.5px] transition-colors",
                      kind === k
                        ? k === "in"
                          ? "bg-surface font-medium text-success shadow-[0_1px_2px_rgba(16,24,40,.08)]"
                          : "bg-surface font-medium text-out shadow-[0_1px_2px_rgba(16,24,40,.08)]"
                        : "text-ink-3 hover:text-ink",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody className="grid gap-3.5 sm:grid-cols-2">
            <Field label="单据类型">
              <Select name="typeDisplay" value={type} onChange={(e) => setType(e.target.value)}>
                {(isIn ? INBOUND_TYPES : OUTBOUND_TYPES).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="业务日期">
              <Input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <Field
              label={isIn ? "供应商" : "领用部门"}
              hint={isIn ? "可以直接输入新的供应商名称，提交时自动建档" : "没有的部门也可以直接输入"}
            >
              <Combobox
                options={partnerOptions}
                value={partnerName}
                onChange={(v) => setPartnerName(v)}
                allowCreate
                commitOnType
                placeholder={isIn ? "输入或选择供应商" : "输入或选择领用部门"}
                createLabel={(q) => (isIn ? `使用新供应商「${q}」` : `使用新部门「${q}」`)}
                createHint={
                  isIn ? "提交后自动加入供应商名单，下次可直接选" : "提交后自动加入领用部门名单"
                }
                ariaLabel={isIn ? "供应商" : "领用部门"}
                emptyText={isIn ? "没有这个供应商，回车直接新建" : "没有这个部门，回车直接新建"}
              />
            </Field>

            {isIn ? (
              <Field label="入库经办人">
                <Input value={operator} readOnly className="bg-surface-2 text-ink-3" />
              </Field>
            ) : (
              <Field label="领用人">
                <Input
                  name="receiver"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="例如：郑老师"
                />
              </Field>
            )}

            {isIn ? null : (
              <Field label="用途" className="sm:col-span-2">
                <Input
                  name="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="例如：美术课 / 六一活动"
                />
              </Field>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="物品明细"
            desc={
              isIn
                ? "输入名称或编码搜索；台账里没有的，直接输入名字回车新建，分类必填"
                : "输入名称或编码搜索，选中后按单位填写数量"
            }
            action={
              <button
                type="button"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    { key: nextKey(), itemId: "", category: "", qty: 1 },
                  ])
                }
                className={buttonClass("secondary", "sm")}
              >
                <Plus className="size-3.5" />
                添加一行
              </button>
            }
          />
          <div className="divide-y divide-line">
            <div className="hidden grid-cols-[1fr_104px_120px_40px] gap-3 px-5 py-2 text-[12px] font-medium text-ink-3 sm:grid">
              <span>物品</span>
              <span className="text-right">数量</span>
              <span className="text-right">金额</span>
              <span />
            </div>

            {lines.map((line, index) => {
              const item = line.itemId ? itemMap.get(line.itemId) : undefined;
              const isNew = !line.itemId && Boolean(line.newName);
              const amount = priceOf(line) * line.qty;
              const shortage = !isIn && item ? line.qty > (stock[item.id] ?? 0) : false;

              return (
                <div
                  key={line.key}
                  className="grid grid-cols-[1fr_40px] items-start gap-3 px-5 py-2.5 sm:grid-cols-[1fr_104px_120px_40px]"
                >
                  <div className="min-w-0">
                    <Combobox
                      options={itemOptions}
                      value={line.itemId || line.newName || ""}
                      onChange={(value) => onItemChange(line.key, value)}
                      allowCreate={isIn}
                      placeholder={
                        isIn ? "输入名称或编码，没有就直接新建" : "输入名称或编码，或点开选择"
                      }
                      ariaLabel={`第 ${index + 1} 行物品`}
                      createLabel={(q) => `新建物品「${q}」`}
                      createHint={isIn ? "提交后自动加入物品台账，分类必填" : undefined}
                      emptyText={
                        isIn ? "没有这个物品，回车直接新建" : "没有匹配的物品，换个关键词试试"
                      }
                    />

                    {isNew ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-0.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
                          <PackagePlus className="size-3" />
                          新物品
                        </span>
                        <Select
                          value={line.category}
                          onChange={(e) => updateLine(line.key, { category: e.target.value })}
                          aria-label={`第 ${index + 1} 行分类`}
                          className="h-7 w-[104px] px-2 text-[11.5px]"
                        >
                          <option value="">选择分类 *</option>
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                        <Input
                          value={line.newUnit ?? ""}
                          onChange={(e) => updateLine(line.key, { newUnit: e.target.value })}
                          aria-label={`第 ${index + 1} 行单位`}
                          placeholder="单位"
                          className="h-7 w-[62px] px-2 text-[11.5px]"
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.price ?? 0}
                          onChange={(e) => updateLine(line.key, { price: Number(e.target.value) })}
                          aria-label={`第 ${index + 1} 行单价`}
                          placeholder="单价"
                          className="h-7 w-[78px] px-2 text-[11.5px]"
                        />
                        <Input
                          value={line.newSpec ?? ""}
                          onChange={(e) => updateLine(line.key, { newSpec: e.target.value })}
                          aria-label={`第 ${index + 1} 行规格`}
                          placeholder="规格（选填）"
                          className="h-7 w-[110px] px-2 text-[11.5px]"
                        />
                      </div>
                    ) : item ? (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-0.5">
                        {isIn ? (
                          <label className="inline-flex items-center gap-1 text-[11px] text-ink-3">
                            分类
                            <Select
                              value={line.category}
                              onChange={(e) => updateLine(line.key, { category: e.target.value })}
                              aria-label={`第 ${index + 1} 行分类`}
                              className="h-6 w-[92px] px-1.5 text-[11px]"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </Select>
                            {line.category && line.category !== item.category ? (
                              <span className="text-warn">提交后更新台账</span>
                            ) : null}
                          </label>
                        ) : (
                          <span className="text-[11px] text-ink-3">{item.category}</span>
                        )}
                        <span
                          className={cn("text-[11px]", shortage ? "text-danger" : "text-ink-3")}
                        >
                          现存 {qty(stock[item.id] ?? 0)} {item.unit} · {item.location || "未设库位"}
                          {shortage ? "｜数量超出现存" : ""}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: Number(e.target.value) })}
                      className="h-9 pr-8 text-right"
                      aria-label={`第 ${index + 1} 行数量`}
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11.5px] text-ink-3">
                      {item?.unit ?? line.newUnit ?? ""}
                    </span>
                  </div>

                  <div className="hidden pt-2 text-right sm:block">
                    <span className="num text-[13px] text-ink">¥{money(amount)}</span>
                    <span className="num ml-1 text-[11px] text-ink-3">@{money(priceOf(line))}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setLines((prev) =>
                        prev.length > 1 ? prev.filter((l) => l.key !== line.key) : prev,
                      )
                    }
                    className="mt-0.5 grid size-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger"
                    aria-label="删除这一行"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardBody>
            <Field label="备注" hint="选填，例如到货批次、验收情况、领用事由">
              <Textarea
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="写点说明，方便以后查账"
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-3.5 lg:sticky lg:top-[76px]">
        <Card>
          <CardHeader title="合计" />
          <CardBody className="space-y-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-ink-3">品项数</span>
              <span className="num font-medium text-ink">{valid.length} 项</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3">总数量</span>
              <span className="num font-medium text-ink">{qty(totalQty)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5">
              <span className="text-ink-3">总金额</span>
              <span className="num text-[17px] font-semibold text-ink">¥{money(totalAmount)}</span>
            </div>
            <p className="rounded-lg bg-surface-2 p-2.5 text-[11.5px] leading-4 text-ink-3">
              {isIn
                ? "提交后库存立即增加；填写的分类会同步更新到物品台账。"
                : "提交后会校验库存是否充足，不足会提示。"}
            </p>
            {pendingNew > 0 ? (
              <p className="rounded-lg bg-brand-soft p-2.5 text-[11.5px] leading-4 text-brand">
                有 {pendingNew} 个新物品，提交时自动建档（编码按分类生成）。
              </p>
            ) : null}
            {overIssue.length ? (
              <p className="rounded-lg bg-danger-soft p-2.5 text-[11.5px] leading-4 text-danger">
                {overIssue.length} 项数量超出当前库存，请调整后再提交（可先存为草稿）。
              </p>
            ) : null}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            name="submit"
            value="post"
            disabled={!valid.length || overIssue.length > 0}
            className={buttonClass("primary", "lg")}
          >
            提交并过账
          </button>
          <button
            type="submit"
            name="submit"
            value="draft"
            disabled={!valid.length}
            className={buttonClass("secondary", "lg")}
          >
            存为草稿
          </button>
          <Link href={isIn ? "/inbound" : "/outbound"} className={buttonClass("ghost", "md")}>
            取消
          </Link>
        </div>

        <Card>
          <CardHeader title="填写提示" />
          <CardBody className="space-y-2 text-[12px] leading-5 text-ink-3">
            <p>· 物品支持直接输入名称或编码搜索，选中后自动带出单位与单价。</p>
            <p>· 入库时可以把物品挂到别的分类，提交后台账里的分类会跟着改。</p>
            <p>· 台账里没有的东西，直接输入名字回车，填好分类就自动建档。</p>
            <p>· 出库数量不能超过现存数量；不够就「存为草稿」，补货后再提交。</p>
          </CardBody>
        </Card>
      </div>
    </form>
  );
}

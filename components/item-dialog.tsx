"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { CATEGORIES, type Item } from "@/lib/types";
import { saveItemAction } from "@/lib/actions";

export function ItemDialog({
  item,
  defaultCategory,
  redirectTo = "/items",
}: {
  item?: Item;
  defaultCategory?: string;
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(item);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {editing ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-2 hover:text-brand"
        >
          <Pencil className="size-3.5" />
          编辑
        </button>
      ) : (
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          新增物品
        </Button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0b1220]/40 p-4 backdrop-blur-[2px] sm:p-8">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 mt-6 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">
                  {editing ? "编辑物品" : "新增物品"}
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {editing ? `编码 ${item?.code}` : "编码会按分类自动生成"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-[#f2f6f1]"
                aria-label="关闭"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={saveItemAction} className="px-5 py-4">
              {item ? <input type="hidden" name="id" value={item.id} /> : null}
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="物品名称" className="sm:col-span-2">
                  <Input name="name" defaultValue={item?.name} placeholder="例如：A4 复印纸" required />
                </Field>
                <Field label="规格型号">
                  <Input name="spec" defaultValue={item?.spec} placeholder="例如：70g / 500 张·包" />
                </Field>
                <Field label="分类">
                  <Select name="category" defaultValue={item?.category ?? defaultCategory ?? "办公用品"}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="单位">
                  <Input name="unit" defaultValue={item?.unit} placeholder="包 / 支 / 个" />
                </Field>
                <Field label="存放位置">
                  <Input name="location" defaultValue={item?.location} placeholder="例如：A 区-01-02" />
                </Field>
                <Field label="安全库存" hint="低于此值会在库存预警中提示">
                  <Input
                    name="safetyStock"
                    type="number"
                    min={0}
                    defaultValue={item?.safetyStock ?? 10}
                  />
                </Field>
                <Field label="参考单价（元）">
                  <Input name="price" type="number" step="0.01" min={0} defaultValue={item?.price ?? 0} />
                </Field>
                <Field label="保管人">
                  <Input name="keeper" defaultValue={item?.keeper ?? "王敏"} />
                </Field>
                <Field label="备注" className="sm:col-span-2">
                  <Textarea name="remark" defaultValue={item?.remark} placeholder="选填" />
                </Field>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setOpen(false)} className={buttonClass("secondary")}>
                  取消
                </button>
                <button type="submit" className={buttonClass("primary")}>
                  {editing ? "保存修改" : "创建物品"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

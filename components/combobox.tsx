"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboOption = {
  value: string;
  label: string;
  /** 次要说明，例如物品编码，也参与搜索 */
  hint?: string;
  /** 右侧补充信息，例如「现存 192 包」 */
  meta?: string;
  metaTone?: "muted" | "danger";
  /** 分组标题，例如物品分类 */
  group?: string;
};

/**
 * 可输入 + 可下拉的选择框。
 * - 输入即过滤（匹配 label 与 hint）
 * - 上下键移动、回车选中、Esc 关闭
 * - allowCreate：输入了不存在的值时，可直接回车新建
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "输入或选择",
  allowCreate = false,
  commitOnType = false,
  createLabel = (q: string) => `新建「${q}」`,
  createHint,
  ariaLabel,
  emptyText = "没有匹配项",
  className,
  inputClassName,
}: {
  options: ComboOption[];
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  allowCreate?: boolean;
  /** 允许"只输入不选择"：每次键入都把文字当值提交（用于供应商这类自由文本） */
  commitOnType?: boolean;
  createLabel?: (query: string) => string;
  /** 新建项下方的一行说明 */
  createHint?: string;
  ariaLabel?: string;
  emptyText?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [cache, setCache] = useState<Record<string, string>>({});
  const selected =
    options.find((o) => o.value === value) ??
    (value && cache[value] ? { value, label: cache[value] } : null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint ?? "").toLowerCase().includes(q) ||
        (o.meta ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const trimmed = query.trim();
  const canCreate =
    allowCreate &&
    trimmed.length > 0 &&
    !options.some((o) => o.label.trim().toLowerCase() === trimmed.toLowerCase());

  const rows = filtered.length + (canCreate ? 1 : 0);

  // 打开时把高亮定位到已选项
  useEffect(() => {
    if (!open) return;
    const idx = filtered.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // 键盘移动时保持高亮项可见
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelectorAll<HTMLElement>("[data-row]")[active];
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (option: ComboOption) => {
    setCache((c) => ({ ...c, [option.value]: option.label }));
    onChange(option.value, option.label);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const create = () => {
    setCache((c) => ({ ...c, [trimmed]: trimmed }));
    onChange(trimmed, trimmed);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActive((i) => (rows === 0 ? 0 : (i + 1) % rows));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (rows === 0 ? 0 : (i - 1 + rows) % rows));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      if (active < filtered.length) {
        choose(filtered[active]);
      } else if (canCreate) {
        create();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const displayValue = open
    ? query
    : selected?.label ?? (commitOnType ? value : "");

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          value={displayValue}
          onChange={(e) => {
            const text = e.target.value;
            setQuery(text);
            setOpen(true);
            setActive(0);
            if (commitOnType) {
              onChange(text, text);
            } else if (text === "" && value) {
              onChange("", "");
            }
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className={cn(
            "h-9 w-full rounded-[9px] border border-line-strong bg-surface pl-3 pr-8 text-[13.5px] text-ink",
            "placeholder:text-ink-3/80 hover:border-[#bfc9c1]",
            "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/12",
            inputClassName,
          )}
        />
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3 transition-transform",
            open && "rotate-180",
          )}
        />
      </div>

      {open ? (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-[280px] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]"
        >
          {filtered.length === 0 && !canCreate ? (
            <p className="px-2.5 py-3 text-[12.5px] text-ink-3">{emptyText}</p>
          ) : null}

          {filtered.map((option, index) => {
            const isActive = index === active;
            const isSelected = option.value === value;
            const showGroup = option.group && filtered[index - 1]?.group !== option.group;
            return (
              <div key={option.value}>
                {showGroup ? (
                  <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium tracking-[0.04em] text-ink-3">
                    {option.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  data-row
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-[7px] text-left text-[13px] transition-colors",
                    isActive ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-[#f5f8f3]",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.hint ? (
                      <span
                        className={cn(
                          "num block truncate text-[11px]",
                          isActive ? "text-brand/70" : "text-ink-3",
                        )}
                      >
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                  {option.meta ? (
                    <span
                      className={cn(
                        "num shrink-0 text-[11.5px]",
                        option.metaTone === "danger" ? "text-danger" : "text-ink-3",
                      )}
                    >
                      {option.meta}
                    </span>
                  ) : null}
                  {isSelected ? <Check className="size-3.5 shrink-0" /> : null}
                </button>
              </div>
            );
          })}

          {canCreate ? (
            <>
              <button
                type="button"
                data-row
                onMouseEnter={() => setActive(filtered.length)}
                onClick={create}
                className={cn(
                  "mt-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-[7px] text-left text-[13px]",
                  active === filtered.length ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-[#f5f8f3]",
                )}
              >
                <Plus className="size-3.5 shrink-0" />
                <span className="truncate">{createLabel(trimmed)}</span>
              </button>
              {createHint ? (
                <p className="px-2.5 pb-1.5 pt-1 text-[11px] text-ink-3">{createHint}</p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

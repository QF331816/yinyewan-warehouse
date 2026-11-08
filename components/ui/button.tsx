import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_1px_2px_rgba(15,111,66,.25)] hover:bg-brand-hover active:translate-y-px",
  secondary:
    "bg-surface text-ink-2 border border-line-strong hover:bg-surface-2 hover:text-ink active:translate-y-px",
  ghost: "text-ink-2 hover:bg-[#eaf0e8] hover:text-ink",
  danger: "bg-danger text-white hover:brightness-95 active:translate-y-px",
  quiet: "bg-brand-soft text-brand hover:bg-[#e2ebff]",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-[12.5px] gap-1.5 rounded-lg",
  md: "h-9 px-3.5 text-[13.5px] gap-2 rounded-[9px]",
  lg: "h-10 px-4 text-[14px] gap-2 rounded-[10px]",
  icon: "h-9 w-9 rounded-[9px]",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md") {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
    "transition-[background-color,color,box-shadow,transform] duration-150",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANT[variant],
    SIZE[size],
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

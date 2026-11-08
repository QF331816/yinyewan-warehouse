"use client";

import { RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { resetDataAction } from "@/lib/actions";

export function ResetDataButton() {
  return (
    <form
      action={resetDataAction}
      onSubmit={(e) => {
        const ok = window.confirm("会清空当前所有单据与库存记录，并重新生成一套演示数据。确定继续？");
        if (!ok) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClass("secondary", "md")}>
        <RotateCcw className="size-4" />
        重置为演示数据
      </button>
    </form>
  );
}

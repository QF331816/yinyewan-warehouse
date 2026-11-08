"use client";

import { CheckCircle2, Printer, XCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { postDocAction } from "@/lib/actions";

export function DocActions({ no, status }: { no: string; status: string }) {
  return (
    <div className="no-print flex items-center gap-2">
      <button type="button" onClick={() => window.print()} className={buttonClass("secondary", "md")}>
        <Printer className="size-4" />
        打印
      </button>

      {status === "草稿" ? (
        <form action={postDocAction}>
          <input type="hidden" name="no" value={no} />
          <input type="hidden" name="status" value="已完成" />
          <button type="submit" className={buttonClass("primary", "md")}>
            <CheckCircle2 className="size-4" />
            提交过账
          </button>
        </form>
      ) : null}

      {status !== "已作废" ? (
        <form
          action={postDocAction}
          onSubmit={(e) => {
            const ok = window.confirm("作废后该单据对库存的影响会被回滚，确定要作废吗？");
            if (!ok) e.preventDefault();
          }}
        >
          <input type="hidden" name="no" value={no} />
          <input type="hidden" name="status" value="已作废" />
          <input type="hidden" name="reason" value="手工作废" />
          <button type="submit" className={buttonClass("ghost", "md")}>
            <XCircle className="size-4 text-danger" />
            作废
          </button>
        </form>
      ) : null}
    </div>
  );
}

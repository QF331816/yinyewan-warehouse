import { DocList } from "@/components/doc-list";

export default async function InboundPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "全部", q = "" } = ({} as Record<string, string | undefined>);
  return (
    <DocList
      kind="in"
      status={status}
      q={q}
      title="入库单"
      desc="采购到货、退回、调拨进来的物品，提交后自动增加库存"
    />
  );
}

import { DocList } from "@/components/doc-list";

export default async function OutboundPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "全部", q = "" } = ({} as Record<string, string | undefined>);
  return (
    <DocList
      kind="out"
      status={status}
      q={q}
      title="出库单"
      desc="各班级、科室领用与报废出库的登记，提交后自动扣减库存"
    />
  );
}

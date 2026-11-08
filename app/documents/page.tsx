import { DocList } from "@/components/doc-list";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; q?: string }>;
}) {
  const { kind, status = "全部", q = "" } = ({} as Record<string, string | undefined>);
  const only = kind === "in" || kind === "out" ? kind : undefined;

  return (
    <DocList
      kind={only}
      status={status}
      q={q}
      title="全部单据"
      desc="入库与出库合并查看，方便按关键词一次找齐"
      showKindTabs
    />
  );
}

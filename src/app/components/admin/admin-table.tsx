type AdminTableProps = {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  hasRows: boolean;
  colSpan?: number;
};

export default function AdminTable({
  headers,
  children,
  emptyMessage = "暂无数据 / No data",
  hasRows,
  colSpan,
}: AdminTableProps) {
  const span = colSpan ?? headers.length;

  return (
    <article className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100 p-2 shadow-sm">
      <table className="table table-zebra">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
          {!hasRows ? (
            <tr>
              <td colSpan={span} className="py-8 text-center text-base-content/60">
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </article>
  );
}

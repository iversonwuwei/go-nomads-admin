type AdminTableProps = {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  hasRows: boolean;
  colSpan?: number;
  meta?: React.ReactNode;
  tableClassName?: string;
};

export default function AdminTable({
  headers,
  children,
  emptyMessage = "暂无数据 / No data",
  hasRows,
  colSpan,
  meta,
  tableClassName,
}: AdminTableProps) {
  const span = colSpan ?? headers.length;

  return (
    <article className="control-table-shell">
      {meta ? <div className="control-table-meta">{meta}</div> : null}
      <div className="control-table-wrap">
        <table className={`table table-zebra ${tableClassName ?? ""}`.trim()}>
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
                <td colSpan={span} className="py-10 text-center text-sm text-base-content/45">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}

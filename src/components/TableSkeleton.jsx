// Cədvəl məlumatı yüklənən müddətdə boş ekran/qəfil "tullanma" əvəzinə göstərilir
export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-paper" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

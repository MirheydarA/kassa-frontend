import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pageSize, totalCount, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / (pageSize || 1)))
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
      <span>
        {totalCount} nəticədən {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
      </span>
      <div className="flex items-center gap-1">
        <button
          className="btn-secondary !px-2 !py-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-ink">{page} / {totalPages}</span>
        <button
          className="btn-secondary !px-2 !py-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

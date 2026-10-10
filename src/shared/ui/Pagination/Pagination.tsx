import { ka } from '../../i18n/ka'
import './Pagination.css'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange(page: number): void
  disabled?: boolean
}

export function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      
      if (page > 3) {
        pages.push('...')
      }
      
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (page < totalPages - 2) {
        pages.push('...')
      }
      
      pages.push(totalPages)
    }
    
    return pages
  }

  return (
    <nav className="pagination" aria-label={ka.common.pagination}>
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || disabled}
        aria-label={ka.catalog.prev}
      >
        {ka.catalog.prev}
      </button>
      <div className="pagination__pages">
        {getPages().map((p, index) => {
          if (typeof p === 'string') {
            return <span key={`ellipsis-${index}`} className="pagination__ellipsis" aria-hidden="true">…</span>
          }
          return (
            <button
              key={p}
              type="button"
              className={`pagination__page ${p === page ? 'pagination__page--current' : ''}`}
              onClick={() => onPageChange(p)}
              disabled={disabled}
              aria-label={ka.common.pageN(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || disabled}
        aria-label={ka.catalog.next}
      >
        {ka.catalog.next}
      </button>
    </nav>
  )
}


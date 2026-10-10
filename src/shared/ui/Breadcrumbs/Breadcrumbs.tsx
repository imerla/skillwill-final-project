import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import './Breadcrumbs.css'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          
          return (
            <li key={index} className="breadcrumbs__item">
              {item.href && !isLast ? (
                <Link to={item.href} className="breadcrumbs__link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight size={16} className="breadcrumbs__separator" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

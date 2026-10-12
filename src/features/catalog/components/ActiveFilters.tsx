import type { Category } from '../types'
import { Button } from '../../../shared/ui/Button/Button'
import { X } from 'lucide-react'
import { ka } from '../../../shared/i18n/ka'
import './ActiveFilters.css'

interface ActiveFiltersProps {
  category: Category | undefined
  params: Record<string, string | number | boolean | undefined>
  onClearFilter: (key: string, value?: string) => void
  onClearAll: () => void
}

export function ActiveFilters({ category, params, onClearFilter, onClearAll }: ActiveFiltersProps) {
  const activeFilters: Array<{ key: string; label: string; value: string }> = []

  // Add search query
  if (params.q) {
    activeFilters.push({
      key: 'q',
      label: ka.catalog.search,
      value: params.q as string
    })
  }

  // Add sort
  if (params.sort) {
    const sortLabels: Record<string, string> = {
      'newest': ka.catalog.sort.newest,
      'oldest': ka.catalog.sort.oldest,
      'price-asc': ka.catalog.sort['price-asc'],
      'price-desc': ka.catalog.sort['price-desc'],
      'rating-desc': ka.catalog.sort['rating-desc'],
      'popular': ka.catalog.sort.popular,
      'title-asc': ka.catalog.sort['title-asc']
    }
    activeFilters.push({
      key: 'sort',
      label: ka.catalog.sortLabel,
      value: sortLabels[params.sort as string] || params.sort as string
    })
  }

  // Add price range
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const priceParts: string[] = []
    if (params.minPrice !== undefined) priceParts.push(`${params.minPrice}₾`)
    if (params.maxPrice !== undefined) priceParts.push(`${params.maxPrice}₾`)
    activeFilters.push({
      key: 'price',
      label: ka.catalog.price,
      value: priceParts.join(' - ')
    })
  }

  // Add boolean filters (inStock, onSale)
  if (params.inStock === true) {
    activeFilters.push({
      key: 'inStock',
      label: ka.catalog.inStock,
      value: ka.catalog.inStock
    })
  }

  if (params.onSale === true) {
    activeFilters.push({
      key: 'onSale',
      label: ka.catalog.onSale,
      value: ka.catalog.onSale
    })
  }

  // Add attribute filters
  category?.filters?.forEach((filter) => {
    const value = params[filter.key]
    if (value && typeof value === 'string') {
      if (filter.type === 'checkbox' || filter.type === 'color') {
        const values = value.split(',').filter(Boolean)
        values.forEach((v) => {
          const option = filter.options?.find((opt) => opt.value === v)
          activeFilters.push({
            key: `${filter.key}:${v}`,
            label: filter.label,
            value: option?.label || v
          })
        })
      } else if (filter.type === 'radio') {
        const option = filter.options?.find((opt) => opt.value === value)
        activeFilters.push({
          key: filter.key,
          label: filter.label,
          value: option?.label || value
        })
      }
    }
  })

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="active-filters">
      <div className="active-filters__list">
        {activeFilters.map((filter) => (
          <div key={filter.key} className="active-filters__chip">
            <span className="active-filters__chip-label">{filter.label}:</span>
            <span className="active-filters__chip-value">{filter.value}</span>
            <button
              type="button"
              className="active-filters__chip-remove"
              onClick={() => {
                if (filter.key.includes(':')) {
                  const [baseKey, value] = filter.key.split(':')
                  onClearFilter(baseKey, value)
                } else {
                  onClearFilter(filter.key)
                }
              }}
              aria-label={ka.catalog.removeFilter}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="secondary"
        onClick={onClearAll}
        className="active-filters__clear-all"
      >
        {ka.catalog.clearAll}
      </Button>
    </div>
  )
}

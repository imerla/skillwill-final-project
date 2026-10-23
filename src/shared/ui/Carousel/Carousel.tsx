import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import './Carousel.css'

interface CarouselProps {
  children: React.ReactNode
  itemsPerView?: number
  gap?: number
}

export function Carousel({ children, itemsPerView = 4, gap = 24 }: CarouselProps) {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responsiveItemsPerView, setResponsiveItemsPerView] = useState(itemsPerView)
  const [itemWidth, setItemWidth] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const items = Array.isArray(children) ? children : [children]
  const totalItems = items.length

  useEffect(() => {
    const updateItemWidth = () => {
      if (trackRef.current) {
        const containerWidth = trackRef.current.offsetWidth
        const width = window.innerWidth
        let viewItems = itemsPerView

        if (width < 480) {
          viewItems = 1
        } else if (width < 768) {
          viewItems = 2
        } else if (width < 1024) {
          viewItems = 3
        }

        setResponsiveItemsPerView(viewItems)
        setItemWidth((containerWidth - gap * (viewItems - 1)) / viewItems)
      }
    }

    updateItemWidth()
    window.addEventListener('resize', updateItemWidth)
    return () => window.removeEventListener('resize', updateItemWidth)
  }, [itemsPerView, gap])

  const handleNext = () => {
    const maxIndex = Math.max(0, totalItems - responsiveItemsPerView)
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev()
    if (e.key === 'ArrowRight') handleNext()
  }

  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < totalItems - responsiveItemsPerView

  const scrollAmount = currentIndex * (itemWidth + gap)

  return (
    <div className="carousel" onKeyDown={handleKeyDown} tabIndex={0}>
      <button
        className="carousel__nav carousel__nav--prev"
        onClick={handlePrev}
        disabled={!canScrollLeft}
        aria-label={t.common.previous}
      >
        <ChevronLeft size={24} />
      </button>

      <div className="carousel__container">
        <div
          ref={trackRef}
          className="carousel__track"
          style={{
            transform: `translateX(-${scrollAmount}px)`,
            gap: `${gap}px`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="carousel__item"
              style={{ width: `${itemWidth}px` }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <button
        className="carousel__nav carousel__nav--next"
        onClick={handleNext}
        disabled={!canScrollRight}
        aria-label={t.common.next}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  )
}

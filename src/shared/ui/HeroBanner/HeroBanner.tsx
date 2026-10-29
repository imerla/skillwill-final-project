import type { ReactNode } from 'react'
import './HeroBanner.css'

interface HeroBannerProps {
  title: string
  subtitle?: string
  image: string
  children?: ReactNode
  height?: 'small' | 'medium' | 'large'
}

export function HeroBanner({ title, subtitle, image, children, height = 'medium' }: HeroBannerProps) {
  return (
    <div className={`hero-banner hero-banner--${height}`}>
      <div className="hero-banner__background">
        <img
          src={image}
          alt=""
          width={1920}
          height={1080}
          sizes="100vw"
          fetchPriority="high"
          className="hero-banner__image"
        />
        <div className="hero-banner__overlay" />
      </div>
      <div className="hero-banner__content">
        <h1 className="hero-banner__title">{title}</h1>
        {subtitle && <p className="hero-banner__subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { generateImageSrcset } from '../../lib/imageUtils'
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
          srcSet={generateImageSrcset(image, [
            { width: 800, quality: 75 },
            { width: 1200, quality: 80 },
            { width: 1920, quality: 85 }
          ])}
          alt=""
          width={1920}
          height={1080}
          sizes="100vw"
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

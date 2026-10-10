import './Skeleton.css'

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle'
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ variant = 'rect', className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}


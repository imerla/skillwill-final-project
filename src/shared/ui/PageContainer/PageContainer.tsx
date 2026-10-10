import './PageContainer.css'

interface PageContainerProps {
  size?: 'page' | 'form' | 'narrow'
  as?: 'div' | 'main' | 'section'
  children: React.ReactNode
}

export function PageContainer({ size = 'page', as = 'div', children }: PageContainerProps) {
  const Component = as
  return <Component className={`page-container page-container--${size}`}>{children}</Component>
}


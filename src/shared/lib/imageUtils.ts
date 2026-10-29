/**
 * Optimizes image URLs using Vercel Image Optimization
 * Only works when deployed on Vercel
 */
export function getOptimizedImageUrl(
  url: string | undefined,
  width: number,
  quality: number = 80
): string | undefined {
  if (!url) return undefined

  // Skip optimization for local development or non-external URLs
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url
  }

  // Add Vercel image optimization parameters
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}w=${width}&q=${quality}&format=webp`
}

/**
 * Generates srcset for responsive images
 */
export function generateImageSrcset(
  url: string | undefined,
  sizes: { width: number; quality?: number }[]
): string | undefined {
  if (!url) return undefined

  return sizes
    .map(({ width, quality = 80 }) => {
      const optimizedUrl = getOptimizedImageUrl(url, width, quality)
      return `${optimizedUrl} ${width}w`
    })
    .join(', ')
}

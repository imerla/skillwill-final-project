export function formatPrice(value: number, currency: string = 'GEL'): string {
  try {
    return new Intl.NumberFormat('ka-GE', { style: 'currency', currency }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export function formatDate(iso: string, withTime: boolean = false): string {
  try {
    return new Date(iso).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    })
  } catch {
    return iso
  }
}


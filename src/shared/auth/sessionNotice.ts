export function setSessionExpiredNotice(): void {
  try {
    window.sessionStorage.setItem('sessionExpiredNotice', '1')
  } catch {
    // Storage unavailable, fail silently
  }
}

export function hasSessionExpiredNotice(): boolean {
  try {
    return window.sessionStorage.getItem('sessionExpiredNotice') === '1'
  } catch {
    return false
  }
}

export function clearSessionExpiredNotice(): void {
  try {
    window.sessionStorage.removeItem('sessionExpiredNotice')
  } catch {
    // Storage unavailable, fail silently
  }
}


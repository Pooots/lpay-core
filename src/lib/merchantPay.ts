export function merchantPayPath(code: string): string {
  return `/pay/${encodeURIComponent(code.trim().toUpperCase())}`
}

export function merchantPayUrl(code: string): string {
  const path = merchantPayPath(code)
  if (typeof window === 'undefined') {
    return path
  }
  return `${window.location.origin}${path}`
}

export function formatKES(value: number): string {
  return `KES ${value.toLocaleString('en-KE')}`
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function statusChipColor(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const statusLower = status.toLowerCase()
  if (statusLower === 'paid' || statusLower === 'active' || statusLower === 'success' || statusLower === 'repaid') {
    return 'success'
  }
  if (statusLower === 'pending' || statusLower === 'overdue') {
    return 'warning'
  }
  if (statusLower === 'failed' || statusLower === 'rejected') {
    return 'danger'
  }
  return 'neutral'
}

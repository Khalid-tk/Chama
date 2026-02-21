/**
 * Format utilities for responses
 */

export function formatKES(amount) {
  return `KES ${amount.toLocaleString('en-KE')}`
}

export function formatDate(date) {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

export function formatDateTime(date) {
  if (!date) return null
  return new Date(date).toISOString()
}

export function paginateResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      total,
      pages: Math.ceil(total / (parseInt(limit) || 10)),
    },
  }
}

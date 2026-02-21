/**
 * CSV export utility functions
 */

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0])
  
  // Convert data to CSV rows
  const rows = data.map((row) => {
    return csvHeaders.map((header) => {
      const value = row[header]
      // Handle null/undefined
      if (value === null || value === undefined) return ''
      // Handle dates
      if (value instanceof Date) return value.toISOString().split('T')[0]
      // Escape commas and quotes in strings
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
  })

  // Combine headers and rows
  const csv = [csvHeaders, ...rows].map((row) => row.join(',')).join('\n')
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

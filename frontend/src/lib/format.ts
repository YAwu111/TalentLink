/** 后端时间统一存 naive UTC，展示时转浏览器本地时区。 */
function parseServerDate(value: string): Date {
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value)
  return new Date(`${value.replace(' ', 'T')}Z`)
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseServerDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseServerDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

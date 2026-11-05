export function todayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone,
  }).formatToParts(new Date())
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + amount))
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}

export function shiftMonth(date: string, amount: number): string {
  const [year, month] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1))
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-01`
}

export function getCalendarDays(anchor: string, weekStartsOn: number, period: 'month' | 'week'): string[] {
  const [year, month, day] = anchor.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const isoWeekday = date.getUTCDay() || 7
  const offset = (isoWeekday - weekStartsOn + 7) % 7
  if (period === 'week') {
    const first = addDays(anchor, -offset)
    return Array.from({ length: 7 }, (_, index) => addDays(first, index))
  }
  const firstOfMonth = `${year}-${pad(month)}-01`
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay() || 7
  const firstOffset = (firstWeekday - weekStartsOn + 7) % 7
  const cellCount = Math.ceil((firstOffset + daysInMonth) / 7) * 7
  return Array.from({ length: cellCount }, (_, index) => addDays(firstOfMonth, index - firstOffset))
}

export function weekdayLabels(locale: string, weekStartsOn: number): string[] {
  const monday = new Date(Date.UTC(2024, 0, 1))
  return Array.from({ length: 7 }, (_, index) => {
    const weekday = ((weekStartsOn - 1 + index) % 7)
    return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
      .format(new Date(monday.getTime() + weekday * 86_400_000))
      .replace(/\.$/, '')
  })
}

export function formatCalendarDate(date: string, locale: string, options: Intl.DateTimeFormatOptions = {}): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
}

export function partsInTimezone(value: string, timezone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: timezone,
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}

export function dateTimeInTimezoneToIso(date: string, time: string, timezone: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  let guess = desiredAsUtc
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hourCycle: 'h23', timeZone: timezone,
  })
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = formatter.formatToParts(new Date(guess))
    const get = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0)
    const representedAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
    const difference = desiredAsUtc - representedAsUtc
    if (difference === 0) return new Date(guess).toISOString()
    guess += difference
  }
  const actual = partsInTimezone(new Date(guess).toISOString(), timezone)
  if (actual.date !== date || actual.time !== time) {
    throw new Error('Это местное время не существует из-за перехода часов. Выбери другое время.')
  }
  return new Date(guess).toISOString()
}

export function formatTaskTime(startAt: string | null, endAt: string | null, timezone: string, locale: string): string | null {
  if (!startAt && !endAt) return null
  const time = (value: string) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(new Date(value))
  if (startAt && endAt) return `${time(startAt)}–${time(endAt)}`
  return time(startAt ?? endAt!)
}

export function pad(value: number): string { return value.toString().padStart(2, '0') }

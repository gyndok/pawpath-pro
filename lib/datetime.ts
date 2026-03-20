export const DEFAULT_TIME_ZONE = 'America/Chicago'

export const COMMON_TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'UTC',
]

type DateInput = Date | string | number

function formatParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>
}

export function normalizeTimeZone(timeZone: string | null | undefined) {
  const candidate = timeZone?.trim() || DEFAULT_TIME_ZONE

  try {
    Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

export function formatDateInTimeZone(
  value: DateInput,
  timeZone: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimeZone(timeZone),
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...options,
  }).format(new Date(value))
}

export function formatDateTimeInTimeZone(
  value: DateInput,
  timeZone: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimeZone(timeZone),
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(new Date(value))
}

export function formatTimeInTimeZone(
  value: DateInput,
  timeZone: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimeZone(timeZone),
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(new Date(value))
}

export function formatDateKeyInTimeZone(value: DateInput, timeZone: string | null | undefined) {
  const parts = formatParts(new Date(value), normalizeTimeZone(timeZone))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function toDateTimeLocalInTimeZone(value: DateInput, timeZone: string | null | undefined) {
  const parts = formatParts(new Date(value), normalizeTimeZone(timeZone))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function toDateInputInTimeZone(value: DateInput, timeZone: string | null | undefined) {
  const parts = formatParts(new Date(value), normalizeTimeZone(timeZone))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function toTimeInputInTimeZone(value: DateInput, timeZone: string | null | undefined) {
  const parts = formatParts(new Date(value), normalizeTimeZone(timeZone))
  return `${parts.hour}:${parts.minute}`
}

export function getTodayDateKeyInTimeZone(timeZone: string | null | undefined, now = new Date()) {
  return formatDateKeyInTimeZone(now, timeZone)
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1))
  date.setUTCDate(date.getUTCDate() + days)
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export function getWeekdayFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1)).getUTCDay()
}

export function zonedDateTimeToUtc(dateKey: string, time: string, timeZone: string | null | undefined) {
  const zone = normalizeTimeZone(timeZone)
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const targetUtc = Date.UTC(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0)
  let guess = targetUtc

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const parts = formatParts(new Date(guess), zone)
    const observedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    )
    guess += targetUtc - observedUtc
  }

  return new Date(guess)
}

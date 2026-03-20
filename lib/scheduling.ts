import {
  addDaysToDateKey,
  formatDateInTimeZone,
  formatTimeInTimeZone,
  getTodayDateKeyInTimeZone,
  getWeekdayFromDateKey,
  normalizeTimeZone,
  zonedDateTimeToUtc,
} from '@/lib/datetime'

export type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export type BlockedDateRow = {
  start_date: string
  end_date: string
  reason: string | null
}

export type ServiceSummary = {
  id: string
  name: string
  duration_minutes: number
  base_price: number
}

export type ExistingBookingRow = {
  scheduled_at: string
  status: string
  duration_minutes: number
}

export type BookingSettings = {
  travel_buffer_minutes: number
  slot_interval_minutes: number
  advance_window_days: number
  allow_same_day_booking: boolean
  service_area_zip_codes: string[]
  time_zone?: string
}

export type AvailableSlot = {
  iso: string
  date: string
  time: string
  label: string
}

export type AvailableDateGroup = {
  date: string
  label: string
  slots: AvailableSlot[]
}

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  travel_buffer_minutes: 15,
  slot_interval_minutes: 15,
  advance_window_days: 30,
  allow_same_day_booking: false,
  service_area_zip_codes: [],
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function extractZipCode(address: string | null | undefined) {
  if (!address) return null
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/)
  return match?.[1] ?? null
}

export function isClientInServiceArea(address: string | null | undefined, serviceAreaZipCodes: string[]) {
  if (!serviceAreaZipCodes.length) {
    return { allowed: true, clientZip: extractZipCode(address) }
  }

  const clientZip = extractZipCode(address)
  if (!clientZip) {
    return { allowed: false, clientZip: null }
  }

  return {
    allowed: serviceAreaZipCodes.includes(clientZip),
    clientZip,
  }
}

export function buildAvailableDatesByService(params: {
  services: ServiceSummary[]
  availability: AvailabilityRow[]
  blockedDates: BlockedDateRow[]
  bookings: ExistingBookingRow[]
  settings?: Partial<BookingSettings> | null
  now?: Date
}) {
  const now = params.now ?? new Date()
  const settings: BookingSettings = {
    ...DEFAULT_BOOKING_SETTINGS,
    ...params.settings,
    service_area_zip_codes: params.settings?.service_area_zip_codes ?? DEFAULT_BOOKING_SETTINGS.service_area_zip_codes,
  }
  const timeZone = normalizeTimeZone(params.settings?.time_zone)

  const activeAvailability = new Map(
    params.availability
      .filter((row) => row.is_active)
      .map((row) => [row.day_of_week, row])
  )

  const futureBookings = params.bookings
    .filter((booking) => booking.status === 'pending' || booking.status === 'approved')
    .map((booking) => {
      const start = new Date(booking.scheduled_at)
      const end = new Date(start.getTime() + booking.duration_minutes * 60 * 1000)
      return { start, end }
    })

  const results: Record<string, AvailableDateGroup[]> = {}
  const todayDateKey = getTodayDateKeyInTimeZone(timeZone, now)
  const firstBookableDayOffset = settings.allow_same_day_booking ? 0 : 1

  for (const service of params.services) {
    const serviceGroups: AvailableDateGroup[] = []

    for (let offset = firstBookableDayOffset; offset <= settings.advance_window_days; offset += 1) {
      const dateKey = addDaysToDateKey(todayDateKey, offset)
      const weekday = getWeekdayFromDateKey(dateKey)
      const availability = activeAvailability.get(weekday)
      if (!availability) continue

      const isBlocked = params.blockedDates.some((range) => dateKey >= range.start_date && dateKey <= range.end_date)
      if (isBlocked) continue

      const serviceMs = service.duration_minutes * 60 * 1000
      const bufferMs = settings.travel_buffer_minutes * 60 * 1000
      const slots: AvailableSlot[] = []
      const [startHour, startMinute] = availability.start_time.split(':').map(Number)
      const [endHour, endMinute] = availability.end_time.split(':').map(Number)
      const startMinutes = ((Number.isFinite(startHour) ? startHour : 0) * 60) + (Number.isFinite(startMinute) ? startMinute : 0)
      const endMinutes = ((Number.isFinite(endHour) ? endHour : 0) * 60) + (Number.isFinite(endMinute) ? endMinute : 0)
      const durationMinutes = service.duration_minutes

      for (let cursorMinutes = startMinutes; cursorMinutes + durationMinutes <= endMinutes; cursorMinutes += settings.slot_interval_minutes) {
        const hour = Math.floor(cursorMinutes / 60)
        const minute = cursorMinutes % 60
        const timeKey = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        const slotStart = zonedDateTimeToUtc(dateKey, timeKey, timeZone)
        const slotEnd = new Date(slotStart.getTime() + serviceMs)

        if (slotStart <= now) continue

        const overlaps = futureBookings.some((booking) => {
          const blockedStart = new Date(booking.start.getTime() - bufferMs)
          const blockedEnd = new Date(booking.end.getTime() + bufferMs)
          return slotStart < blockedEnd && slotEnd > blockedStart
        })

        if (overlaps) continue

        slots.push({
          iso: slotStart.toISOString(),
          date: dateKey,
          time: timeKey,
          label: formatTimeInTimeZone(slotStart, timeZone),
        })
      }

      if (slots.length) {
        const midday = zonedDateTimeToUtc(dateKey, '12:00', timeZone)
        serviceGroups.push({
          date: dateKey,
          label: `${DAY_LABELS[weekday]} · ${formatDateInTimeZone(midday, timeZone, { weekday: 'short', month: 'short', day: 'numeric' })}`,
          slots,
        })
      }
    }

    results[service.id] = serviceGroups
  }

  return results
}

export function isSlotAvailable(params: {
  serviceId: string
  date: string
  time: string
  services: ServiceSummary[]
  availability: AvailabilityRow[]
  blockedDates: BlockedDateRow[]
  bookings: ExistingBookingRow[]
  settings?: Partial<BookingSettings> | null
  now?: Date
}) {
  const schedule = buildAvailableDatesByService({
    services: params.services,
    availability: params.availability,
    blockedDates: params.blockedDates,
    bookings: params.bookings,
    settings: params.settings,
    now: params.now,
  })

  return (
    schedule[params.serviceId]?.some((group) =>
      group.date === params.date && group.slots.some((slot) => slot.time === params.time)
    ) ?? false
  )
}

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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  )
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

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

  const activeAvailability = new Map(
    params.availability
      .filter((row) => row.is_active)
      .map((row) => [row.day_of_week, row])
  )

  const blockedRanges = params.blockedDates.map((row) => ({
    start: startOfDay(new Date(`${row.start_date}T00:00:00`)),
    end: startOfDay(new Date(`${row.end_date}T00:00:00`)),
  }))

  const futureBookings = params.bookings
    .filter((booking) => booking.status === 'pending' || booking.status === 'approved')
    .map((booking) => {
      const start = new Date(booking.scheduled_at)
      const end = new Date(start.getTime() + booking.duration_minutes * 60 * 1000)
      return { start, end }
    })

  const results: Record<string, AvailableDateGroup[]> = {}
  const startCursor = startOfDay(now)
  const firstBookableDayOffset = settings.allow_same_day_booking ? 0 : 1

  for (const service of params.services) {
    const serviceGroups: AvailableDateGroup[] = []

    for (let offset = firstBookableDayOffset; offset <= settings.advance_window_days; offset += 1) {
      const day = new Date(startCursor)
      day.setDate(startCursor.getDate() + offset)

      const availability = activeAvailability.get(day.getDay())
      if (!availability) continue

      const isBlocked = blockedRanges.some((range) => day >= range.start && day <= range.end)
      if (isBlocked) continue

      const dayStart = combineDateAndTime(day, availability.start_time)
      const dayEnd = combineDateAndTime(day, availability.end_time)
      const slotStep = settings.slot_interval_minutes * 60 * 1000
      const serviceMs = service.duration_minutes * 60 * 1000
      const bufferMs = settings.travel_buffer_minutes * 60 * 1000
      const slots: AvailableSlot[] = []

      for (let cursor = new Date(dayStart); cursor < dayEnd; cursor = new Date(cursor.getTime() + slotStep)) {
        const slotStart = new Date(cursor)
        const slotEnd = new Date(slotStart.getTime() + serviceMs)

        if (slotEnd > dayEnd) break
        if (slotStart <= now) continue

        const overlaps = futureBookings.some((booking) => {
          const blockedStart = new Date(booking.start.getTime() - bufferMs)
          const blockedEnd = new Date(booking.end.getTime() + bufferMs)
          return slotStart < blockedEnd && slotEnd > blockedStart
        })

        if (overlaps) continue

        slots.push({
          iso: slotStart.toISOString(),
          date: formatDateKey(slotStart),
          time: `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`,
          label: formatTimeLabel(slotStart),
        })
      }

      if (slots.length) {
        serviceGroups.push({
          date: formatDateKey(day),
          label: `${DAY_LABELS[day.getDay()]} · ${formatDateLabel(day)}`,
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

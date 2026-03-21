'use server'

import { revalidatePath } from 'next/cache'
import { DEFAULT_TIME_ZONE, zonedDateTimeToUtc } from '@/lib/datetime'
import { isDemoTenantSlug } from '@/lib/demo'
import { attemptInvoiceAutopay } from '@/lib/payments'
import { normalizeServiceKind } from '@/lib/service-eligibility'
import { requireTenantWalker } from '@/lib/tenant-session'

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function parseOptionalCount(input: string) {
  if (!input) return null
  const parsed = Number(input)
  return Number.isFinite(parsed) ? parsed : null
}

async function ensureInvoiceForWalk({
  supabase,
  tenantId,
  clientId,
  walkId,
  serviceName,
  servicePrice,
  scheduledAt,
}: {
  supabase: Awaited<ReturnType<typeof requireTenantWalker>>['supabase']
  tenantId: string
  clientId: string
  walkId: string
  serviceName: string
  servicePrice: number
  scheduledAt: string
}) {
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('walk_id', walkId)
    .maybeSingle()

  if (existingInvoice) {
    return existingInvoice.id
  }

  const dueDate = new Date(scheduledAt)
  dueDate.setDate(dueDate.getDate() + 7)

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      walk_id: walkId,
      amount: servicePrice,
      status: 'sent',
      due_date: dueDate.toISOString().slice(0, 10),
      notes: 'Auto-generated from completed walk.',
    })
    .select('id')
    .single()

  if (invoiceError || !invoice) {
    throw new Error(invoiceError?.message || 'Failed to create invoice.')
  }

  const { error: lineItemError } = await supabase.from('invoice_line_items').insert({
    tenant_id: tenantId,
    invoice_id: invoice.id,
    description: serviceName,
    quantity: 1,
    unit_price: servicePrice,
    total: servicePrice,
  })

  if (lineItemError) {
    throw new Error(lineItemError.message)
  }

  return invoice.id
}

export async function completeWalkAction(tenantSlug: string, formData: FormData) {
  const bookingId = value(formData, 'booking_id')
  const startedAtInput = value(formData, 'started_at')
  const endedAtInput = value(formData, 'ended_at')
  const startedAtDate = value(formData, 'started_at_date')
  const startedAtTime = value(formData, 'started_at_time')
  const endedAtDate = value(formData, 'ended_at_date')
  const endedAtTime = value(formData, 'ended_at_time')
  const mood = value(formData, 'mood') || null
  const behaviorNotes = value(formData, 'behavior_notes') || null
  const healthNotes = value(formData, 'health_notes') || null
  const walkerMessage = value(formData, 'walker_message') || null
  const pottyPeeCount = parseOptionalCount(value(formData, 'potty_pee_count'))
  const pottyPooCount = parseOptionalCount(value(formData, 'potty_poo_count'))
  const pottyPee = checkbox(formData, 'potty_pee') || pottyPeeCount !== null
  const pottyPoo = checkbox(formData, 'potty_poo') || pottyPooCount !== null
  const waterProvided = checkbox(formData, 'water_provided')

  if (!bookingId) return

  if (isDemoTenantSlug(tenantSlug)) return

  const { tenant, user, supabase } = await requireTenantWalker(tenantSlug)

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, client_id, service_id, scheduled_at, status, walker_id')
    .eq('tenant_id', tenant.id)
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking || booking.walker_id !== user.id) {
    return
  }

  if (!['approved', 'completed'].includes(booking.status)) {
    return
  }

  const { data: service } = await supabase
    .from('services')
    .select('name, base_price, service_kind')
    .eq('tenant_id', tenant.id)
    .eq('id', booking.service_id)
    .single()

  if (!service) return

  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('id, stripe_customer_id, stripe_payment_method_id, autopay_enabled')
    .eq('tenant_id', tenant.id)
    .eq('id', booking.client_id)
    .single()

  if (!clientProfile) return

  const bookingTimeZone = tenant.time_zone ?? DEFAULT_TIME_ZONE
  const startedAt = startedAtDate && startedAtTime
    ? zonedDateTimeToUtc(startedAtDate, startedAtTime, bookingTimeZone).toISOString()
    : startedAtInput
      ? new Date(startedAtInput).toISOString()
      : booking.scheduled_at
  const endedAt = endedAtDate && endedAtTime
    ? zonedDateTimeToUtc(endedAtDate, endedAtTime, bookingTimeZone).toISOString()
    : endedAtInput
      ? new Date(endedAtInput).toISOString()
      : new Date().toISOString()

  const { data: existingWalk } = await supabase
    .from('walks')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('booking_id', booking.id)
    .maybeSingle()

  let walkId = existingWalk?.id ?? null

  if (walkId) {
    const { error } = await supabase
      .from('walks')
      .update({
        started_at: startedAt,
        ended_at: endedAt,
        status: 'completed',
      })
      .eq('id', walkId)
      .eq('tenant_id', tenant.id)

    if (error) throw new Error(error.message)
  } else {
    const { data: createdWalk, error } = await supabase
      .from('walks')
      .insert({
        tenant_id: tenant.id,
        booking_id: booking.id,
        started_at: startedAt,
        ended_at: endedAt,
        status: 'completed',
      })
      .select('id')
      .single()

    if (error || !createdWalk) {
      throw new Error(error?.message || 'Failed to create walk record.')
    }

    walkId = createdWalk.id
  }

  const { data: existingReport } = await supabase
    .from('walk_reports')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('walk_id', walkId)
    .maybeSingle()

  const reportPayload = {
    tenant_id: tenant.id,
    walk_id: walkId,
    potty_pee: pottyPee,
    potty_pee_count: pottyPeeCount,
    potty_poo: pottyPoo,
    potty_poo_count: pottyPooCount,
    mood,
    behavior_notes: behaviorNotes,
    health_notes: healthNotes,
    walker_message: walkerMessage,
    water_provided: waterProvided,
    delivered_at: new Date().toISOString(),
  }

  if (existingReport) {
    const { error } = await supabase
      .from('walk_reports')
      .update(reportPayload)
      .eq('id', existingReport.id)
      .eq('tenant_id', tenant.id)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('walk_reports').insert(reportPayload)
    if (error) throw new Error(error.message)
  }

  const { error: bookingUpdateError } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('tenant_id', tenant.id)
    .eq('id', booking.id)

  if (bookingUpdateError) {
    throw new Error(bookingUpdateError.message)
  }

  if (normalizeServiceKind(service.service_kind) === 'meet_and_greet') {
    const { data: bookingPets, error: bookingPetsError } = await supabase
      .from('booking_pets')
      .select('pet_id')
      .eq('tenant_id', tenant.id)
      .eq('booking_id', booking.id)

    if (bookingPetsError) {
      throw new Error(bookingPetsError.message)
    }

    const petIds = (bookingPets ?? []).map((entry) => entry.pet_id).filter(Boolean)
    if (petIds.length) {
      const { error: petUpdateError } = await supabase
        .from('pets')
        .update({ meet_and_greet_completed_at: new Date().toISOString() })
        .eq('tenant_id', tenant.id)
        .in('id', petIds)

      if (petUpdateError) {
        throw new Error(petUpdateError.message)
      }
    }
  }

  const invoiceId = await ensureInvoiceForWalk({
    supabase,
    tenantId: tenant.id,
    clientId: booking.client_id,
    walkId,
    serviceName: service.name,
    servicePrice: Number(service.base_price),
    scheduledAt: booking.scheduled_at,
  })

  await attemptInvoiceAutopay({
    supabase,
    invoiceId,
    amount: Number(service.base_price),
    tenantId: tenant.id,
    clientProfile,
  })

  revalidatePath(`/${tenantSlug}/schedule`)
  revalidatePath(`/${tenantSlug}/dashboard`)
  revalidatePath(`/${tenantSlug}/portal`)
  revalidatePath(`/${tenantSlug}/portal/walks`)
  revalidatePath(`/${tenantSlug}/portal/billing`)
}

export async function generateInvoiceAction(tenantSlug: string, formData: FormData) {
  const bookingId = value(formData, 'booking_id')
  if (!bookingId) return

  if (isDemoTenantSlug(tenantSlug)) return

  const { tenant, user, supabase } = await requireTenantWalker(tenantSlug)

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, client_id, service_id, scheduled_at, status, walker_id')
    .eq('tenant_id', tenant.id)
    .eq('id', bookingId)
    .single()

  if (!booking || booking.walker_id !== user.id || booking.status !== 'completed') {
    return
  }

  const { data: walk } = await supabase
    .from('walks')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('booking_id', booking.id)
    .maybeSingle()

  if (!walk) return

  const { data: service } = await supabase
    .from('services')
    .select('name, base_price')
    .eq('tenant_id', tenant.id)
    .eq('id', booking.service_id)
    .single()

  if (!service) return

  await ensureInvoiceForWalk({
    supabase,
    tenantId: tenant.id,
    clientId: booking.client_id,
    walkId: walk.id,
    serviceName: service.name,
    servicePrice: Number(service.base_price),
    scheduledAt: booking.scheduled_at,
  })

  revalidatePath(`/${tenantSlug}/schedule`)
  revalidatePath(`/${tenantSlug}/portal/billing`)
}

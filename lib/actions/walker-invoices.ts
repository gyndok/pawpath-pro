'use server'

import { revalidatePath } from 'next/cache'
import { requireTenantWalker } from '@/lib/tenant-session'

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

export async function updateInvoiceStatusAction(tenantSlug: string, formData: FormData) {
  const invoiceId = value(formData, 'invoice_id')
  const status = value(formData, 'status')

  if (!invoiceId || !['sent', 'paid', 'overdue', 'voided'].includes(status)) {
    return
  }

  const { tenant, supabase } = await requireTenantWalker(tenantSlug)

  const updates: { status: string; paid_at?: string | null } = { status }
  if (status === 'paid') updates.paid_at = new Date().toISOString()
  if (status !== 'paid') updates.paid_at = null

  await supabase
    .from('invoices')
    .update(updates)
    .eq('tenant_id', tenant.id)
    .eq('id', invoiceId)

  revalidatePath(`/${tenantSlug}/billing`)
  revalidatePath(`/${tenantSlug}/dashboard`)
  revalidatePath(`/${tenantSlug}/portal/billing`)
}

export async function sendInvoiceReminderAction(tenantSlug: string, formData: FormData) {
  const invoiceId = value(formData, 'invoice_id')
  if (!invoiceId) {
    return
  }

  const { tenant, supabase } = await requireTenantWalker(tenantSlug)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status, due_date, notes')
    .eq('tenant_id', tenant.id)
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice || ['paid', 'voided'].includes(invoice.status)) {
    return
  }

  const reminderStamp = `Reminder logged ${new Date().toLocaleString('en-US')}.`
  const dueDatePassed = invoice.due_date ? new Date(invoice.due_date) < new Date() : false

  await supabase
    .from('invoices')
    .update({
      status: dueDatePassed ? 'overdue' : 'sent',
      notes: invoice.notes ? `${invoice.notes}\n${reminderStamp}` : reminderStamp,
    })
    .eq('tenant_id', tenant.id)
    .eq('id', invoiceId)

  revalidatePath(`/${tenantSlug}/billing`)
  revalidatePath(`/${tenantSlug}/dashboard`)
  revalidatePath(`/${tenantSlug}/portal/billing`)
}

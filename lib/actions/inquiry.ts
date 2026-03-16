'use server'

import { createServiceClient } from '@/lib/supabase/server'

export type InquiryState = {
  error?: string
  success?: boolean
}

function normalize(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function submitInquiryAction(
  tenantId: string,
  _prevState: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const name = normalize(formData.get('name'))
  const email = normalize(formData.get('email'))
  const phone = normalize(formData.get('phone'))
  const petInfo = normalize(formData.get('pet_info'))
  const message = normalize(formData.get('message'))

  if (!tenantId) {
    return { error: 'Business context is missing. Please refresh and try again.' }
  }

  if (!name || !email || !message) {
    return { error: 'Name, email, and message are required.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('inquiry_leads').insert({
    tenant_id: tenantId,
    name,
    email,
    phone: phone || null,
    pet_info: petInfo || null,
    message,
  })

  if (error) {
    return { error: 'We could not send your inquiry. Please try again.' }
  }

  return { success: true }
}

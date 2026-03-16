'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

export type ClientRegisterState = {
  error?: string
}

function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

export async function registerClientAction(
  tenantSlug: string,
  _prevState: ClientRegisterState,
  formData: FormData
): Promise<ClientRegisterState> {
  const fullName = value(formData, 'full_name')
  const email = value(formData, 'email').toLowerCase()
  const password = value(formData, 'password')
  const phone = value(formData, 'phone')
  const address = value(formData, 'address')
  const emergencyContactName = value(formData, 'emergency_contact_name')
  const emergencyContactPhone = value(formData, 'emergency_contact_phone')
  const petName = value(formData, 'pet_name')
  const breed = value(formData, 'breed')
  const dob = value(formData, 'dob')
  const weight = value(formData, 'weight_lbs')
  const vetName = value(formData, 'vet_name')
  const vetClinic = value(formData, 'vet_clinic')
  const vetPhone = value(formData, 'vet_phone')
  const microchip = value(formData, 'microchip')
  const medications = value(formData, 'medications')
  const allergies = value(formData, 'allergies')
  const behaviorNotes = value(formData, 'behavior_notes')
  const specialNotes = value(formData, 'special_notes')

  const acceptsWaiver = checkbox(formData, 'accepts_waiver')
  const authorizesEmergencyCare = checkbox(formData, 'authorizes_emergency_care')
  const disclosedBehavior = checkbox(formData, 'disclosed_behavior')

  if (!fullName || !email || !password || !petName) {
    return { error: 'Name, email, password, and pet name are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  if (!acceptsWaiver || !authorizesEmergencyCare || !disclosedBehavior) {
    return { error: 'You must complete the waiver acknowledgements before creating an account.' }
  }

  const supabase = createServiceClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single()

  if (tenantError || !tenant) {
    return { error: 'Business not found.' }
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'client',
      tenant_slug: tenantSlug,
    },
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Failed to create the client account.' }
  }

  const userId = authData.user.id

  try {
    const { data: clientProfile, error: clientProfileError } = await supabase
      .from('client_profiles')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        full_name: fullName,
        phone: phone || null,
        address: address || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
      })
      .select('id')
      .single()

    if (clientProfileError || !clientProfile) {
      throw new Error(clientProfileError?.message || 'Failed to create client profile.')
    }

    const petSpecialNotes = [
      specialNotes,
      authorizesEmergencyCare ? 'Emergency veterinary authorization acknowledged.' : '',
      disclosedBehavior ? 'Behavior and aggression disclosures acknowledged.' : '',
    ].filter(Boolean).join('\n\n')

    const { error: petError } = await supabase.from('pets').insert({
      tenant_id: tenant.id,
      client_id: clientProfile.id,
      name: petName,
      breed: breed || null,
      dob: dob || null,
      weight_lbs: weight ? Number(weight) : null,
      vet_name: vetName || null,
      vet_clinic: vetClinic || null,
      vet_phone: vetPhone || null,
      microchip: microchip || null,
      medications: medications || null,
      allergies: allergies || null,
      behavior_notes: behaviorNotes || null,
      special_notes: petSpecialNotes || null,
    })

    if (petError) {
      throw new Error(petError.message)
    }

    const { data: waiver } = await supabase
      .from('waivers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (waiver) {
      const headerStore = await headers()
      const ipAddress = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || null

      const { error: waiverError } = await supabase.from('waiver_signatures').insert({
        tenant_id: tenant.id,
        waiver_id: waiver.id,
        client_id: clientProfile.id,
        ip_address: ipAddress,
        signature_name: fullName,
      })

      if (waiverError) {
        throw new Error(waiverError.message)
      }
    }
  } catch (error) {
    await supabase.auth.admin.deleteUser(userId)
    return {
      error: error instanceof Error ? error.message : 'Failed to finish onboarding.',
    }
  }

  redirect(`/${tenantSlug}/portal/login?registered=1`)
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Tenant } from '@/types/tenant'

export const DEMO_TENANT_SLUG = 'demo'
export const DEMO_ROLE_COOKIE = 'pawpath-demo-role'

export type DemoRole = 'walker' | 'client'

export const demoTenant: Tenant = {
  id: 'demo-tenant',
  slug: DEMO_TENANT_SLUG,
  business_name: 'Maple & Main Dog Walking',
  owner_user_id: 'demo-walker-user',
  plan_tier: 'pro',
  time_zone: 'America/Chicago',
  stripe_customer_id: 'cus_demo_walker',
  stripe_subscription_id: 'sub_demo_active',
  custom_domain: null,
  branding_primary_color: '#c66a2b',
  logo_url: null,
  created_at: '2026-01-10T15:00:00.000Z',
  trial_ends_at: '2026-12-31T23:59:59.000Z',
  is_active: true,
}

export const demoWalker = {
  id: 'demo-tenant-walker',
  user_id: 'demo-walker-user',
  role: 'owner' as const,
  name: 'Sophie Hart',
  email: 'walker@pawpath.demo',
  photo_url: '/assets/brand/logo-icon-dark.png',
}

export const demoClientProfile = {
  id: 'demo-client-profile',
  user_id: 'demo-client-user',
  full_name: 'Jordan Lee',
  photo_url: null,
  phone: '(713) 555-0131',
  address: '1248 Blossom Street, Houston, TX 77007',
  emergency_contact_name: 'Alex Lee',
  emergency_contact_phone: '(713) 555-0198',
  stripe_customer_id: 'cus_demo_client',
}

export const demoClients = [
  demoClientProfile,
  {
    id: 'demo-client-2',
    user_id: 'demo-client-2-user',
    full_name: 'Maya Chen',
    phone: '(713) 555-0144',
    address: '882 Heights Boulevard, Houston, TX 77008',
    emergency_contact_name: 'Chris Chen',
    emergency_contact_phone: '(713) 555-0188',
    stripe_customer_id: 'cus_demo_client_2',
  },
  {
    id: 'demo-client-3',
    user_id: 'demo-client-3-user',
    full_name: 'Priya Patel',
    phone: '(713) 555-0155',
    address: '5512 Greenbriar Drive, Houston, TX 77005',
    emergency_contact_name: 'Neel Patel',
    emergency_contact_phone: '(713) 555-0166',
    stripe_customer_id: 'cus_demo_client_3',
  },
]

export const demoPets = [
  {
    id: 'demo-pet-1',
    client_id: demoClientProfile.id,
    name: 'Mochi',
    photo_url: '/assets/brand/mascot-dog.png',
    species: 'dog',
    breed: 'Mini Goldendoodle',
    medications: 'Allergy chew after evening meal.',
    allergies: 'Chicken sensitivity, avoid high heat mid-day.',
    behavior_notes: 'Friendly with people, barks at scooters, loves shaded routes.',
    special_notes: 'Use front-clip harness and double-check gate latch.',
    vet_name: 'Dr. Kim',
    vet_phone: '(713) 555-0171',
    microchip: '981020004567891',
    weight_lbs: 28,
  },
  {
    id: 'demo-pet-2',
    client_id: demoClientProfile.id,
    name: 'Theo',
    photo_url: '/assets/brand/mascot-dog.png',
    species: 'dog',
    breed: 'Cavalier King Charles Spaniel',
    medications: 'No medications.',
    allergies: 'None noted.',
    behavior_notes: 'Easy walker, shy around large trucks, enjoys short sniff breaks.',
    special_notes: 'Prefers water after the walk and a short cool-down inside.',
    vet_name: 'Dr. Kim',
    vet_phone: '(713) 555-0171',
    microchip: '981020004567892',
    weight_lbs: 19,
  },
  {
    id: 'demo-pet-3',
    client_id: 'demo-client-2',
    name: 'Poppy',
    photo_url: '/assets/brand/mascot-dog.png',
    species: 'dog',
    breed: 'Australian Shepherd',
    medications: null,
    allergies: 'Mild grass allergy.',
    behavior_notes: 'High energy, needs a brisk pace and enrichment stops.',
    special_notes: 'Avoid dog park if crowded.',
    vet_name: 'Bayou Pet Clinic',
    vet_phone: '(713) 555-0201',
    microchip: '981020004567893',
    weight_lbs: 42,
  },
]

export const demoServices = [
  {
    id: 'demo-service-1',
    name: '30-minute neighborhood walk',
    description: 'Midday potty break, neighborhood walk, water refill, and a quick photo update.',
    duration_minutes: 30,
    base_price: 26,
    is_active: true,
  },
  {
    id: 'demo-service-2',
    name: '60-minute adventure walk',
    description: 'Longer route with extra enrichment, photo updates, and detailed post-walk notes.',
    duration_minutes: 60,
    base_price: 42,
    is_active: true,
  },
  {
    id: 'demo-service-3',
    name: 'Puppy visit',
    description: 'Potty break, feeding, crate reset, and routine reinforcement for younger dogs.',
    duration_minutes: 20,
    base_price: 24,
    is_active: true,
  },
]

export const demoWaiver = {
  id: 'demo-waiver-1',
  title: 'Service Agreement & Liability Waiver',
  body_text:
    'By booking services with Maple & Main Dog Walking, the client confirms accurate pet information, authorizes emergency veterinary care if unreachable, acknowledges the risks inherent to dog walking, and agrees to maintain current vaccination and behavior disclosures. The walker agrees to use reasonable care, documented visit procedures, and professional judgment while the dog is in care.',
  signed_at: '2026-02-12T17:15:00.000Z',
  signature_name: demoClientProfile.full_name,
}

export const demoPaymentMethod = {
  brand: 'Visa',
  last4: '4242',
  exp_month: '08',
  exp_year: '2028',
  autopay: true,
}

export const demoBookingSettings = {
  travel_buffer_minutes: 15,
  slot_interval_minutes: 15,
  advance_window_days: 30,
  allow_same_day_booking: false,
  service_area_zip_codes: ['77007', '77008', '77019'],
}

export const demoAvailability = [
  { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', is_active: true },
  { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', is_active: true },
  { day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_active: true },
  { day_of_week: 4, start_time: '09:00:00', end_time: '16:00:00', is_active: true },
  { day_of_week: 5, start_time: '08:30:00', end_time: '14:00:00', is_active: true },
]

export const demoBlockedDates = [
  {
    id: 'demo-blocked-1',
    start_date: '2026-08-21',
    end_date: '2026-08-23',
    reason: 'Weekend away',
  },
]

export const demoBookings = [
  {
    id: 'demo-booking-1',
    client_id: demoClientProfile.id,
    walker_id: demoWalker.user_id,
    service_id: 'demo-service-1',
    scheduled_at: '2026-08-18T18:00:00.000Z',
    status: 'pending',
    notes: 'Please use the side gate and send an arrival photo.',
  },
  {
    id: 'demo-booking-2',
    client_id: demoClientProfile.id,
    walker_id: demoWalker.user_id,
    service_id: 'demo-service-2',
    scheduled_at: '2026-08-19T14:30:00.000Z',
    status: 'approved',
    notes: 'Adventure loop around the bayou if the heat index stays reasonable.',
  },
  {
    id: 'demo-booking-3',
    client_id: demoClientProfile.id,
    walker_id: demoWalker.user_id,
    service_id: 'demo-service-1',
    scheduled_at: '2026-08-14T17:00:00.000Z',
    status: 'completed',
    notes: 'Theo joined for this shorter midday walk.',
  },
  {
    id: 'demo-booking-4',
    client_id: 'demo-client-2',
    walker_id: demoWalker.user_id,
    service_id: 'demo-service-3',
    scheduled_at: '2026-08-18T16:00:00.000Z',
    status: 'approved',
    notes: 'Puppy feed + crate reset before owner returns from work.',
  },
  {
    id: 'demo-booking-5',
    client_id: 'demo-client-3',
    walker_id: demoWalker.user_id,
    service_id: 'demo-service-1',
    scheduled_at: '2026-08-13T19:00:00.000Z',
    status: 'completed',
    notes: 'House key drop-in and evening stroll.',
  },
]

export const demoBookingPets = [
  { booking_id: 'demo-booking-1', pet_id: 'demo-pet-1' },
  { booking_id: 'demo-booking-2', pet_id: 'demo-pet-1' },
  { booking_id: 'demo-booking-2', pet_id: 'demo-pet-2' },
  { booking_id: 'demo-booking-3', pet_id: 'demo-pet-1' },
  { booking_id: 'demo-booking-3', pet_id: 'demo-pet-2' },
  { booking_id: 'demo-booking-4', pet_id: 'demo-pet-3' },
]

export const demoWalks = [
  {
    id: 'demo-walk-1',
    booking_id: 'demo-booking-3',
    started_at: '2026-08-14T17:05:00.000Z',
    ended_at: '2026-08-14T17:38:00.000Z',
    status: 'completed',
  },
  {
    id: 'demo-walk-2',
    booking_id: 'demo-booking-5',
    started_at: '2026-08-13T19:00:00.000Z',
    ended_at: '2026-08-13T19:32:00.000Z',
    status: 'completed',
  },
]

export const demoWalkReports = [
  {
    walk_id: 'demo-walk-1',
    potty_pee: true,
    potty_pee_count: 2,
    potty_poo: true,
    potty_poo_count: 1,
    walker_message: 'Mochi and Theo had a great walk together. Mochi was energetic early, and Theo settled into a calm pace after the first block.',
    behavior_notes: 'Mochi watched scooters closely but redirected well. Theo stayed loose-leash throughout.',
    health_notes: 'Both drank water right away. No limping, coughing, or heat concerns observed.',
    mood: 'happy',
    delivered_at: '2026-08-14T17:45:00.000Z',
  },
  {
    walk_id: 'demo-walk-2',
    potty_pee: true,
    potty_pee_count: 1,
    potty_poo: false,
    potty_poo_count: 0,
    walker_message: 'Smooth evening walk with a relaxed pace and a full potty break.',
    behavior_notes: 'Stayed focused even with neighborhood foot traffic.',
    health_notes: 'No concerns noted.',
    mood: 'calm',
    delivered_at: '2026-08-13T19:40:00.000Z',
  },
]

export const demoInvoices = [
  {
    id: 'demo-invoice-1',
    client_id: demoClientProfile.id,
    walk_id: 'demo-walk-1',
    amount: 26,
    status: 'paid',
    due_date: '2026-08-21',
    paid_at: '2026-08-15T16:00:00.000Z',
    notes: 'Paid automatically via saved card.',
    created_at: '2026-08-14T17:46:00.000Z',
  },
  {
    id: 'demo-invoice-2',
    client_id: 'demo-client-3',
    walk_id: 'demo-walk-2',
    amount: 26,
    status: 'overdue',
    due_date: '2026-08-16',
    paid_at: null,
    notes: 'Reminder sent August 17 at 9:30 AM.',
    created_at: '2026-08-13T19:42:00.000Z',
  },
  {
    id: 'demo-invoice-3',
    client_id: demoClientProfile.id,
    walk_id: null,
    amount: 42,
    status: 'sent',
    due_date: '2026-08-22',
    paid_at: null,
    notes: 'Upcoming adventure walk invoice queued for payment collection.',
    created_at: '2026-08-18T09:00:00.000Z',
  },
]

export function isDemoTenantSlug(slug: string) {
  return slug === DEMO_TENANT_SLUG
}

export async function getDemoRole(): Promise<DemoRole | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(DEMO_ROLE_COOKIE)?.value
  return value === 'walker' || value === 'client' ? value : null
}

export async function requireDemoRole(expected: DemoRole, tenantSlug: string) {
  const role = await getDemoRole()
  if (role !== expected) {
    redirect(expected === 'walker' ? `/${tenantSlug}/login` : `/${tenantSlug}/portal/login`)
  }
  return role
}

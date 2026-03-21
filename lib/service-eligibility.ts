export const SERVICE_KINDS = ['standard', 'meet_and_greet'] as const

export type ServiceKind = (typeof SERVICE_KINDS)[number]

export type ServiceEligibilityRecord = {
  id: string
  name: string
  service_kind?: string | null
}

export type PetEligibilityRecord = {
  id: string
  name: string
  meet_and_greet_completed_at?: string | null
}

export function normalizeServiceKind(value: string | null | undefined): ServiceKind {
  return value === 'meet_and_greet' ? 'meet_and_greet' : 'standard'
}

export function isPetClearedForStandardServices(pet: PetEligibilityRecord) {
  return Boolean(pet.meet_and_greet_completed_at)
}

export function isServiceAllowedForPet(service: ServiceEligibilityRecord, pet: PetEligibilityRecord) {
  const serviceKind = normalizeServiceKind(service.service_kind)
  return serviceKind === 'meet_and_greet'
    ? !isPetClearedForStandardServices(pet)
    : isPetClearedForStandardServices(pet)
}

export function getPetBookingState(pets: PetEligibilityRecord[]) {
  const unclearedPets = pets.filter((pet) => !isPetClearedForStandardServices(pet))
  const clearedPets = pets.filter((pet) => isPetClearedForStandardServices(pet))

  return {
    hasUnclearedPets: unclearedPets.length > 0,
    hasClearedPets: clearedPets.length > 0,
    isMixedSelection: unclearedPets.length > 0 && clearedPets.length > 0,
    unclearedPets,
    clearedPets,
  }
}

export function filterServicesForPets<T extends ServiceEligibilityRecord>(
  services: T[],
  pets: PetEligibilityRecord[]
) {
  if (!pets.length) return services
  return services.filter((service) => pets.every((pet) => isServiceAllowedForPet(service, pet)))
}

export function getPetEligibilityMessage(pets: PetEligibilityRecord[]) {
  const state = getPetBookingState(pets)

  if (state.isMixedSelection) {
    return 'New pets and cleared pets need to be booked separately. Meet & Greet is only for pets that have not completed it yet.'
  }

  if (state.hasUnclearedPets) {
    return 'New pets must complete a Meet & Greet before regular walk services become available.'
  }

  return null
}

export function getNoEligibleServicesMessage(
  services: ServiceEligibilityRecord[],
  pets: PetEligibilityRecord[]
) {
  const state = getPetBookingState(pets)
  const hasMeetAndGreetService = services.some((service) => normalizeServiceKind(service.service_kind) === 'meet_and_greet')
  const hasStandardService = services.some((service) => normalizeServiceKind(service.service_kind) === 'standard')

  if (state.isMixedSelection) {
    return 'This pet selection can’t be booked together. New pets need their own Meet & Greet booking.'
  }

  if (state.hasUnclearedPets && !hasMeetAndGreetService) {
    return 'This walker has not configured a Meet & Greet service yet. Add one in walker settings before booking a new pet.'
  }

  if (state.hasClearedPets && !hasStandardService) {
    return 'No standard walk services are configured yet for this business.'
  }

  return 'No eligible services are available for this pet selection right now.'
}

export function getServiceKindLabel(serviceKind: string | null | undefined) {
  return normalizeServiceKind(serviceKind) === 'meet_and_greet' ? 'Meet & Greet' : 'Standard service'
}

export interface PinLocation {
  label: string
  latitude: number
  longitude: number
}

let cachedIndex: Promise<unknown> | undefined

export function validatePinCode(pin: string): string | null {
  return /^[1-9]\d{5}$/.test(pin.trim()) ? null : 'Enter a six-digit Indian PIN code.'
}

export async function lookupPinCode(pin: string): Promise<PinLocation> {
  const validation = validatePinCode(pin)
  if (validation) throw new Error(validation)
  if (!cachedIndex) {
    cachedIndex = fetch(`${import.meta.env.BASE_URL}data/india-pins.json`)
      .then(async (response) => {
        if (!response.ok)
          throw new Error('PIN data could not be loaded. Try again or use coordinates.')
        return response.json() as Promise<unknown>
      })
      .catch((error: unknown) => {
        cachedIndex = undefined
        throw error
      })
  }
  return resolvePinLocation(await cachedIndex, pin.trim())
}

export function resolvePinLocation(index: unknown, pin: string): PinLocation {
  if (typeof index !== 'object' || index === null) throw new Error('Invalid PIN dataset.')
  const entry: unknown = (index as Record<string, unknown>)[pin]
  if (!entry) throw new Error('PIN code not found. Enter latitude and longitude instead.')
  if (
    !Array.isArray(entry) ||
    entry.length !== 3 ||
    typeof entry[0] !== 'string' ||
    typeof entry[1] !== 'number' ||
    typeof entry[2] !== 'number' ||
    !Number.isFinite(entry[1]) ||
    !Number.isFinite(entry[2]) ||
    Math.abs(entry[1]) > 90 ||
    Math.abs(entry[2]) > 180
  ) {
    throw new Error('Coordinates unavailable for this PIN code.')
  }
  return { label: entry[0], latitude: entry[1], longitude: entry[2] }
}

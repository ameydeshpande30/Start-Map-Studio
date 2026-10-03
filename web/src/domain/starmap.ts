import { DateTime } from 'luxon'

export type StarmapTheme = 'dark' | 'white'

export interface StarmapSettings {
  date: string
  time: string
  utcOffset: number
  timezoneName: string
  latitude: number
  longitude: number
  theme: StarmapTheme
}

export type SettingsErrors = Partial<Record<keyof StarmapSettings, string>>

export const SAMPLE_LOCATION = {
  latitude: 17.385,
  longitude: 78.4867,
} as const

export function createCurrentSettings(now: DateTime<boolean> = DateTime.local()): StarmapSettings {
  return {
    date: now.toFormat('yyyy-LL-dd'),
    time: now.toFormat('HH:mm'),
    utcOffset: now.offset / 60,
    timezoneName: now.offsetNameShort || formatUtcOffset(now.offset / 60),
    ...SAMPLE_LOCATION,
    theme: 'dark',
  }
}

export function settingsToUtcDate(settings: StarmapSettings): Date {
  return DateTime.fromISO(`${settings.date}T${settings.time}`, { zone: 'UTC' })
    .minus({ minutes: settings.utcOffset * 60 })
    .toJSDate()
}

export function formatUtcOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '-'
  const absoluteMinutes = Math.round(Math.abs(offset) * 60)
  const hours = Math.floor(absoluteMinutes / 60)
  const minutes = absoluteMinutes % 60
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`
}

export function validateSettings(settings: StarmapSettings): SettingsErrors {
  const errors: SettingsErrors = {}
  const localDate = DateTime.fromISO(`${settings.date}T${settings.time}`)

  if (!localDate.isValid) errors.date = 'Enter a valid date and time.'
  if (!Number.isFinite(settings.latitude) || settings.latitude < -90 || settings.latitude > 90) {
    errors.latitude = 'Latitude must be between -90 and 90.'
  }
  if (
    !Number.isFinite(settings.longitude) ||
    settings.longitude < -180 ||
    settings.longitude > 180
  ) {
    errors.longitude = 'Longitude must be between -180 and 180.'
  }
  if (!Number.isFinite(settings.utcOffset) || settings.utcOffset < -14 || settings.utcOffset > 14) {
    errors.utcOffset = 'UTC offset must be between -14 and 14.'
  }
  if (!settings.timezoneName.trim()) errors.timezoneName = 'Enter a timezone label.'

  return errors
}

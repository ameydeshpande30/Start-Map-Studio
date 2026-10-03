import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import {
  createCurrentSettings,
  formatUtcOffset,
  settingsToUtcDate,
  validateSettings,
} from './starmap'

describe('starmap settings', () => {
  it('converts local wall time and half-hour offsets to UTC', () => {
    const settings = createCurrentSettings(DateTime.fromISO('2026-10-04T20:00:00+05:30'))
    expect(settingsToUtcDate(settings).toISOString()).toBe('2026-10-04T14:30:00.000Z')
    expect(formatUtcOffset(5.5)).toBe('UTC+5:30')
  })

  it('validates geographic and UTC offset boundaries', () => {
    const settings = {
      ...createCurrentSettings(DateTime.fromISO('2026-10-04T20:00:00Z')),
      latitude: 91,
      longitude: -181,
      utcOffset: 15,
    }
    expect(validateSettings(settings)).toMatchObject({
      latitude: expect.any(String),
      longitude: expect.any(String),
      utcOffset: expect.any(String),
    })
  })
})

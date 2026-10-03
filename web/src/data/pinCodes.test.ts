import { describe, expect, it } from 'vitest'
import { resolvePinLocation, validatePinCode } from './pinCodes'

describe('optional Indian PIN lookup', () => {
  it('accepts six-digit PIN codes only', () => {
    expect(validatePinCode('500001')).toBeNull()
    for (const pin of ['', '50001', '000001', '5000012', 'abcdef'])
      expect(validatePinCode(pin)).not.toBeNull()
  })

  it('resolves coordinates from a local index', () => {
    expect(
      resolvePinLocation({ '500001': ['Hyderabad, Telangana', 17.3862, 78.462] }, '500001'),
    ).toEqual({ label: 'Hyderabad, Telangana', latitude: 17.3862, longitude: 78.462 })
  })

  it('rejects missing and malformed records', () => {
    expect(() => resolvePinLocation({}, '999999')).toThrow('not found')
    expect(() => resolvePinLocation({ '500001': ['Bad', 100, 78] }, '500001')).toThrow(
      'unavailable',
    )
  })
})

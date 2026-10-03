import { describe, expect, it } from 'vitest'
import { createCurrentSettings } from '../domain/starmap'
import { buildFilename, setJpegDpi, setPngDpi } from './exportImage'

describe('image export', () => {
  it('builds Python-compatible filenames', () => {
    const settings = {
      ...createCurrentSettings(),
      date: '2026-10-04',
      latitude: 17.385,
      longitude: 78.4867,
    }
    expect(buildFilename(settings, 'png')).toBe('starmap_2026-10-04_17.39N_78.49E.png')
  })

  it('writes 300 DPI into an existing JFIF segment', () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 0x60, 0, 0x60, 0, 0,
      0xff, 0xd9,
    ])
    const patched = setJpegDpi(jpeg, 300)
    expect([...patched.slice(13, 18)]).toEqual([1, 1, 44, 1, 44])
  })

  it('inserts a PNG physical-pixel chunk', () => {
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    const ihdr = new Uint8Array([0, 0, 0, 0, 73, 72, 68, 82, 0, 0, 0, 0])
    const patched = setPngDpi(new Uint8Array([...signature, ...ihdr]), 300)
    expect(String.fromCharCode(...patched.slice(24, 28))).toBe('pHYs')
    expect(new DataView(patched.buffer).getUint32(28)).toBe(11811)
  })
})

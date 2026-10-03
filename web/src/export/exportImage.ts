import type { Catalogs } from '../data/catalogs'
import type { StarmapSettings } from '../domain/starmap'
import { EXPORT_WIDTH, renderStarmap } from '../renderer/renderStarmap'

export type ExportFormat = 'png' | 'jpeg'

const DPI = 300

export async function downloadStarmap(
  format: ExportFormat,
  settings: StarmapSettings,
  catalogs: Catalogs,
): Promise<string> {
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
  const canvas = document.createElement('canvas')
  renderStarmap(canvas, settings, catalogs, EXPORT_WIDTH)
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
  const sourceBlob = await canvasToBlob(canvas, mimeType, format === 'jpeg' ? 0.95 : undefined)
  const encoded = new Uint8Array(await sourceBlob.arrayBuffer())
  const patched = format === 'png' ? setPngDpi(encoded, DPI) : setJpegDpi(encoded, DPI)
  const blob = new Blob([patched.buffer as ArrayBuffer], { type: mimeType })
  const filename = buildFilename(settings, format)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  return filename
}

export function buildFilename(settings: StarmapSettings, format: ExportFormat): string {
  const latitude = `${Math.abs(settings.latitude).toFixed(2)}${settings.latitude >= 0 ? 'N' : 'S'}`
  const longitude = `${Math.abs(settings.longitude).toFixed(2)}${settings.longitude >= 0 ? 'E' : 'W'}`
  return `starmap_${settings.date}_${latitude}_${longitude}.${format === 'jpeg' ? 'jpg' : 'png'}`
}

export function setPngDpi(source: Uint8Array, dpi: number): Uint8Array {
  const chunks: Uint8Array[] = [source.slice(0, 8)]
  const pixelsPerMeter = Math.round(dpi / 0.0254)
  const density = new Uint8Array(9)
  const densityView = new DataView(density.buffer)
  densityView.setUint32(0, pixelsPerMeter)
  densityView.setUint32(4, pixelsPerMeter)
  density[8] = 1
  const physicalChunk = makePngChunk('pHYs', density)
  let inserted = false
  let offset = 8

  while (offset + 12 <= source.length) {
    const view = new DataView(source.buffer, source.byteOffset + offset)
    const length = view.getUint32(0)
    const end = offset + 12 + length
    if (end > source.length) throw new Error('The browser returned an invalid PNG file.')
    const type = String.fromCharCode(...source.slice(offset + 4, offset + 8))
    if (type !== 'pHYs') chunks.push(source.slice(offset, end))
    if (type === 'IHDR' && !inserted) {
      chunks.push(physicalChunk)
      inserted = true
    }
    offset = end
  }
  if (!inserted) throw new Error('The browser returned an invalid PNG file.')
  return concatenate(chunks)
}

export function setJpegDpi(source: Uint8Array, dpi: number): Uint8Array {
  if (source[0] !== 0xff || source[1] !== 0xd8)
    throw new Error('The browser returned an invalid JPEG file.')
  const result = source.slice()
  let offset = 2
  while (offset + 4 < result.length && result[offset] === 0xff) {
    const marker = result[offset + 1]
    if (marker === 0xda || marker === 0xd9) break
    const length = (result[offset + 2] << 8) | result[offset + 3]
    if (length < 2 || offset + 2 + length > result.length) break
    const isJfif =
      marker === 0xe0 && String.fromCharCode(...result.slice(offset + 4, offset + 9)) === 'JFIF\0'
    if (isJfif) {
      result[offset + 11] = 1
      result[offset + 12] = (dpi >> 8) & 0xff
      result[offset + 13] = dpi & 0xff
      result[offset + 14] = (dpi >> 8) & 0xff
      result[offset + 15] = dpi & 0xff
      return result
    }
    offset += 2 + length
  }
  const jfif = new Uint8Array([
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0,
    1,
    1,
    1,
    (dpi >> 8) & 0xff,
    dpi & 0xff,
    (dpi >> 8) & 0xff,
    dpi & 0xff,
    0,
    0,
  ])
  return concatenate([result.slice(0, 2), jfif, result.slice(2)])
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, data.length)
  for (let index = 0; index < 4; index += 1) chunk[4 + index] = type.charCodeAt(index)
  chunk.set(data, 8)
  view.setUint32(8 + data.length, crc32(chunk.slice(4, 8 + data.length)))
  return chunk
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function concatenate(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The browser could not encode the image.')),
      type,
      quality,
    )
  })
}

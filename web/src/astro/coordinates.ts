import { Body, Equator, Horizon, Illumination, Observer, Rotation_EQJ_HOR } from 'astronomy-engine'

export interface HorizontalPosition {
  altitude: number
  azimuth: number
}

export interface ProjectedPoint {
  x: number
  y: number
}

export interface VisibleBody extends HorizontalPosition {
  body: Body
  name: string
  color: string
  phaseFraction?: number
}

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

const DISPLAY_BODIES = [
  { body: Body.Sun, name: 'SUN', color: '#ffd36b' },
  { body: Body.Moon, name: 'MOON', color: '#fff4d6' },
  { body: Body.Venus, name: 'VENUS', color: '#fff2c2' },
  { body: Body.Jupiter, name: 'JUPITER', color: '#ffe2b0' },
  { body: Body.Saturn, name: 'SATURN', color: '#f1d79a' },
  { body: Body.Mars, name: 'MARS', color: '#ff9d7a' },
  { body: Body.Mercury, name: 'MERCURY', color: '#dcdcdc' },
] as const

export class SkyTransform {
  readonly #matrix: number[][]

  constructor(date: Date, latitude: number, longitude: number) {
    this.#matrix = Rotation_EQJ_HOR(date, new Observer(latitude, longitude, 0)).rot
  }

  equatorialToHorizontal(rightAscension: number, declination: number): HorizontalPosition {
    const ra = rightAscension * DEG_TO_RAD
    const dec = declination * DEG_TO_RAD
    const cosDec = Math.cos(dec)
    const x = cosDec * Math.cos(ra)
    const y = cosDec * Math.sin(ra)
    const z = Math.sin(dec)
    const horizontalX = this.#matrix[0][0] * x + this.#matrix[1][0] * y + this.#matrix[2][0] * z
    const horizontalY = this.#matrix[0][1] * x + this.#matrix[1][1] * y + this.#matrix[2][1] * z
    const horizontalZ = this.#matrix[0][2] * x + this.#matrix[1][2] * y + this.#matrix[2][2] * z

    return {
      altitude: Math.asin(Math.max(-1, Math.min(1, horizontalZ))) * RAD_TO_DEG,
      azimuth: normalizeDegrees(Math.atan2(-horizontalY, horizontalX) * RAD_TO_DEG),
    }
  }
}

export function calculateBodies(date: Date, latitude: number, longitude: number): VisibleBody[] {
  const observer = new Observer(latitude, longitude, 0)

  return DISPLAY_BODIES.flatMap(({ body, name, color }) => {
    const horizontal = bodyPosition(body, date, observer)
    if (horizontal.altitude <= 0) return []

    return [
      {
        body,
        name,
        color,
        altitude: horizontal.altitude,
        azimuth: horizontal.azimuth,
        phaseFraction:
          body === Body.Moon ? Illumination(Body.Moon, date).phase_fraction : undefined,
      },
    ]
  })
}

export function calculateBodyPosition(
  body: Body,
  date: Date,
  latitude: number,
  longitude: number,
): HorizontalPosition {
  return bodyPosition(body, date, new Observer(latitude, longitude, 0))
}

export function projectAltAz(altitude: number, azimuth: number, clamp = false): ProjectedPoint {
  const visibleAltitude = clamp ? Math.max(altitude, 0) : altitude
  const radius = (90 - visibleAltitude) / 90
  const angle = azimuth * DEG_TO_RAD
  return {
    x: -radius * Math.sin(angle),
    y: radius * Math.cos(angle),
  }
}

function normalizeDegrees(angle: number): number {
  return ((angle % 360) + 360) % 360
}

function bodyPosition(body: Body, date: Date, observer: Observer): HorizontalPosition {
  const equatorial = Equator(body, date, observer, true, true)
  const horizontal = Horizon(date, observer, equatorial.ra, equatorial.dec)
  return { altitude: horizontal.altitude, azimuth: horizontal.azimuth }
}

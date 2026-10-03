export type Coordinate = [number, number]

export interface StarFeature {
  properties: { mag: number; bv?: string | number }
  geometry: { coordinates: Coordinate }
}

export interface ConstellationFeature {
  id: string
  properties: { la: string }
}

export interface ConstellationLineFeature {
  id: string
  geometry: { coordinates: Coordinate[][] }
}

export interface MilkyWayFeature {
  geometry: { coordinates: Coordinate[][][] }
}

export interface Catalogs {
  stars: StarFeature[]
  constellations: ConstellationFeature[]
  constellationLines: ConstellationLineFeature[]
  milkyWay: MilkyWayFeature[]
}

interface FeatureCollection<T> {
  type: 'FeatureCollection'
  features: T[]
}

const CATALOG_FILES = {
  stars: 'stars.8.json',
  constellations: 'constellations.json',
  constellationLines: 'constellations.lines.json',
  milkyWay: 'mw.json',
} as const

export async function loadCatalogs(signal?: AbortSignal): Promise<Catalogs> {
  const entries = await Promise.all(
    Object.entries(CATALOG_FILES).map(async ([key, file]) => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`, { signal })
      if (!response.ok) throw new Error(`Could not load ${file} (${response.status}).`)
      const value: unknown = await response.json()
      return [key, parseFeatureCollection(value, file).features] as const
    }),
  )

  return Object.fromEntries(entries) as unknown as Catalogs
}

function parseFeatureCollection(value: unknown, file: string): FeatureCollection<unknown> {
  if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    throw new Error(`${file} is not a valid feature collection.`)
  }
  if (value.features.length === 0 || !isRecord(value.features[0])) {
    throw new Error(`${file} does not contain valid features.`)
  }
  return value as unknown as FeatureCollection<unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

import { Body } from 'astronomy-engine'
import { DateTime } from 'luxon'
import {
  calculateBodies,
  calculateBodyPosition,
  projectAltAz,
  SkyTransform,
} from '../astro/coordinates'
import type { Catalogs, Coordinate } from '../data/catalogs'
import { settingsToUtcDate, type StarmapSettings } from '../domain/starmap'

export const EXPORT_WIDTH = 2490
export const EXPORT_HEIGHT = 3510

const FIGURE_WIDTH = 8.3
const FIGURE_HEIGHT = 11.7
const PAGE_HALF_WIDTH = 1.27
const PAGE_HEIGHT = (2 * PAGE_HALF_WIDTH * FIGURE_HEIGHT) / FIGURE_WIDTH
const SKY_CENTER_Y = 0.3
const PAGE_MAX_Y = SKY_CENTER_Y + 1.26
const PAGE_MIN_Y = PAGE_MAX_Y - PAGE_HEIGHT
const DESIGN_SCALE = FIGURE_WIDTH / (2 * PAGE_HALF_WIDTH) / (18 / 2.34)
const INCHES_PER_UNIT = FIGURE_WIDTH / (2 * PAGE_HALF_WIDTH)
const CREAM = '#f4ecd6'
const GOLD = '#d8b86a'
const NIGHT = '#070d22'

interface RenderedStar {
  x: number
  y: number
  magnitude: number
  color: string
  radius: number
  alpha: number
}

export interface RenderResult {
  visibleBodies: string[]
  width: number
  height: number
}

export function renderStarmap(
  canvas: HTMLCanvasElement,
  settings: StarmapSettings,
  catalogs: Catalogs,
  width: number,
): RenderResult {
  const scale = width / (2 * PAGE_HALF_WIDTH)
  const height = Math.round(PAGE_HEIGHT * scale)
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D rendering is unavailable.')

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, width, height)
  context.setTransform(scale, 0, 0, -scale, PAGE_HALF_WIDTH * scale, PAGE_MAX_Y * scale)
  context.lineJoin = 'round'
  context.lineCap = 'round'

  const pageBackground = settings.theme === 'white' ? '#ffffff' : NIGHT
  const textColor = settings.theme === 'white' ? '#0b1530' : CREAM
  const accent = settings.theme === 'white' ? '#a07f2e' : GOLD
  const date = settingsToUtcDate(settings)
  const transform = new SkyTransform(date, settings.latitude, settings.longitude)

  drawPage(context, settings.theme, pageBackground)
  drawSkyDisc(context)

  context.save()
  circlePath(context, 0, SKY_CENTER_Y, 1)
  context.clip()
  drawMilkyWay(context, catalogs, transform)
  drawAltitudeGrid(context)
  drawEcliptic(context, transform)
  drawConstellations(context, catalogs, transform)
  drawStars(context, catalogs, transform)
  context.restore()

  drawHorizon(context, accent)
  const visibleBodies = drawBodies(context, date, settings)
  drawPosterText(context, date, settings, textColor, accent)
  drawFrame(context, accent)

  context.setTransform(1, 0, 0, 1, 0, 0)
  return { visibleBodies, width, height }
}

function drawPage(
  context: CanvasRenderingContext2D,
  theme: StarmapSettings['theme'],
  background: string,
) {
  if (theme === 'dark') {
    const gradient = context.createLinearGradient(0, PAGE_MAX_Y, 0, PAGE_MIN_Y)
    gradient.addColorStop(0, '#0a1230')
    gradient.addColorStop(0.52, NIGHT)
    gradient.addColorStop(1, '#050a1a')
    context.fillStyle = gradient
  } else {
    context.fillStyle = background
  }
  context.fillRect(-PAGE_HALF_WIDTH, PAGE_MIN_Y, PAGE_HALF_WIDTH * 2, PAGE_HEIGHT)
}

function drawSkyDisc(context: CanvasRenderingContext2D) {
  const gradient = context.createRadialGradient(0, SKY_CENTER_Y, 0, 0, SKY_CENTER_Y, 1)
  gradient.addColorStop(0, '#0c1633')
  gradient.addColorStop(0.58, '#081126')
  gradient.addColorStop(1, '#030613')
  context.fillStyle = gradient
  circlePath(context, 0, SKY_CENTER_Y, 1)
  context.fill()
}

function drawMilkyWay(
  context: CanvasRenderingContext2D,
  catalogs: Catalogs,
  transform: SkyTransform,
) {
  const alphas = [0.035, 0.045, 0.055, 0.07, 0.09]
  catalogs.milkyWay.forEach((feature, featureIndex) => {
    context.fillStyle = withAlpha('#9fb8e8', alphas[featureIndex] ?? 0.05)
    for (const polygon of feature.geometry.coordinates) {
      for (const ring of polygon) {
        const coordinates = ring.length > 80 ? ring.filter((_, index) => index % 2 === 0) : ring
        const horizontal = coordinates.map(([ra, dec]) => transform.equatorialToHorizontal(ra, dec))
        if (horizontal.filter(({ altitude }) => altitude > 0).length < 3) continue
        context.beginPath()
        horizontal.forEach(({ altitude, azimuth }, index) => {
          const point = toSkyPoint(altitude, azimuth, true)
          if (index === 0) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
        })
        context.closePath()
        context.fill()
      }
    }
  })
}

function drawAltitudeGrid(context: CanvasRenderingContext2D) {
  context.strokeStyle = withAlpha(CREAM, 0.1)
  context.lineWidth = pointsToUnits(0.4)
  context.setLineDash([pointsToUnits(2), pointsToUnits(7)])
  for (const altitude of [30, 60]) {
    circlePath(context, 0, SKY_CENTER_Y, (90 - altitude) / 90)
    context.stroke()
  }
  context.setLineDash([])
}

function drawHorizon(context: CanvasRenderingContext2D, accent: string) {
  for (const [radius, lineWidth, alpha] of [
    [1, 3.2, 1],
    [1.022, 0.9, 0.85],
    [1.04, 0.5, 0.5],
  ] as const) {
    context.strokeStyle = withAlpha(accent, alpha)
    context.lineWidth = pointsToUnits(lineWidth * DESIGN_SCALE * 1.6)
    circlePath(context, 0, SKY_CENTER_Y, radius)
    context.stroke()
  }

  for (let azimuth = 0; azimuth < 360; azimuth += 5) {
    const angle = (azimuth * Math.PI) / 180
    const [outerRadius, lineWidth] =
      azimuth % 90 === 0 ? [1.05, 2.4] : azimuth % 10 === 0 ? [1.022, 1.2] : [1.012, 0.7]
    context.strokeStyle = accent
    context.lineWidth = pointsToUnits(lineWidth * DESIGN_SCALE * 1.6)
    context.beginPath()
    context.moveTo(-Math.sin(angle), SKY_CENTER_Y + Math.cos(angle))
    context.lineTo(-outerRadius * Math.sin(angle), SKY_CENTER_Y + outerRadius * Math.cos(angle))
    context.stroke()
  }

  for (const [label, azimuth] of [
    ['N', 0],
    ['E', 90],
    ['S', 180],
    ['W', 270],
  ] as const) {
    const angle = (azimuth * Math.PI) / 180
    drawText(context, label, -1.105 * Math.sin(angle), SKY_CENTER_Y + 1.105 * Math.cos(angle), {
      color: accent,
      fontSize: sourceFontSize(36 * DESIGN_SCALE),
    })
  }
}

function drawEcliptic(context: CanvasRenderingContext2D, transform: SkyTransform) {
  context.strokeStyle = withAlpha('#e6c27a', 0.3)
  context.lineWidth = pointsToUnits(0.7)
  context.setLineDash([pointsToUnits(6), pointsToUnits(6)])
  let drawing = false
  context.beginPath()
  for (let longitude = 0; longitude <= 360; longitude += 1) {
    const [ra, dec] = eclipticToEquatorial(longitude)
    const horizontal = transform.equatorialToHorizontal(ra, dec)
    if (horizontal.altitude > 0) {
      const point = toSkyPoint(horizontal.altitude, horizontal.azimuth)
      if (drawing) context.lineTo(point.x, point.y)
      else context.moveTo(point.x, point.y)
      drawing = true
    } else if (drawing) {
      context.stroke()
      context.beginPath()
      drawing = false
    }
  }
  if (drawing) context.stroke()
  context.setLineDash([])
}

function drawConstellations(
  context: CanvasRenderingContext2D,
  catalogs: Catalogs,
  transform: SkyTransform,
) {
  const names = new Map(
    catalogs.constellations.map((feature) => [feature.id, feature.properties.la]),
  )
  const labelPoints = new Map<string, { x: number; y: number }[]>()
  context.strokeStyle = withAlpha('#8fb0e6', 0.7)
  context.lineWidth = pointsToUnits(0.75)

  for (const feature of catalogs.constellationLines) {
    for (const segment of feature.geometry.coordinates) {
      const horizontal = segment.map(([ra, dec]) => transform.equatorialToHorizontal(ra, dec))
      for (const point of horizontal) {
        if (point.altitude > 8) {
          const projected = projectAltAz(point.altitude, point.azimuth)
          const points = labelPoints.get(feature.id) ?? []
          points.push(projected)
          labelPoints.set(feature.id, points)
        }
      }
      for (let index = 0; index < horizontal.length - 1; index += 1) {
        const first = horizontal[index]
        const second = horizontal[index + 1]
        if (first.altitude <= 0 || second.altitude <= 0) continue
        const start = toSkyPoint(first.altitude, first.azimuth)
        const end = toSkyPoint(second.altitude, second.azimuth)
        context.beginPath()
        context.moveTo(start.x, start.y)
        context.lineTo(end.x, end.y)
        context.stroke()
      }
    }
  }

  for (const [id, points] of labelPoints) {
    const name = names.get(id)
    if (!name || points.length < 5) continue
    const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), {
      x: 0,
      y: 0,
    })
    center.x /= points.length
    center.y /= points.length
    if (Math.hypot(center.x, center.y) > 0.86) continue
    drawText(context, name.toUpperCase(), center.x, center.y + SKY_CENTER_Y - 0.04, {
      color: withAlpha(GOLD, 0.85),
      fontSize: sourceFontSize(13 * DESIGN_SCALE * 1.2),
    })
  }
}

function drawStars(context: CanvasRenderingContext2D, catalogs: Catalogs, transform: SkyTransform) {
  const stars: RenderedStar[] = []
  for (const feature of catalogs.stars) {
    const [ra, dec] = feature.geometry.coordinates
    const horizontal = transform.equatorialToHorizontal(ra, dec)
    if (horizontal.altitude <= 0) continue
    const projected = toSkyPoint(horizontal.altitude, horizontal.azimuth)
    const magnitude = Number(feature.properties.mag)
    const bv = Number(feature.properties.bv ?? 0.5)
    const size = Math.max(7.6 - magnitude, 0.2) ** 2.7 * DESIGN_SCALE ** 2 * 1.5
    stars.push({
      ...projected,
      magnitude,
      color: starColor(bv),
      radius: pointsToUnits(Math.sqrt(size / Math.PI)),
      alpha: Math.max(0.12, Math.min(1, (7.6 - magnitude) / 4.5)) ** 1.5,
    })
  }

  for (const multiplier of [Math.sqrt(4.5), Math.sqrt(1.9)]) {
    context.globalAlpha = multiplier > 2 ? 0.07 : 0.14
    for (const star of stars) {
      if (star.magnitude >= 5) continue
      context.fillStyle = star.color
      circlePath(context, star.x, star.y, star.radius * multiplier)
      context.fill()
    }
  }

  for (const star of stars) {
    context.globalAlpha = star.alpha
    context.fillStyle = star.color
    circlePath(context, star.x, star.y, star.radius)
    context.fill()
  }
  context.globalAlpha = 1

  for (const star of stars) {
    if (star.magnitude >= 1.6) continue
    const length = 0.012 * (2.2 - star.magnitude) + 0.012
    context.strokeStyle = withAlpha(star.color, 0.7)
    context.lineWidth = pointsToUnits(0.5)
    context.beginPath()
    context.moveTo(star.x - length, star.y)
    context.lineTo(star.x + length, star.y)
    context.moveTo(star.x, star.y - length)
    context.lineTo(star.x, star.y + length)
    context.stroke()
  }
}

function drawBodies(
  context: CanvasRenderingContext2D,
  date: Date,
  settings: StarmapSettings,
): string[] {
  const bodies = calculateBodies(date, settings.latitude, settings.longitude)
  const sun = calculateBodyPosition(Body.Sun, date, settings.latitude, settings.longitude)
  const sunPoint = toSkyPoint(sun.altitude, sun.azimuth, true)
  const placed: { x: number; y: number }[] = []

  for (const body of bodies) {
    const point = toSkyPoint(body.altitude, body.azimuth)
    if (body.body === Body.Sun) drawSun(context, point.x, point.y, body.color)
    else if (body.body === Body.Moon)
      drawMoon(context, point.x, point.y, sunPoint, body.color, body.phaseFraction ?? 0)
    else drawPlanet(context, point.x, point.y, body.color)
    placeBodyLabel(
      context,
      point.x,
      point.y,
      body.name,
      body.color,
      placed,
      body.body === Body.Sun ? 0.11 : body.body === Body.Moon ? 0.05 : 0.035,
    )
  }

  return bodies.map(({ name }) => name)
}

function drawSun(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const radius = 0.04
  for (const [multiplier, alpha] of [
    [5.5, 0.05],
    [3.6, 0.08],
    [2.2, 0.14],
  ] as const) {
    context.fillStyle = withAlpha(color, alpha)
    circlePath(context, x, y, radius * multiplier)
    context.fill()
  }
  context.strokeStyle = withAlpha(color, 0.9)
  context.lineWidth = pointsToUnits(0.9)
  for (let index = 0; index < 24; index += 1) {
    const angle = (index * 15 * Math.PI) / 180
    const start = radius * 1.25
    const end = radius * (index % 2 === 0 ? 2.5 : 1.9)
    context.beginPath()
    context.moveTo(x + start * Math.cos(angle), y + start * Math.sin(angle))
    context.lineTo(x + end * Math.cos(angle), y + end * Math.sin(angle))
    context.stroke()
  }
  context.fillStyle = '#fff1b8'
  context.strokeStyle = GOLD
  context.lineWidth = pointsToUnits(1)
  circlePath(context, x, y, radius)
  context.fill()
  context.stroke()
}

function drawMoon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  sun: { x: number; y: number },
  color: string,
  phaseFraction: number,
) {
  const radius = 0.034
  context.fillStyle = withAlpha(color, 0.07)
  circlePath(context, x, y, radius * 3.2)
  context.fill()
  context.fillStyle = '#2a3552'
  circlePath(context, x, y, radius)
  context.fill()

  const angle = Math.atan2(sun.y - y, sun.x - x)
  const terminator = 1 - 2 * phaseFraction
  const points: { x: number; y: number }[] = []
  for (let index = 0; index <= 90; index += 1) {
    const theta = (Math.PI * index) / 90
    points.push({ x: radius * Math.sin(theta), y: radius * Math.cos(theta) })
  }
  for (let index = 90; index >= 0; index -= 1) {
    const theta = (Math.PI * index) / 90
    points.push({ x: -terminator * radius * Math.sin(theta), y: radius * Math.cos(theta) })
  }
  context.beginPath()
  points.forEach((point, index) => {
    const rotatedX = point.x * Math.cos(angle) - point.y * Math.sin(angle) + x
    const rotatedY = point.x * Math.sin(angle) + point.y * Math.cos(angle) + y
    if (index === 0) context.moveTo(rotatedX, rotatedY)
    else context.lineTo(rotatedX, rotatedY)
  })
  context.closePath()
  context.fillStyle = color
  context.fill()
  context.strokeStyle = GOLD
  context.lineWidth = pointsToUnits(0.8)
  circlePath(context, x, y, radius)
  context.stroke()
}

function drawPlanet(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
  context.fillStyle = withAlpha(color, 0.1)
  circlePath(context, x, y, pointsToUnits(Math.sqrt((1200 * DESIGN_SCALE ** 2) / Math.PI)))
  context.fill()
  context.fillStyle = color
  context.strokeStyle = GOLD
  context.lineWidth = pointsToUnits(1)
  circlePath(context, x, y, pointsToUnits(Math.sqrt((300 * DESIGN_SCALE ** 2 * 1.4) / Math.PI)))
  context.fill()
  context.stroke()
}

function placeBodyLabel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  placed: { x: number; y: number }[],
  offset: number,
) {
  const candidates = [
    [offset, -0.05, 'left'],
    [offset, 0.03, 'left'],
    [-offset, -0.05, 'right'],
    [-offset, 0.03, 'right'],
    [offset, -0.1, 'left'],
    [offset, 0.08, 'left'],
    [-offset, -0.1, 'right'],
    [-offset, 0.08, 'right'],
  ] as const
  const candidate =
    candidates.find(([dx, dy]) =>
      placed.every(
        (point) => Math.abs(y + dy - point.y) > 0.042 || Math.abs(x + dx - point.x) > 0.2,
      ),
    ) ?? candidates[0]
  const [dx, dy, align] = candidate
  placed.push({ x: x + dx, y: y + dy })
  drawText(context, text, x + dx, y + dy, {
    color,
    fontSize: sourceFontSize(15 * DESIGN_SCALE * 1.2),
    fontWeight: 'bold',
    align,
  })
}

function drawPosterText(
  context: CanvasRenderingContext2D,
  utcDate: Date,
  settings: StarmapSettings,
  textColor: string,
  accent: string,
) {
  const local = DateTime.fromISO(`${settings.date}T${settings.time}`).setLocale('en')
  const dateLabel = local.toFormat('d LLLL yyyy').toUpperCase()
  const timeLabel = `${local.toFormat('h:mm a')} ${settings.timezoneName}`
  const latitude = `${Math.abs(settings.latitude).toFixed(2)}° ${settings.latitude >= 0 ? 'N' : 'S'}`
  const longitude = `${Math.abs(settings.longitude).toFixed(2)}° ${settings.longitude >= 0 ? 'E' : 'W'}`
  const sun = calculateBodyPosition(Body.Sun, utcDate, settings.latitude, settings.longitude)
  const titleY = SKY_CENTER_Y - 1.33
  const spacing = 1.3

  drawText(context, sun.altitude > 0 ? 'THE SKY' : 'THE NIGHT SKY', 0, titleY, {
    color: accent,
    fontSize: sourceFontSize(26 * DESIGN_SCALE),
  })
  drawText(context, dateLabel, 0, titleY - 0.15 * spacing, {
    color: textColor,
    fontSize: sourceFontSize(70 * DESIGN_SCALE),
    fontWeight: 'bold',
  })
  const dividerY = titleY - 0.25 * spacing
  context.strokeStyle = accent
  context.lineWidth = pointsToUnits(0.9)
  context.beginPath()
  context.moveTo(-0.5, dividerY)
  context.lineTo(-0.06, dividerY)
  context.moveTo(0.06, dividerY)
  context.lineTo(0.5, dividerY)
  context.stroke()
  drawText(context, '✦', 0, dividerY, {
    color: accent,
    fontFamily: 'DejaVu Sans',
    fontSize: sourceFontSize(20 * DESIGN_SCALE),
  })
  drawText(context, timeLabel, 0, titleY - 0.335 * spacing, {
    color: textColor,
    fontSize: sourceFontSize(34 * DESIGN_SCALE),
  })
  drawText(context, `${latitude}     ${longitude}`, 0, titleY - 0.425 * spacing, {
    color: accent,
    fontSize: sourceFontSize(32 * DESIGN_SCALE),
  })
}

function drawFrame(context: CanvasRenderingContext2D, accent: string) {
  for (const [inset, lineWidth, alpha] of [
    [0.04, 1.6, 1],
    [0.058, 0.6, 0.7],
  ] as const) {
    context.strokeStyle = withAlpha(accent, alpha)
    context.lineWidth = pointsToUnits(lineWidth)
    context.strokeRect(
      -(PAGE_HALF_WIDTH - inset),
      PAGE_MIN_Y + inset,
      2 * (PAGE_HALF_WIDTH - inset),
      PAGE_HEIGHT - 2 * inset,
    )
  }
}

interface TextOptions {
  color: string
  fontSize: number
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
  fontWeight?: 'normal' | 'bold'
  align?: CanvasTextAlign
  maxWidth?: number
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: TextOptions,
) {
  context.save()
  context.translate(x, y)
  context.scale(1, -1)
  context.fillStyle = options.color
  context.textAlign = options.align ?? 'center'
  context.textBaseline = 'middle'
  context.font = `${options.fontStyle ?? 'normal'} ${options.fontWeight ?? 'normal'} ${options.fontSize}px "${options.fontFamily ?? 'DejaVu Serif'}"`
  if (options.maxWidth) context.fillText(text, 0, 0, options.maxWidth)
  else context.fillText(text, 0, 0)
  context.restore()
}

function toSkyPoint(altitude: number, azimuth: number, clamp = false) {
  const point = projectAltAz(altitude, azimuth, clamp)
  return { x: point.x, y: point.y + SKY_CENTER_Y }
}

function circlePath(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
}

function eclipticToEquatorial(longitude: number): Coordinate {
  const lambda = (longitude * Math.PI) / 180
  const obliquity = (23.4392911 * Math.PI) / 180
  const ra = (Math.atan2(Math.sin(lambda) * Math.cos(obliquity), Math.cos(lambda)) * 180) / Math.PI
  const dec = (Math.asin(Math.sin(obliquity) * Math.sin(lambda)) * 180) / Math.PI
  return [((ra % 360) + 360) % 360, dec]
}

function starColor(bv: number): string {
  if (bv < 0) return '#b4cdff'
  if (bv < 0.4) return '#e8efff'
  if (bv < 0.8) return '#fff6df'
  if (bv < 1.2) return '#ffe6bf'
  return '#ffcf9a'
}

function sourceFontSize(points: number): number {
  return pointsToUnits(points)
}

function pointsToUnits(points: number): number {
  return points / 72 / INCHES_PER_UNIT
}

function withAlpha(color: string, alpha: number): string {
  const value = color.startsWith('#') ? color.slice(1) : color
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

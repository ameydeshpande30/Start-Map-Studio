import { describe, expect, it } from 'vitest'
import { calculateBodies, projectAltAz } from './coordinates'

describe('sky coordinates', () => {
  it('projects north up and east left', () => {
    expect(projectAltAz(45, 0)).toEqual({ x: -0, y: 0.5 })
    expect(projectAltAz(45, 90).x).toBeCloseTo(-0.5, 10)
    expect(projectAltAz(45, 90).y).toBeCloseTo(0, 10)
  })

  it('matches the Python fixture body visibility', () => {
    const bodies = calculateBodies(new Date('2026-10-04T14:30:00.000Z'), 17.385, 78.4867)
    expect(bodies.map(({ name }) => name)).toEqual(['SATURN'])
  })
})

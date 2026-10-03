import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const archive = process.argv[2]
if (!archive) throw new Error('Usage: node scripts/build-pin-index.mjs /path/to/IN.zip')
const text = execFileSync('unzip', ['-p', archive, 'IN.txt'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
})
const records = new Map()
for (const line of text.split('\n')) {
  const fields = line.split('\t')
  const pin = fields[1]
  const latitude = Number(fields[9])
  const longitude = Number(fields[10])
  const accuracy = Number(fields[11]) || 0
  if (
    !/^[1-9]\d{5}$/.test(pin ?? '') ||
    !fields[9] ||
    !fields[10] ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  )
    continue
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue
  if ((records.get(pin)?.accuracy ?? -1) >= accuracy) continue
  const label = [fields[5] || fields[2], fields[3]].filter(Boolean).join(', ')
  records.set(pin, { accuracy, entry: [label, latitude, longitude] })
}
const index = Object.fromEntries(
  [...records]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([pin, record]) => [pin, record.entry]),
)
writeFileSync(new URL('../public/data/india-pins.json', import.meta.url), JSON.stringify(index))
console.log(`Bundled ${records.size} Indian PIN codes.`)

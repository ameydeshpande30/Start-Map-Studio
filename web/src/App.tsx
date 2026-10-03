import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react'
import {
  Clock3,
  Download,
  Eye,
  CodeXml,
  ImageDown,
  Info,
  LocateFixed,
  MapPin,
  MoonStar,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Sun,
} from 'lucide-react'
import type { Catalogs } from './data/catalogs'
import { loadCatalogs } from './data/catalogs'
import {
  createCurrentSettings,
  formatUtcOffset,
  validateSettings,
  type StarmapSettings,
} from './domain/starmap'
import { downloadStarmap, type ExportFormat } from './export/exportImage'
import { renderStarmap } from './renderer/renderStarmap'
import { PinCodeLookup } from './components/PinCodeLookup'
import type { PinLocation } from './data/pinCodes'
type LocationState = 'requesting' | 'granted' | 'denied' | 'unavailable' | 'pin' | 'manual'
type RenderState = 'loading' | 'updating' | 'ready' | 'error'
const configuredSourceUrl =
  import.meta.env.VITE_GITHUB_SOURCE_URL ?? 'https://github.com/ameydeshpande30/Start-Map-Studio'
const sourceUrl = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(configuredSourceUrl)
  ? configuredSourceUrl
  : undefined

function App() {
  const [mobileView, setMobileView] = useState<'controls' | 'preview'>('controls')
  const [draft, setDraft] = useState<StarmapSettings>(createCurrentSettings)
  const [renderSettings, setRenderSettings] = useState<StarmapSettings>(draft)
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [locationState, setLocationState] = useState<LocationState>('requesting')
  const [pinLocationLabel, setPinLocationLabel] = useState('')
  const locationSource = useRef<'browser' | 'pin' | 'manual'>('browser')
  const [renderState, setRenderState] = useState<RenderState>('loading')
  const [renderDetail, setRenderDetail] = useState('Loading sky catalog')
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [notice, setNotice] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deferredSettings = useDeferredValue(renderSettings)
  const errors = validateSettings(draft)
  const hasErrors = Object.keys(errors).length > 0

  useEffect(() => {
    const controller = new AbortController()
    const fontReady = Promise.all([
      document.fonts.load('normal 16px "DejaVu Serif"'),
      document.fonts.load('bold 16px "DejaVu Serif"'),
      document.fonts.load('italic 16px "DejaVu Serif"'),
      document.fonts.load('normal 16px "DejaVu Sans"'),
      document.fonts.ready,
    ])

    Promise.all([loadCatalogs(controller.signal), fontReady])
      .then(([loadedCatalogs]) => setCatalogs(loadedCatalogs))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setCatalogError(error instanceof Error ? error.message : 'Could not load the sky catalog.')
        setRenderState('error')
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    requestBrowserLocation(
      (latitude, longitude) => {
        if (locationSource.current !== 'browser') return
        setDraft((current) => ({ ...current, latitude, longitude }))
        setLocationState('granted')
      },
      (state) => {
        if (locationSource.current === 'browser') setLocationState(state)
      },
    )
  }, [])

  useEffect(() => {
    if (hasErrors) return
    const timer = window.setTimeout(() => {
      startTransition(() => setRenderSettings(draft))
    }, 180)
    return () => window.clearTimeout(timer)
  }, [draft, hasErrors])

  useEffect(() => {
    if (!catalogs || !canvasRef.current) return
    let cancelled = false
    setRenderState('updating')
    setRenderDetail('Updating preview')
    const frame = window.requestAnimationFrame(() => {
      const started = performance.now()
      try {
        const result = renderStarmap(canvasRef.current!, deferredSettings, catalogs, 900)
        if (cancelled) return
        const elapsed = Math.round(performance.now() - started)
        const bodyText = result.visibleBodies.length
          ? `${result.visibleBodies.map(titleCase).join(', ')} above horizon`
          : 'No solar-system bodies above horizon'
        setRenderDetail(`${bodyText} · ${elapsed} ms`)
        setRenderState('ready')
      } catch (error) {
        if (cancelled) return
        setRenderDetail(error instanceof Error ? error.message : 'Preview failed to render.')
        setRenderState('error')
      }
    })
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [catalogs, deferredSettings])

  const updateDraft = <Key extends keyof StarmapSettings>(
    key: Key,
    value: StarmapSettings[Key],
  ) => {
    if (key === 'latitude' || key === 'longitude') {
      locationSource.current = 'manual'
      setLocationState('manual')
    }
    setDraft((current) => ({ ...current, [key]: value }))
    setNotice('')
  }

  const useCurrentTime = () => {
    const current = createCurrentSettings()
    setDraft((existing) => ({
      ...existing,
      date: current.date,
      time: current.time,
      utcOffset: current.utcOffset,
      timezoneName: current.timezoneName,
    }))
  }

  const retryLocation = () => {
    locationSource.current = 'browser'
    setLocationState('requesting')
    requestBrowserLocation(
      (latitude, longitude) => {
        if (locationSource.current !== 'browser') return
        setDraft((current) => ({ ...current, latitude, longitude }))
        setLocationState('granted')
      },
      (state) => {
        if (locationSource.current === 'browser') setLocationState(state)
      },
    )
  }

  const usePinLocation = (location: PinLocation) => {
    locationSource.current = 'pin'
    setPinLocationLabel(location.label)
    setLocationState('pin')
    setDraft((current) => ({
      ...current,
      latitude: location.latitude,
      longitude: location.longitude,
      utcOffset: 5.5,
      timezoneName: 'IST',
    }))
    setNotice('')
  }

  const exportImage = async (format: ExportFormat) => {
    if (!catalogs || hasErrors) return
    setExporting(format)
    setNotice('Preparing full-resolution image')
    try {
      const filename = await downloadStarmap(format, draft, catalogs)
      setNotice(`${filename} downloaded`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setExporting(null)
    }
  }

  const locationLabel = {
    requesting: 'Requesting browser location',
    granted: 'Using your current coordinates',
    denied: 'Location denied · using editable sample',
    unavailable: 'Location unavailable · using editable sample',
    pin: `${pinLocationLabel} · approximate PIN location`,
    manual: 'Using manual coordinates',
  }[locationState]

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <div>
            <h1>Star Map Studio</h1>
            <p>A4 celestial poster</p>
          </div>
        </div>

        <div className="app-actions">
          <a
            className="icon-button source-link"
            href={`${import.meta.env.BASE_URL}credits.html`}
            target="_blank"
            rel="noreferrer"
            title="Credits and licenses"
            aria-label="Credits and licenses"
          >
            <Info size={18} />
          </a>
          {sourceUrl ? (
            <a
              className="icon-button source-link"
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              title="View source on GitHub"
              aria-label="View source on GitHub"
            >
              <CodeXml size={18} />
            </a>
          ) : (
            <button
              className="icon-button source-link"
              type="button"
              disabled
              title="GitHub source URL not configured"
              aria-label="GitHub source URL not configured"
            >
              <CodeXml size={18} />
            </button>
          )}
          <button className="button button-quiet" type="button" onClick={useCurrentTime}>
            <Clock3 size={16} /> Now
          </button>
          <button
            className="button button-secondary"
            type="button"
            disabled={!catalogs || hasErrors || exporting !== null}
            onClick={() => exportImage('jpeg')}
          >
            <ImageDown size={16} /> {exporting === 'jpeg' ? 'Rendering' : 'JPEG'}
          </button>
          <button
            className="button button-primary"
            type="button"
            disabled={!catalogs || hasErrors || exporting !== null}
            onClick={() => exportImage('png')}
          >
            <Download size={16} /> {exporting === 'png' ? 'Rendering' : 'PNG'}
          </button>
        </div>
      </header>

      <div className="mobile-tabs" role="tablist" aria-label="Star map views">
        {(['controls', 'preview'] as const).map((view) => (
          <button
            key={view}
            id={`tab-${view}`}
            type="button"
            role="tab"
            aria-selected={mobileView === view}
            aria-controls={`panel-${view}`}
            tabIndex={mobileView === view ? 0 : -1}
            onClick={() => setMobileView(view)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const nextView =
                event.key === 'Home'
                  ? 'controls'
                  : event.key === 'End'
                    ? 'preview'
                    : view === 'controls'
                      ? 'preview'
                      : 'controls'
              setMobileView(nextView)
              document.getElementById(`tab-${nextView}`)?.focus()
            }}
          >
            {view === 'controls' ? (
              <SlidersHorizontal size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
            {view === 'controls' ? 'Controls' : 'Preview'}
          </button>
        ))}
      </div>

      <main className="workspace" data-mobile-view={mobileView}>
        <section
          id="panel-preview"
          className="preview-panel"
          role="tabpanel"
          aria-label="Star map preview"
          tabIndex={0}
        >
          <div className="preview-toolbar">
            <div
              className={`render-status render-status-${renderState}`}
              role="status"
              aria-live="polite"
            >
              <span className="status-dot" aria-hidden="true" />
              <span>{catalogError || renderDetail}</span>
            </div>
            <span className="preview-size">A4 · 300 DPI export</span>
          </div>

          <div className="poster-stage">
            <div
              className="poster-wrap"
              aria-busy={renderState === 'loading' || renderState === 'updating'}
            >
              <canvas
                ref={canvasRef}
                data-testid="starmap-canvas"
                aria-label="Generated star map poster"
              />
              {!catalogs && !catalogError && (
                <div className="canvas-state">
                  <RefreshCw size={22} className="spin" /> Loading catalog
                </div>
              )}
              {catalogError && <div className="canvas-state canvas-error">{catalogError}</div>}
            </div>
          </div>

          <div className="preview-footer">
            <span>{draft.date}</span>
            <span>
              {Math.abs(draft.latitude).toFixed(2)}° {draft.latitude >= 0 ? 'N' : 'S'} ·{' '}
              {Math.abs(draft.longitude).toFixed(2)}° {draft.longitude >= 0 ? 'E' : 'W'}
            </span>
            <span className="notice" role="status" aria-live="polite">
              {notice || 'Generated locally in your browser'}
            </span>
          </div>
        </section>

        <aside
          id="panel-controls"
          className="controls"
          role="tabpanel"
          aria-label="Poster controls"
          tabIndex={0}
        >
          <section className="control-section">
            <div className="section-heading">
              <div>
                <span>01</span>
                <h2>When</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                title="Use current time"
                aria-label="Use current time"
                onClick={useCurrentTime}
              >
                <Clock3 size={17} />
              </button>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => updateDraft('date', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Local time</span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => updateDraft('time', event.target.value)}
                />
              </label>
            </div>
            {errors.date && <p className="field-error">{errors.date}</p>}
            <div className="field-grid offset-grid">
              <label className="field">
                <span>UTC offset</span>
                <input
                  type="number"
                  min="-14"
                  max="14"
                  step="0.25"
                  value={finiteValue(draft.utcOffset)}
                  onChange={(event) => updateDraft('utcOffset', event.target.valueAsNumber)}
                />
              </label>
              <label className="field">
                <span>Timezone label</span>
                <input
                  type="text"
                  maxLength={12}
                  value={draft.timezoneName}
                  onChange={(event) => updateDraft('timezoneName', event.target.value)}
                />
              </label>
            </div>
            {(errors.utcOffset || errors.timezoneName) && (
              <p className="field-error">{errors.utcOffset || errors.timezoneName}</p>
            )}
            <p className="field-meta">
              {Number.isFinite(draft.utcOffset)
                ? formatUtcOffset(draft.utcOffset)
                : 'Invalid offset'}
            </p>
          </section>

          <section className="control-section">
            <div className="section-heading">
              <div>
                <span>02</span>
                <h2>Where</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                title="Retry current location"
                aria-label="Retry current location"
                onClick={retryLocation}
              >
                <LocateFixed size={17} />
              </button>
            </div>
            <div className={`location-status location-${locationState}`}>
              <MapPin size={15} aria-hidden="true" />
              <span>{locationLabel}</span>
            </div>
            <PinCodeLookup onSelect={usePinLocation} />
            <div className="field-grid">
              <label className="field">
                <span>Latitude</span>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  step="0.0001"
                  value={finiteValue(draft.latitude)}
                  onChange={(event) => updateDraft('latitude', event.target.valueAsNumber)}
                />
              </label>
              <label className="field">
                <span>Longitude</span>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="0.0001"
                  value={finiteValue(draft.longitude)}
                  onChange={(event) => updateDraft('longitude', event.target.valueAsNumber)}
                />
              </label>
            </div>
            {(errors.latitude || errors.longitude) && (
              <p className="field-error">{errors.latitude || errors.longitude}</p>
            )}
          </section>

          <section className="control-section appearance-section">
            <div className="section-heading">
              <div>
                <span>03</span>
                <h2>Appearance</h2>
              </div>
            </div>
            <div className="segmented" aria-label="Poster theme">
              <button
                type="button"
                aria-pressed={draft.theme === 'dark'}
                onClick={() => updateDraft('theme', 'dark')}
              >
                <MoonStar size={16} /> Night
              </button>
              <button
                type="button"
                aria-pressed={draft.theme === 'white'}
                onClick={() => updateDraft('theme', 'white')}
              >
                <Sun size={16} /> White
              </button>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

function requestBrowserLocation(
  onSuccess: (latitude: number, longitude: number) => void,
  onFailure: (state: Extract<LocationState, 'denied' | 'unavailable'>) => void,
) {
  if (!navigator.geolocation) {
    onFailure('unavailable')
    return
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => onSuccess(coords.latitude, coords.longitude),
    (error) => onFailure(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'),
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
  )
}

function finiteValue(value: number): number | '' {
  return Number.isFinite(value) ? value : ''
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

export default App

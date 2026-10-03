import { useRef, useState } from 'react'
import { LoaderCircle, Search } from 'lucide-react'
import { lookupPinCode, type PinLocation } from '../data/pinCodes'

interface PinCodeLookupProps {
  onSelect: (location: PinLocation) => void
}

export function PinCodeLookup({ onSelect }: PinCodeLookupProps) {
  const [pin, setPin] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const requestVersion = useRef(0)

  const search = async () => {
    const version = ++requestVersion.current
    setPending(true)
    setError('')
    try {
      const location = await lookupPinCode(pin)
      if (version === requestVersion.current) onSelect(location)
    } catch (failure) {
      if (version === requestVersion.current)
        setError(failure instanceof Error ? failure.message : 'PIN lookup failed.')
    } finally {
      if (version === requestVersion.current) setPending(false)
    }
  }

  return (
    <form
      className="pin-lookup"
      onSubmit={(event) => {
        event.preventDefault()
        void search()
      }}
    >
      <div className="pin-lookup-row">
        <label className="field">
          <span>Indian PIN code (optional)</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder="500001"
            value={pin}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'pin-lookup-error' : undefined}
            onChange={(event) => {
              requestVersion.current += 1
              setPin(event.target.value)
              setError('')
              setPending(false)
            }}
          />
        </label>
        <button
          className="icon-button"
          type="submit"
          disabled={pending || !pin.trim()}
          title="Find PIN code coordinates"
          aria-label="Find PIN code coordinates"
        >
          {pending ? <LoaderCircle size={17} /> : <Search size={17} />}
        </button>
      </div>
      {error && (
        <p id="pin-lookup-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      <p className="field-meta">
        Approximate postal location ·{' '}
        <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">
          GeoNames
        </a>
      </p>
    </form>
  )
}

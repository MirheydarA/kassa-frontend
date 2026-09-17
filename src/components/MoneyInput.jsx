import { useEffect, useState } from 'react'
import { digitsOnly, formatThousands } from '../lib/format'

// Kəsr/kopek qəbul etməyən pul input-u: "480.000" yazılsa 480000 (min) kimi şərh olunur.
// value: number (və ya '') | onChange: (number|'') => void
export default function MoneyInput({ value, onChange, className = '', ...props }) {
  const [display, setDisplay] = useState(value === '' || value == null ? '' : formatThousands(String(value)))

  useEffect(() => {
    const digits = digitsOnly(value === '' || value == null ? '' : String(value))
    setDisplay(digits ? formatThousands(digits) : '')
  }, [value])

  function handleChange(e) {
    const digits = digitsOnly(e.target.value)
    setDisplay(digits ? formatThousands(digits) : '')
    onChange(digits ? Number(digits) : '')
  }

  return (
    <input
      className={`input ${className}`}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      {...props}
    />
  )
}

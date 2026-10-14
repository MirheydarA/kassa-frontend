import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'

export default function UsdRubChart({ showHeader = true, height = 'h-80' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = `<div class="tradingview-widget-container__widget"></div>`

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'FX_IDC:USDRUB',
      interval: '5',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'ru',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      support_host: 'https://www.tradingview.com'
    })
    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [])

  return (
    <div className="card overflow-hidden p-0">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-sm font-medium text-ink">USD/RUB (canlı kurs)</span>
        </div>
      )}
      <div className={`tradingview-widget-container ${height}`} ref={containerRef} />
    </div>
  )
}

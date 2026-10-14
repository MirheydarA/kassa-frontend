import { useRef, useState } from 'react'
import { X, GripHorizontal } from 'lucide-react'
import { useChartPopupStore } from '../store/chartPopupStore'
import UsdRubChart from './UsdRubChart'

const DEFAULT_POS = { x: 24, y: 88 }

export default function FloatingChartPopup() {
  const { isOpen, close } = useChartPopupStore()
  const [pos, setPos] = useState(DEFAULT_POS)
  const dragRef = useRef(null)

  function onDragStart(e) {
    const startX = e.clientX
    const startY = e.clientY
    const origin = { ...pos }

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, origin.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 60, origin.y + dy))
      })
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!isOpen) return null

  return (
    <div
      ref={dragRef}
      className="fixed z-50 w-[420px] max-w-[92vw] rounded-lg border border-border bg-surface shadow-xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex cursor-move items-center justify-between rounded-t-lg border-b border-border bg-paper px-3 py-2 select-none"
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <GripHorizontal size={16} className="text-muted" />
          USD/RUB
        </div>
        <button
          className="rounded p-1 text-muted hover:bg-border hover:text-ink"
          onClick={close}
          aria-label="Bağla"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-2">
        <UsdRubChart showHeader={false} height="h-72" />
      </div>
    </div>
  )
}

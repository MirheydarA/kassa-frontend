import { useRef, useState } from 'react'
import { X, GripHorizontal } from 'lucide-react'
import { useChartPopupStore } from '../store/chartPopupStore'
import UsdRubChart from './UsdRubChart'

const DEFAULT_POS = { x: 24, y: 88 }
const DEFAULT_SIZE = { w: 420, h: 340 }
const MIN_SIZE = { w: 320, h: 240 }

export default function FloatingChartPopup() {
  const { isOpen, close } = useChartPopupStore()
  const [pos, setPos] = useState(DEFAULT_POS)
  const [size, setSize] = useState(DEFAULT_SIZE)
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

  function onResizeStart(e) {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const origin = { ...size }

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      setSize({
        w: Math.max(MIN_SIZE.w, Math.min(window.innerWidth - 40, origin.w + dx)),
        h: Math.max(MIN_SIZE.h, Math.min(window.innerHeight - 40, origin.h + dy))
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
      className="fixed z-50 flex max-w-[92vw] flex-col rounded-lg border border-border bg-surface shadow-xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      <div
        className="flex shrink-0 cursor-move items-center justify-between rounded-t-lg border-b border-border bg-paper px-3 py-2 select-none"
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
      <div className="min-h-0 flex-1 p-2">
        <UsdRubChart showHeader={false} height="h-full" />
      </div>
      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        onMouseDown={onResizeStart}
        style={{
          background:
            'linear-gradient(135deg, transparent 0 50%, var(--color-border, #cbd5e1) 50% 60%, transparent 60% 70%, var(--color-border, #cbd5e1) 70% 80%, transparent 80% 100%)'
        }}
        aria-label="Ölçünü dəyiş"
      />
    </div>
  )
}

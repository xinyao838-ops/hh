import { useEffect, useRef, useState } from 'react'
import { marblingConfig } from '../../config/marbling'
import { useWorkshop } from '../../state/WorkshopProvider'
import { applyOperation, complexity, hitClay, interpolate, modelProgress, modelFingerprint, replay, type ClayModel, type CraftOperation, type InputKind } from './engine'
import { DragSession, localPoint } from './input'
import { renderClay } from './render'

export function useMarbling() {
  const { state, saveMarbling } = useWorkshop()
  const saveRef = useRef(saveMarbling); saveRef.current = saveMarbling
  const [initial] = useState(() => ({ model: replay(state.interactionSeed, state.operationLog), operations: state.operationLog }))
  const session = useRef({ ...initial, dirty: false, lastSave: 0, stroke: Math.max(0, ...state.gesturePath.map(p => p.strokeId)) + 1 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(() => modelProgress(initial.model))
  const [animating, setAnimating] = useState(false)
  const [fusionNotice, setFusionNotice] = useState(false)
  const api = useRef<{ action: (kind: 'twist' | 'fold') => void; finish: () => boolean }>({ action: () => {}, finish: () => false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || state.selectedClays.length !== 2) return
    const colors = state.selectedClays.map(c => c.color), seed = state.interactionSeed
    const drag = new DragSession()
    let frame = 0, tween = 0, disposed = false, noticeTimer = 0
    let noticeShown = modelProgress(session.current.model).fusion >= .65 && modelProgress(session.current.model).interactionProgress >= .08
    let pressTimer = 0, holdOrigin = { x: 0, y: 0 }
    let pending: { id: number; point: { x: number; y: number }; pressure: number } | null = null
    const current = session.current
    const flush = () => {
      if (!current.dirty) return
      saveRef.current(current.operations); current.dirty = false; current.lastSave = performance.now()
    }
    const draw = (model: ClayModel = current.model) => {
      const rect = canvas.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, rect.width), height = Math.max(1, rect.height)
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
      }
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); renderClay(ctx, model, colors, width, height)
      canvas.dataset.modelKey = modelFingerprint(model)
      canvas.dataset.operationCount = String(current.operations.length)
      canvas.dataset.materialColors = colors.join(',')
      canvas.dataset.fusion = String(model.columns.reduce((sum, c) => sum + c.bond, 0) / model.columns.length)
      canvas.dataset.complexity = String(complexity(model))
      canvas.dataset.pressCount = String(model.history.pressCount)
      canvas.dataset.interactionProgress = String(modelProgress(model).interactionProgress)
      canvas.dataset.layerCount = String(model.layers.length + 2)
    }
    const append = (operation: CraftOperation) => {
      if (current.operations.length >= marblingConfig.maxOperations) return false
      current.model = applyOperation(current.model, operation)
      current.operations = [...current.operations, operation]; current.dirty = true
      const nextProgress = modelProgress(current.model)
      setProgress(nextProgress)
      if (!noticeShown && nextProgress.fusion >= .65 && nextProgress.interactionProgress >= .08) {
        noticeShown = true; setFusionNotice(true)
        noticeTimer = window.setTimeout(() => setFusionNotice(false), 1000)
      }
      return true
    }
    const animate = (from: ClayModel, duration: number) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(current.model); canvas.classList.remove('is-pressing'); return }
      const started = performance.now(); setAnimating(true)
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / duration)
        draw(interpolate(from, current.model, 1 - (1 - t) ** 3))
        if (t < 1) tween = requestAnimationFrame(tick)
        else { tween = 0; setAnimating(false); canvas.classList.remove('is-pressing') }
      }
      tween = requestAnimationFrame(tick)
    }
    const process = () => {
      frame = 0
      if (pending) {
        const segment = drag.move(pending.id, pending.point, pending.pressure)
        pending = null
        if (segment && append({ kind: 'drag', ...segment, strokeId: current.stroke, time: performance.now() })) {
          canvas.dataset.lastInput = segment.pointerType
          draw()
          if (performance.now() - current.lastSave > 450) flush()
        }
      }
    }
    const begin = (id: number, x: number, y: number, kind: InputKind) => {
      if (tween || current.operations.length >= marblingConfig.maxOperations) return false
      const p = localPoint(x, y, canvas.getBoundingClientRect())
      if (!drag.begin(id, p, kind, hitClay(current.model, p))) return false
      holdOrigin = { x, y }
      pressTimer = window.setTimeout(() => {
        pressTimer = 0
        if (!drag.active || disposed) return
        const from = current.model
        if (append({ kind: 'press', point: drag.active.point, strength: .85 })) {
          canvas.dataset.lastInput = kind; canvas.classList.add('is-pressing'); flush(); animate(from, 260)
          try { if (typeof navigator.vibrate === 'function') navigator.vibrate(8) } catch { /* Optional. */ }
        }
      }, marblingConfig.pressDelay)
      current.stroke++; canvas.classList.add('is-dragging'); return true
    }
    const move = (id: number, x: number, y: number, pressure: number) => {
      if (drag.active?.id !== id) return
      if (Math.hypot(x - holdOrigin.x, y - holdOrigin.y) > 8) { clearTimeout(pressTimer); pressTimer = 0 }
      if (tween) { cancelAnimationFrame(tween); tween = 0; setAnimating(false); canvas.classList.remove('is-pressing') }
      pending = { id, point: localPoint(x, y, canvas.getBoundingClientRect()), pressure }
      if (!frame) frame = requestAnimationFrame(process)
    }
    const end = (id: number) => {
      if (drag.active?.id !== id) return
      clearTimeout(pressTimer); pressTimer = 0
      if (frame) cancelAnimationFrame(frame)
      process(); drag.end(id); canvas.classList.remove('is-dragging')
      if (!tween) draw(current.model)
      flush()
    }
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return
      if (begin(event.pointerId, event.clientX, event.clientY, event.pointerType === 'touch' ? 'touch' : event.pointerType === 'pen' ? 'pen' : 'mouse')) {
        event.preventDefault()
        try { canvas.setPointerCapture(event.pointerId) } catch { /* The contact may already have ended. */ }
      }
    }
    const pointerMove = (event: PointerEvent) => {
      if (drag.active?.id === event.pointerId) { event.preventDefault(); move(event.pointerId, event.clientX, event.clientY, event.pressure) }
    }
    const pointerEnd = (event: PointerEvent) => {
      end(event.pointerId)
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    }
    const touchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (touch && begin(touch.identifier, touch.clientX, touch.clientY, 'touch')) event.preventDefault()
    }
    const touchMove = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches)) if (drag.active?.id === touch.identifier) {
        event.preventDefault(); move(touch.identifier, touch.clientX, touch.clientY, touch.force || .5)
      }
    }
    const touchEnd = (event: TouchEvent) => { for (const touch of Array.from(event.changedTouches)) end(touch.identifier) }
    const mouseDown = (event: MouseEvent) => { if (event.button === 0 && begin(-1, event.clientX, event.clientY, 'mouse')) event.preventDefault() }
    const mouseMove = (event: MouseEvent) => move(-1, event.clientX, event.clientY, .5)
    const mouseUp = () => end(-1)
    const stopScroll = (event: Event) => event.preventDefault()
    const onPageHide = () => { if (drag.active) end(drag.active.id); else flush() }
    const onVisibility = () => { if (document.hidden) onPageHide() }
    if (window.PointerEvent) {
      canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove)
      canvas.addEventListener('pointerup', pointerEnd); canvas.addEventListener('pointercancel', pointerEnd); canvas.addEventListener('lostpointercapture', pointerEnd)
    } else {
      canvas.addEventListener('touchstart', touchStart, { passive: false }); canvas.addEventListener('touchmove', touchMove, { passive: false })
      canvas.addEventListener('touchend', touchEnd); canvas.addEventListener('touchcancel', touchEnd)
      canvas.addEventListener('mousedown', mouseDown); window.addEventListener('mousemove', mouseMove); window.addEventListener('mouseup', mouseUp)
    }
    canvas.addEventListener('contextmenu', stopScroll); canvas.addEventListener('dblclick', stopScroll)
    window.addEventListener('pagehide', onPageHide); document.addEventListener('visibilitychange', onVisibility)
    const observer = new ResizeObserver(() => { if (!disposed) draw(current.model) }); observer.observe(canvas)
    draw(current.model)
    api.current = {
      action: kind => {
        const metrics = modelProgress(current.model)
        if (tween || drag.active || (kind === 'twist' ? metrics.twistCount >= marblingConfig.maxTwists : metrics.foldCount >= marblingConfig.maxFolds)) return
        const from = current.model
        if (!append({ kind })) return
        flush()
        try { if (typeof navigator.vibrate === 'function') navigator.vibrate(8) } catch { /* Optional haptics only. */ }
        animate(from, 460)
      },
      finish: () => {
        if (tween || drag.active || !modelProgress(current.model).ready) return false
        const exportCanvas = document.createElement('canvas'); exportCanvas.width = exportCanvas.height = marblingConfig.exportSize
        renderClay(exportCanvas.getContext('2d')!, current.model, colors, exportCanvas.width, exportCanvas.height, true)
        saveRef.current(current.operations, { imageDataUrl: exportCanvas.toDataURL('image/png'), width: exportCanvas.width, height: exportCanvas.height,
          seed, algorithmVersion: marblingConfig.version, operationCount: current.operations.length })
        current.dirty = false; return true
      },
    }
    return () => {
      disposed = true; clearTimeout(noticeTimer); if (frame) cancelAnimationFrame(frame); if (tween) cancelAnimationFrame(tween)
      clearTimeout(pressTimer)
      process(); flush(); observer.disconnect()
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerEnd); canvas.removeEventListener('pointercancel', pointerEnd); canvas.removeEventListener('lostpointercapture', pointerEnd)
      canvas.removeEventListener('touchstart', touchStart); canvas.removeEventListener('touchmove', touchMove)
      canvas.removeEventListener('touchend', touchEnd); canvas.removeEventListener('touchcancel', touchEnd)
      canvas.removeEventListener('mousedown', mouseDown); window.removeEventListener('mousemove', mouseMove); window.removeEventListener('mouseup', mouseUp)
      canvas.removeEventListener('contextmenu', stopScroll); canvas.removeEventListener('dblclick', stopScroll)
      window.removeEventListener('pagehide', onPageHide); document.removeEventListener('visibilitychange', onVisibility)
    }
    // The mounted page owns its interaction session; provider checkpoints must not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { canvasRef, progress, animating, fusionNotice, full: session.current.operations.length >= marblingConfig.maxOperations,
    act: (kind: 'twist' | 'fold') => api.current.action(kind), finish: () => api.current.finish() }
}


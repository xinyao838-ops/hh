import { clamp, type InputKind, type Point } from './engine.ts'
export function localPoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Point {
  return { x: clamp((clientX - rect.left) / Math.max(1, rect.width)), y: clamp((clientY - rect.top) / Math.max(1, rect.height)) }
}
/** Shared single-contact input gate, used by Pointer Events and legacy fallbacks. */
export class DragSession {
  active: { id: number; point: Point; kind: InputKind } | null = null
  begin(id: number, point: Point, kind: InputKind, hit: boolean) {
    if (this.active || !hit) return false
    this.active = { id, point, kind }; return true
  }
  move(id: number, point: Point, pressure: number) {
    if (!this.active || this.active.id !== id || Math.hypot(point.x - this.active.point.x, point.y - this.active.point.y) < .002) return null
    const segment = { from: this.active.point, to: point, pressure: clamp(pressure || .5), pointerType: this.active.kind }
    this.active.point = point; return segment
  }
  end(id: number) {
    if (this.active?.id !== id) return false
    this.active = null; return true
  }
}

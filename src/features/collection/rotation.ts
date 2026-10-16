/** One pointer owns inspection. Cancellation never launches inertia. */
export class CollectionRotation {
  pointer: number | null = null
  velocity = 0
  private x = 0
  private lastMove = -Infinity
  angle: number
  constructor(angle: number) { this.angle = angle }
  begin(id: number, x: number, primary: boolean, button: number) {
    if (!primary || button !== 0 || this.pointer !== null) return false
    this.pointer = id; this.x = x; this.velocity = 0; this.lastMove = -Infinity
    return true
  }
  move(id: number, x: number, time: number) {
    if (id !== this.pointer) return false
    const delta = (x - this.x) * .007
    this.velocity = Math.max(-.07, Math.min(.07, delta))
    this.angle += delta; this.x = x; this.lastMove = time
    return true
  }
  end(id: number, cancelled: boolean, time: number) {
    if (id !== this.pointer) return false
    this.pointer = null
    if (cancelled || time - this.lastMove > 140) this.velocity = 0
    return true
  }
  stop() { this.pointer = null; this.velocity = 0 }
  tick() { this.velocity *= .91; this.angle += this.velocity; return Math.abs(this.velocity) > .0004 }
}

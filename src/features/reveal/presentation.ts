import { revealConfig } from '../../config/reveal.ts'

/** Presentation time only. Never serialized into the material recipe. */
export class RevealPresentation {
  phase: 'entering' | 'uncut' | 'cutting' | 'revealed'
  elapsed = 0
  private last: number | null = null
  reduced: boolean
  constructor(reduced = false, restored = false) {
    this.reduced = reduced
    this.phase = restored ? 'revealed' : reduced ? 'uncut' : 'entering'
    if (restored) this.elapsed = revealConfig.invitationDelay
  }
  pause() { this.last = null }
  cut() {
    if (this.phase !== 'uncut') return false
    this.phase = 'cutting'; this.elapsed = 0; this.pause(); return true
  }
  advance(now: number, visible = true) {
    if (!visible) { this.pause(); return false }
    const delta = this.last === null ? 0 : Math.max(0, now - this.last)
    this.last = now
    if (this.phase === 'uncut') return false
    this.elapsed += delta
    if (this.phase === 'entering' && this.elapsed >= revealConfig.entryDuration) {
      this.phase = 'uncut'; this.elapsed = 0
    } else if (this.phase === 'cutting' && this.elapsed >= this.cutDuration) {
      this.phase = 'revealed'; this.elapsed = 0; return true
    }
    return false
  }
  get cutDuration() { return this.reduced ? 180 : revealConfig.duration }
  get progress() { return this.phase === 'revealed' ? 1 : this.phase === 'cutting' ? Math.min(1, this.elapsed / this.cutDuration) : 0 }
  get entryProgress() { return this.phase === 'entering' ? Math.min(1, this.elapsed / revealConfig.entryDuration) : 1 }
}

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t) }
export function cutPresentation(progress: number) {
  const ms = Math.max(0, Math.min(1, progress)) * revealConfig.duration
  return { crack: smooth(ms / 260), separation: smooth((ms - 200) / 650), turn: smooth((ms - 850) / 650), clarity: smooth((ms - 1500) / 400) }
}

import { useEffect, useRef } from 'react'
import { palette } from '../config/brand'

function rgb(hex: string) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
}

/** Original decorative cut-clay study, not a physical marbling simulation.
 * Render once; the slow CSS motion needs no continuous Canvas drawing loop.
 * Future interactive generators should live separately from this entrance artwork.
 */
export function ClayArtwork({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const size = 640
    canvas.width = canvas.height = size
    const data = context.createImageData(size, size)
    const light = rgb(palette.clayLight)
    const dark = rgb(palette.brown)
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const x = (px / size - 0.5) * 2.2
        const y = (py / size - 0.5) * 2.2
        const angle = Math.atan2(y, x)
        const radius = Math.hypot(x / 0.91, y / 1.01)
        const edge = 0.93 + 0.035 * Math.sin(angle * 3 + 0.8) + 0.012 * Math.cos(angle * 7)
        const alpha = Math.max(0, Math.min(1, (edge - radius) * size / 2))
        if (!alpha) continue
        let u = x
        let v = y
        // Local rotations fold parallel earth layers into two asymmetrical knots.
        for (const [cx, cy, strength, spread] of [[-0.22, -0.27, 5.5, 1.8], [0.31, 0.4, -4.2, 2.3]]) {
          const dx = u - cx
          const dy = v - cy
          const turn = strength * Math.exp(-(dx * dx + dy * dy) * spread)
          u = cx + dx * Math.cos(turn) - dy * Math.sin(turn)
          v = cy + dx * Math.sin(turn) + dy * Math.cos(turn)
        }
        const strata = u * 35 + v * 7 + 1.7 * Math.sin(v * 8) + 0.38 * Math.sin(u * 19 + v * 9)
        const bands = Math.sin(strata) + 0.23 * Math.sin(strata * 2.03 + 0.8)
        const blend = Math.max(0, Math.min(1, (bands + 0.14) * 6 + 0.5))
        const grain = (Math.sin(px * 127.1 + py * 311.7) * 43758.5453) % 1
        const lightFall = 1.02 - radius * radius * 0.13 - x * 0.035
        const index = (py * size + px) * 4
        for (let c = 0; c < 3; c++) data.data[index + c] = (dark[c] * (1 - blend) + light[c] * blend) * lightFall + grain * 5
        data.data[index + 3] = alpha * 255
      }
    }
    context.putImageData(data, 0, 0)
  }, [])

  return <div className={`clay-artwork${compact ? ' clay-artwork--compact' : ''}`} role="img" aria-label="米白与焦褐陶泥层叠交绞的原创纹理示意，缓慢舒展">
    <div className="artwork-orbit" aria-hidden="true" />
    <span className="artwork-cross artwork-cross--top" aria-hidden="true">+</span>
    <span className="artwork-cross artwork-cross--bottom" aria-hidden="true">+</span>
    <canvas ref={canvasRef} className="clay-canvas" aria-hidden="true" />
  </div>
}

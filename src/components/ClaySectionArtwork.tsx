import { useEffect, useRef } from 'react'
import { palette } from '../config/brand'

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const rgb = (hex: string) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y)
  let fx = x - ix, fy = y - iy
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  return (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy)
    + (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy
}

/** Entrance-only original clay study. Unequal laminations, local compression,
 * folded strata, dry grain and a bevel suggest a cut solid, not a fluid vortex.
 * This is decorative artwork, not the future interactive marbling algorithm.
 */
export function ClaySectionArtwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const size = 720
    canvas.width = canvas.height = size
    const image = context.createImageData(size, size)
    const light = rgb(palette.clayLight), dark = rgb(palette.brown)
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const x = (px / size - .5) * 2.14, y = (py / size - .5) * 2.14
        const angle = Math.atan2(y, x)
        const radius = Math.hypot(x, y / 1.015)
        const edge = .94 + .012 * Math.sin(angle * 5 + .8) + .007 * Math.sin(angle * 9)
        const inset = edge - radius
        if (inset < 0) continue

        // Successive broad shears fold a stack of layers without a radial centre.
        let u = x * .86 - y * .35
        let v = y * .9 + x * .22
        u += .36 * Math.sin(v * 3.3 + .8) + .11 * Math.sin(v * 7.1 - .3)
        v += .49 * Math.sin(u * 3.7 - .7) + .13 * Math.sin(u * 8.4 + .4)
        u += .24 * Math.sin(v * 4.6 + 1.5)
        v += .18 * Math.sin(u * 6.2 + v * 1.4)
        const roughness = noise(x * 19 + 7, y * 19 + 4) - .5
        const layer = (v + .12 * u + .008 * roughness) * 5.7
          + .27 * Math.sin(v * 4.1 + u * 2.2)
        const band = Math.floor(layer)
        const fraction = layer - band
        const width = .23 + .35 * hash(band, 7)
        const darkBand = clamp((width - fraction) * 150) * clamp(fraction * 150)
        // Fine compressed seams occur selectively; most layers retain broad bodies.
        const seam = hash(band, 12) > .8 ? clamp((.017 - Math.abs(fraction - .8)) * 120) * .4 : 0
        const pigment = Math.max(darkBand, seam)
        const grain = hash(px, py)
        const body = noise(x * 6 + 12, y * 6 + 8) - .5
        const pore = grain > .994 ? -25 : 0
        const bevel = clamp(inset / .026)
        const lighting = .96 + .04 * (-x - y) + .035 * body - (1 - bevel) * .19
        const index = (py * size + px) * 4
        for (let c = 0; c < 3; c++) {
          image.data[index + c] = (light[c] * (1 - pigment) + dark[c] * pigment) * lighting
            + (grain - .5) * 10 + roughness * 5 + pore
        }
        image.data[index + 3] = clamp(inset * size / 2) * 255
      }
    }
    context.putImageData(image, 0, 0)
  }, [])

  return <div className="clay-section" role="img" aria-label="米白与焦褐陶泥折叠、挤压形成宽窄不一的层理，带有细微颗粒和切面厚度的原创示意">
    <canvas ref={canvasRef} aria-hidden="true" />
  </div>
}

import {useEffect,useRef} from 'react'
import {useWorkshop} from '../state/WorkshopProvider'
import {drawPatternFace} from '../features/reveal/render'
/** Canvas-only same-source placeholder; no Three.js in the entry bundle. */
export function VesselLoading(){
 const {state}=useWorkshop(),ref=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{
  const canvas=ref.current,recipe=state.finalPattern;if(!canvas||!recipe)return
  const ctx=canvas.getContext('2d')!;canvas.width=640;canvas.height=460
  ctx.fillStyle='#6b51351c';ctx.beginPath();ctx.ellipse(320,330,190,24,0,0,Math.PI*2);ctx.fill()
  ctx.save();ctx.beginPath();ctx.ellipse(320,280,172,67,0,0,Math.PI*2);ctx.clip()
  ctx.fillStyle=recipe.colors[0];ctx.fillRect(100,200,440,160)
  drawPatternFace(ctx,recipe,{x:148,y:213,width:344,height:134});ctx.restore()
 },[state.finalPattern])
 return <main className="workshop shape-page vessel-loading" aria-busy="true"><header className="clay-page-header"><span>05 / 塑器</span><span>金谷轩</span></header><header className="shape-heading"><h1>让这一纹，有一个形。</h1><p>顺着泥，把它慢慢托起来。</p></header><canvas ref={ref} aria-label="同一纹样的泥坯预览"/><p role="status">正在安放你的泥坯。</p></main>
}

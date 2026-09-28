import { clamp, interactionProgress, type Point } from '../marbling/engine.ts'
import type { FinalPattern } from './pattern.ts'
import { revealConfig } from '../../config/reveal.ts'

type Rect={x:number;y:number;width:number;height:number}
/** The saved material columns and layers remain the sole source of the pattern. */
export function drawPatternFace(ctx:CanvasRenderingContext2D,recipe:FinalPattern,rect:Rect) {
  const model=recipe.model,columns=model.columns,count=columns.length
  const left=columns[0].x,span=columns.at(-1)!.x-left
  const mid=columns.reduce((sum,c)=>sum+(c.a+c.b)/2,0)/count
  const at=(i:number,v:number)=>{
    const c=columns[i],u=(c.x-left)/span,cap=Math.sqrt(Math.max(.001,1-(2*u-1)**2))
    const belly=clamp((c.ra+c.rb)/.24,.82,1.1)
    return {x:rect.x+u*rect.width,y:rect.y+rect.height*(.5+((c.a+c.b)/2-mid)*.14+v*.455*cap*belly)}
  }
  const path=(top:number[],bottom:number[])=>{
    const p=new Path2D();top.forEach((v,i)=>{const q=at(i,v);if(i===0)p.moveTo(q.x,q.y);else p.lineTo(q.x,q.y)})
    for(let i=count-1;i>=0;i--){const q=at(i,bottom[i]);p.lineTo(q.x,q.y)}p.closePath();return p
  }
  const lo=Array(count).fill(-1),hi=Array(count).fill(1),outline=path(lo,hi)
  ctx.save();ctx.fillStyle=recipe.colors[0];ctx.fill(outline);ctx.clip(outline)
  ctx.fillStyle=recipe.colors[1];ctx.fill(path(columns.map(c=>c.seam),hi))
  for(const layer of model.layers){
    const grow=clamp((interactionProgress(model)-layer.birth)/.075)
    const upper=layer.top.map((v,i)=>(v+layer.bottom[i])/2+(v-layer.bottom[i])/2*grow)
    const lower=layer.bottom.map((v,i)=>(v+layer.top[i])/2+(v-layer.top[i])/2*grow)
    ctx.fillStyle=recipe.colors[layer.material];ctx.fill(path(upper,lower))
  }
  ctx.restore()
}
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)}
const oval=(cx:number,cy:number,rx:number,ry:number)=>{
  const p=new Path2D();p.ellipse(cx,cy,rx,ry,-.025,0,Math.PI*2);return p
}
/** A quiet, smooth short cylinder. Outer pigment traces are deliberately shallow;
 * no internal finalPattern is drawn on this surface. */
function shell(ctx:CanvasRenderingContext2D,recipe:FinalPattern,left:number,right:number,cy:number,ry:number,cap:number){
  const p=new Path2D()
  p.moveTo(left,cy-ry)
  p.bezierCurveTo(left+(right-left)*.35,cy-ry*1.04,right-(right-left)*.2,cy-ry*.98,right,cy-ry)
  p.bezierCurveTo(right+cap*1.3,cy-ry,right+cap*1.3,cy+ry,right,cy+ry)
  p.bezierCurveTo(right-(right-left)*.4,cy+ry*1.025,left+(right-left)*.25,cy+ry*.99,left,cy+ry)
  p.bezierCurveTo(left-cap*1.3,cy+ry,left-cap*1.3,cy-ry,left,cy-ry);p.closePath()
  ctx.save();ctx.fillStyle=recipe.colors[0];ctx.fill(p);ctx.clip(p)
  // A pair of broad, low-contrast surface traces, not a half-and-half sandwich.
  ctx.globalAlpha=.45;ctx.fillStyle=recipe.colors[1]
  ctx.beginPath();ctx.moveTo(left-cap,cy+ry*.2)
  ctx.bezierCurveTo(left+(right-left)*.25,cy+ry*.04,right-(right-left)*.25,cy+ry*.36,right+cap,cy+ry*.12)
  ctx.lineTo(right+cap,cy+ry*.32)
  ctx.bezierCurveTo(right-(right-left)*.2,cy+ry*.51,left+(right-left)*.2,cy+ry*.17,left-cap,cy+ry*.38)
  ctx.closePath();ctx.fill()
  ctx.globalAlpha=.25;ctx.beginPath();ctx.moveTo(left-cap,cy-ry*.64)
  ctx.bezierCurveTo(left+(right-left)*.3,cy-ry*.79,right-(right-left)*.2,cy-ry*.42,right+cap,cy-ry*.53)
  ctx.lineTo(right+cap,cy-ry*.46)
  ctx.bezierCurveTo(right-(right-left)*.2,cy-ry*.35,left+(right-left)*.3,cy-ry*.70,left-cap,cy-ry*.56);ctx.closePath();ctx.fill()
  ctx.globalAlpha=1
  const light=ctx.createLinearGradient(0,cy-ry,0,cy+ry)
  light.addColorStop(0,'#fff5de18');light.addColorStop(.3,'#fff4dc23');light.addColorStop(.63,'#37231606');light.addColorStop(1,'#30201548')
  ctx.fillStyle=light;ctx.fill(p);ctx.restore()
}
function shadow(ctx:CanvasRenderingContext2D,cx:number,y:number,rx:number,ry:number,alpha:number){
  ctx.save();ctx.translate(cx,y);ctx.scale(rx,ry)
  const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(65,44,27,${alpha})`);g.addColorStop(.4,`rgba(65,44,27,${alpha*.5})`);g.addColorStop(1,'rgba(65,44,27,0)')
  ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore()
}
export interface RevealView { progress:number; cutX?:number; trace:Point[]; zoom:number; pan:Point; showGuide:boolean }
export const faceRect=(width:number,height:number):Rect=>({x:width*.505,y:height*.295,width:width*.43,height:height*.42})
export function renderReveal(ctx:CanvasRenderingContext2D,recipe:FinalPattern,w:number,h:number,view:RevealView){
  ctx.clearRect(0,0,w,h)
  const seconds=clamp(view.progress)*revealConfig.duration/1000
  const separation=ease((seconds-.4)/.6),turn=ease((seconds-1)/.8),clarity=ease((seconds-1.8)/.7)
  const final=faceRect(w,h),focus={x:final.x+final.width/2,y:final.y+final.height/2}
  ctx.save();ctx.translate(focus.x+view.pan.x*w,focus.y+view.pan.y*h);ctx.scale(view.zoom,view.zoom);ctx.translate(-focus.x,-focus.y)
  const cy=.505*h,ry=.19*h,left=.23*w,cut=(view.cutX??revealConfig.cutX)*w,right=.74*w,cap=.055*w
  // Each stroke splits the visible body at its own location. The detached
  // piece turns into a consistent inspection position without changing the recipe.
  const shift=clamp(w*.09,20,40)*separation,bodyShift=Math.min(0,w*.535-cut)*turn
  shadow(ctx,(left+right)/2+bodyShift*.4,cy+ry*1.04,w*.39,h*.045,.22)
  if(view.progress===0){shell(ctx,recipe,left,right,cy,ry,cap)}
  else {
    ctx.save();ctx.translate(bodyShift,0);ctx.beginPath();ctx.rect(0,0,cut,h);ctx.clip();shell(ctx,recipe,left,right,cy,ry,cap);ctx.restore()
    // A single straight cut, never a torn polygon or ragged pair of halves.
    const crack=clamp(seconds/.4)
    ctx.save();ctx.strokeStyle=`rgba(65,41,25,${.65*crack})`;ctx.lineWidth=1.2
    ctx.beginPath();ctx.moveTo(cut+bodyShift,cy-ry);ctx.lineTo(cut+bodyShift,cy-ry+2*ry*crack);ctx.stroke();ctx.restore()
    const cx=(cut+shift)*(1-turn)+w*.72*turn,rx=w*(.004+.211*turn),sliceRy=ry*(1+.105*turn)
    // The side wall gets narrower as the cut face turns toward the viewer.
    const depth=Math.max(w*.006,right-cut)*(1-turn)+w*.018*turn
    shadow(ctx,cx+depth*.5,cy+sliceRy*1.045,rx+depth+w*.065,h*.043,.23)
    const side=new Path2D();side.moveTo(cx,cy-sliceRy);side.lineTo(cx+depth,cy-sliceRy)
    side.bezierCurveTo(cx+depth+rx*1.32,cy-sliceRy,cx+depth+rx*1.32,cy+sliceRy,cx+depth,cy+sliceRy)
    side.lineTo(cx,cy+sliceRy);side.closePath()
    ctx.save();ctx.fillStyle=recipe.colors[0];ctx.fill(side);ctx.clip(side)
    const rimShade=ctx.createLinearGradient(cx,cy-sliceRy,cx+depth,cy+sliceRy)
    rimShade.addColorStop(0,'#fff5df12');rimShade.addColorStop(1,'#3b28194d');ctx.fillStyle=rimShade;ctx.fill(side);ctx.restore()
    if(turn===0){ctx.save();ctx.translate(shift,0);ctx.beginPath();ctx.rect(cut,0,w,h);ctx.clip();shell(ctx,recipe,left,right,cy,ry,cap);ctx.restore()}
    if(turn>0){
      // Smooth elliptical mask separates the cut surface from the rounded shell.
      // Expand the unchanged material field slightly behind the mask so that its
      // deformed column endpoints cannot become spikes in the physical cut edge.
      const face=oval(cx,cy,rx,sliceRy)
      ctx.save();ctx.clip(face);ctx.fillStyle=recipe.colors[0];ctx.fill(face)
      drawPatternFace(ctx,recipe,{x:cx-rx*1.13,y:cy-sliceRy*1.28,width:rx*2.26,height:sliceRy*2.56})
      const diffuse=ctx.createLinearGradient(cx-rx,cy-sliceRy,cx+rx,cy+sliceRy)
      diffuse.addColorStop(0,'#fff0d60b');diffuse.addColorStop(.55,'#402d1700');diffuse.addColorStop(1,'#402d1726');ctx.fillStyle=diffuse;ctx.fill(face)
      ctx.fillStyle=`rgba(62,43,27,${.25*(1-clarity)})`;ctx.fill(face);ctx.restore()
      ctx.strokeStyle='#5b403526';ctx.lineWidth=.65;ctx.stroke(face)
    }
  }
  if(view.showGuide&&view.progress===0&&view.trace.length){
    ctx.save();ctx.strokeStyle='#5d47384d';ctx.lineWidth=1;ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(cut,h*.24);ctx.lineTo(cut,h*.78);ctx.stroke();ctx.setLineDash([])
    ctx.fillStyle='#6c503f73';ctx.beginPath();ctx.arc(cut,h*.24,2,0,Math.PI*2);ctx.fill();ctx.restore()
  }
  if(view.trace.length&&view.progress===0){
    ctx.strokeStyle='#51362685';ctx.lineWidth=1.2;ctx.lineCap='round';ctx.beginPath()
    view.trace.forEach((v,i)=>{if(i===0)ctx.moveTo(v.x*w,v.y*h);else ctx.lineTo(v.x*w,v.y*h)});ctx.stroke()
  }
  ctx.restore()
}


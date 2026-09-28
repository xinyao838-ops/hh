import { clamp, interactionProgress, noise, sectionAt, type ClayModel } from './engine.ts'
/** Colour boundaries live in material coordinates: x is the deformed column and
 * v is the local cross-section. There is no screen-space marbling texture. */
export function materialPoint(model: ClayModel, index: number, v: number) {
  const c=model.columns[index],s=sectionAt(c,index/(model.columns.length-1))
  return {x:c.x,y:(s.top+s.bottom)/2+v*(s.bottom-s.top)/2}
}
function pathBetween(model:ClayModel,top:number[],bottom:number[],width:number,height:number) {
  const path=new Path2D()
  top.forEach((v,i)=>{const p=materialPoint(model,i,v);if(i===0)path.moveTo(p.x*width,p.y*height);else path.lineTo(p.x*width,p.y*height)})
  for(let i=bottom.length-1;i>=0;i--){const p=materialPoint(model,i,bottom[i]);path.lineTo(p.x*width,p.y*height)}
  path.closePath();return path
}
let grain:HTMLCanvasElement|undefined
const shadeSurfaces=new WeakMap<CanvasRenderingContext2D,HTMLCanvasElement>()
function shadeBody(ctx:CanvasRenderingContext2D,model:ClayModel,width:number,height:number) {
  let surface=shadeSurfaces.get(ctx)
  if(!surface){surface=document.createElement('canvas');shadeSurfaces.set(ctx,surface)}
  const w=Math.min(220,Math.ceil(width)),h=Math.min(260,Math.ceil(height))
  if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h}
  const off=surface.getContext('2d')!,data=off.createImageData(w,h),columns=model.columns
  let index=0
  for(let x=0;x<w;x++){
    const px=(x+.5)/w
    if(px<columns[0].x||px>columns.at(-1)!.x)continue
    while(index<columns.length-2&&columns[index+1].x<px)index++
    const a=sectionAt(columns[index],index/(columns.length-1)),b=sectionAt(columns[index+1],(index+1)/(columns.length-1))
    const t=clamp((px-columns[index].x)/(columns[index+1].x-columns[index].x))
    const top=a.top+(b.top-a.top)*t,bottom=a.bottom+(b.bottom-a.bottom)*t
    for(let y=Math.max(0,Math.floor(top*h));y<Math.min(h,Math.ceil(bottom*h));y++){
      const v=clamp(((y+.5)/h-top)/(bottom-top)*2-1,-1,1)
      const light=.035*(1-v*v)-.16*Math.abs(v)**4-.045*v,offset=(y*w+x)*4
      data.data.set(light>0?[255,244,220,Math.round(light*255)]:[43,27,12,Math.round(-light*255)],offset)
    }
  }
  off.putImageData(data,0,0);ctx.drawImage(surface,0,0,width,height)
}
function grainPattern(ctx:CanvasRenderingContext2D) {
  if(!grain){
    grain=document.createElement('canvas');grain.width=grain.height=96
    const g=grain.getContext('2d')!,data=g.createImageData(96,96)
    for(let i=0;i<96*96;i++){const n=noise(1729,i),v=n>.52?245:48;data.data.set([v,v-7,v-12,Math.round(n*15)],i*4)}
    g.putImageData(data,0,0)
  }
  return ctx.createPattern(grain,'repeat')!
}
export function renderClay(ctx:CanvasRenderingContext2D,model:ClayModel,colors:string[],width:number,height:number,section=false) {
  ctx.clearRect(0,0,width,height)
  const count=model.columns.length,top=Array(count).fill(-1),bottom=Array(count).fill(1)
  const body=pathBetween(model,top,bottom,width,height),seam=model.columns.map(c=>c.seam)
  const progress=interactionProgress(model)
  const drawMaterials=()=>{
    ctx.fillStyle=colors[0];ctx.fill(body)
    ctx.fillStyle=colors[1];ctx.fill(pathBetween(model,seam,bottom,width,height))
    for(const layer of model.layers){
      // A newly folded tongue unfolds over subsequent work, not on a timer.
      const grow=clamp((progress-layer.birth)/.075)
      const upper=layer.top.map((v,i)=>{const mid=(v+layer.bottom[i])/2;return mid+(v-mid)*grow})
      const lower=layer.bottom.map((v,i)=>{const mid=(v+layer.top[i])/2;return mid+(v-mid)*grow})
      ctx.fillStyle=colors[layer.material];ctx.fill(pathBetween(model,upper,lower,width,height))
    }
  }
  ctx.save()
  if(section){
    ctx.fillStyle='#e7dece';ctx.fillRect(0,0,width,height)
    const middle=model.columns[Math.floor(count/2)]
    ctx.translate(width/2,height/2);ctx.scale(2.3,2.3);ctx.translate(-middle.x*width,-(middle.a+middle.b)/2*height)
  }else{
    // A shallow clay sidewall carries the SAME layers around the edge, beneath
    // the rounded top. Broad diffuse shading, without a glossy rim or highlights.
    const pressing=model.columns.reduce((sum,c)=>sum+c.pressed,0)/count
    const depth=Math.max(4,Math.min(width,height)*.022/(1+pressing*.12))
    ctx.save();ctx.translate(0,depth)
    ctx.shadowColor='#33211438';ctx.shadowBlur=12;ctx.shadowOffsetY=5
    ctx.fillStyle=colors[0];ctx.fill(body);ctx.shadowColor='transparent'
    ctx.clip(body);drawMaterials();ctx.fillStyle='#33200f2e';ctx.fill(body);ctx.restore()
  }
  ctx.save();ctx.clip(body);drawMaterials()
  if(!section){
    // Each gradient follows the actual changing section, so raised and narrowed
    // areas shade with the geometry instead of receiving a flat oval overlay.
    shadeBody(ctx,model,width,height)
    ctx.fillStyle=grainPattern(ctx);ctx.fillRect(0,0,width,height)
  }
  ctx.restore();ctx.restore()
}

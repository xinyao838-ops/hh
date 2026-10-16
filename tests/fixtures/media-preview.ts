import type { CraftOperation } from '../../src/features/marbling/engine.ts'
export const previewSeed=20261017
export function strokes(mirrored=false):CraftOperation[]{
 const points=[{x:.30,y:.48},{x:.63,y:.36},{x:.43,y:.60},{x:.70,y:.51},{x:.38,y:.40},{x:.57,y:.58}]
 const ops:CraftOperation[]=[]
 for(let s=0;s<3;s++){
  for(let segment=0;segment<points.length-1;segment++){
   const a=points[segment],b=points[segment+1]
   for(let n=0;n<10;n++){
    const point=(t:number)=>({x:mirrored?1-(a.x+(b.x-a.x)*t):a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})
    ops.push({kind:'drag',from:point(n/10),to:point((n+1)/10),pressure:.6,time:ops.length*24,strokeId:s+1,pointerType:'touch'})
   }
  }
  ops.push({kind:'twist'},{kind:'fold'},{kind:'press',point:{x:mirrored?.66:.34,y:.5},strength:.65})
 }
 return ops
}
export const previewSamples=[
 {id:'initial',label:'初始宽层',operations:[] as CraftOperation[]},
 {id:'simple',label:'轻度操作',operations:[{kind:'twist'},{kind:'fold'},{kind:'press',point:{x:.5,y:.5},strength:.4}] as CraftOperation[]},
 {id:'middle',label:'揉拉与一次折合',operations:strokes().slice(0,53)},
 {id:'worked-a',label:'充分操作 A',operations:strokes()},
 {id:'worked-b',label:'同种子 · 镜向揉拉 B',operations:strokes(true)},
]

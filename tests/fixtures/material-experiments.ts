import type { CraftOperation } from '../../src/features/marbling/engine.ts'
export const experimentSeed=20261017
export function balancedOperations(reverse=false):CraftOperation[]{
 const ops:CraftOperation[]=[]
 const anchors=reverse?[.68,.48,.28]:[.28,.48,.68]
 for(let round=0;round<3;round++){
  for(const x of anchors){
   const sign=(round%2? -1:1)*(reverse?-1:1)
   const points=[{x,y:.48},{x:x+.12*sign,y:.44},{x:x-.06*sign,y:.53},{x,y:.48}]
   const stroke=round*3+anchors.indexOf(x)+1
   for(let j=0;j<3;j++)for(let k=0;k<8;k++){
    const a=points[j],b=points[j+1],at=(t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})
    ops.push({kind:'drag',from:at(k/8),to:at((k+1)/8),pressure:.6,time:ops.length*24,strokeId:stroke,pointerType:'touch'})
   }
   ops.push({kind:'press',point:{x,y:.50},strength:.5})
  }
  ops.push({kind:'twist'},{kind:'fold'})
 }
 return ops
}
const all=balancedOperations()
export const experimentSamples=[
 {id:'initial',label:'初始',operations:[] as CraftOperation[]},
 {id:'simple',label:'少量操作',operations:all.slice(0,25)},
 {id:'middle',label:'中等操作',operations:all.slice(0,77)},
 {id:'worked-a',label:'充分操作 A',operations:all},
 {id:'worked-b',label:'同seed不同序列 B',operations:balancedOperations(true)}
]

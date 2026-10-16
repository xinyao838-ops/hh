import {modelFingerprint, type ClayColumn} from '../marbling/engine.ts'
import type {FinalPattern} from './pattern.ts'

/** Experimental 2D material-window sampling, NOT a volumetric cut simulation.
 * Not persisted or used by the production result until the prototype is reviewed. */
export interface CutParameters { version: 1; position: number; angleDegrees: number }
export function normalizeCut(value: CutParameters): CutParameters {
  if(value.version!==1||!Number.isFinite(value.position)||!Number.isFinite(value.angleDegrees)
    ||value.position<0||value.position>1||Math.abs(value.angleDegrees)>30)throw Error('Invalid cut parameters')
  return {version:1,position:Math.round(value.position*10000)/10000,angleDegrees:Math.round(value.angleDegrees*100)/100}
}
export function sampleCutSection(source:FinalPattern,input:CutParameters){
  const cut=normalizeCut(input),original=source.model,n=original.columns.length
  const slope=Math.tan(cut.angleDegrees*Math.PI/180)
  const sample=(values:number[],u:number)=>{
    const at=Math.max(0,Math.min(1,u))*(n-1),i=Math.min(n-2,Math.floor(at)),t=at-i
    return values[i]+(values[i+1]-values[i])*t
  }
  // Every region remains sourced from the same 57 columns. Angle shears the
  // sampling window by material depth, so colour boundaries move coherently.
  const coordinate=(i:number,depth=0)=>cut.position*.45+i/(n-1)*.55+slope*depth*.12
  const columns=original.columns.map((column,i)=>{
    const result={...column}
    for(const key of Object.keys(column) as (keyof ClayColumn)[])
      if(key!=='x')result[key]=sample(original.columns.map(c=>c[key]),coordinate(i))
    return result
  })
  const layers=original.layers.map(layer=>({...layer,
    // Sample both sides at the same material-centre coordinate. Sampling each
    // side independently can invert thin strata at extreme shear angles.
    top:layer.top.map((depth,i)=>sample(layer.top,coordinate(i,(depth+layer.bottom[i])/2))),
    bottom:layer.bottom.map((depth,i)=>sample(layer.bottom,coordinate(i,(depth+layer.top[i])/2))),
  }))
  columns.forEach((c,i)=>{c.seam=sample(original.columns.map(v=>v.seam),coordinate(i,c.seam))})
  const model={...original,columns,layers},fingerprint=modelFingerprint(model)
  return {version:1 as const,sourceKey:source.sourceKey,cut,
    sectionKey:`${source.sourceKey}:cut-v1:${cut.position}:${cut.angleDegrees}:${fingerprint}`,model}
}

import { vesselTypes, type VesselType } from '../../config/shaping.ts'
export interface ShapeDraft {version:1;sourceKey:string;vesselType:VesselType;progress:number;rotation:number;observed:boolean}
export const bound=(n:number,min=0,max=1)=>Math.min(max,Math.max(min,n))
export const isVesselType=(id:unknown):id is VesselType=>vesselTypes.some(v=>v.id===id)
export function initialShape(sourceKey:string):ShapeDraft{return{version:1,sourceKey,vesselType:'bowl',progress:0,rotation:0,observed:false}}
export function normalizeShape(value:unknown,sourceKey:string):ShapeDraft|null{
  if(!value||typeof value!=='object')return null
  const s=value as ShapeDraft
  if(s.version!==1||s.sourceKey!==sourceKey||!isVesselType(s.vesselType)||!Number.isFinite(s.progress)||!Number.isFinite(s.rotation))return null
  return{version:1,sourceKey,vesselType:s.vesselType,progress:bound(s.progress),rotation:((s.rotation%(Math.PI*2))+Math.PI*2)%(Math.PI*2),observed:s.progress>=1&&s.observed===true}
}
export interface ProfilePoint {r:number;y:number;materialRadius:number}
/** Closed section: underside -> outside -> rounded lip -> inside -> floor.
 * Constant topology and material coordinates make intermediate shapes continuous. */
export function vesselProfile(type:VesselType,progress:number):ProfilePoint[]{
  const target=vesselTypes.find(v=>v.id===type)!,p=bound(progress),mix=(a:number,b:number)=>a+(b-a)*p
  const points:ProfilePoint[]=[]
  const push=(r0:number,y0:number,r1:number,y1:number,m:number)=>points.push({r:mix(r0,r1),y:mix(y0,y1),materialRadius:m})
  push(0,.025,0,.025,0)
  for(let i=1;i<=6;i++){const t=i/6;push(.88*t,.025,target.base*t,.025,t*.23)}
  const radius=(t:number)=>target.base+(target.radius-target.base)*(type==='cup'?t*.9+Math.sin(t*Math.PI/2)*.1:Math.sin(t*Math.PI/2)**.7)
  for(let i=0;i<=24;i++){const t=i/24;push(.88+.12*Math.sin(t*Math.PI/2),.035+.12*t,radius(t),.04+(target.height-.08)*t,.23+.73*t)}
  // Smooth rounded lip with physical wall thickness, present at every progress.
  for(let i=1;i<=8;i++){const a=i/8*Math.PI;push(.965+.035*Math.cos(a),.155+.035*Math.sin(a),target.radius-.04+.04*Math.cos(a),target.height-.04+.04*Math.sin(a),.96)}
  for(let i=23;i>=0;i--){const t=i/24;push(.93*t,.155,radius(t)-.08,.13+(target.height-.17)*t,.96*t)}
  push(0,.155,0,.13,0)
  return points
}
/** Fixed polar UVs sample one material disc; a full turn has no wrapping seam. */
export function materialUV(angle:number,radius:number){return{u:.5+Math.sin(angle)*radius*.465,v:.5+Math.cos(angle)*radius*.465}}
export function liftProgress(start:number,deltaY:number,height:number){return bound(start-deltaY/Math.max(100,height*.43))}

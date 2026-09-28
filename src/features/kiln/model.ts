import {kilnConfig} from '../../config/kiln.ts'
import {bound,type ShapeDraft} from '../shaping/model.ts'
import type {VesselType} from '../../config/shaping.ts'
export type KilnPhase='idle'|'entering'|'firing'|'ready'|'opening'|'revealed'
export interface KilnDraft {version:1;sourceKey:string;vesselType:VesselType;shapeProgress:number;phase:KilnPhase;elapsed:number;doorStart:number;rotation:number;observed:boolean;viewTime:number}
export function initialKiln(shape:ShapeDraft):KilnDraft{return{version:1,sourceKey:shape.sourceKey,vesselType:shape.vesselType,shapeProgress:shape.progress,phase:'idle',elapsed:0,doorStart:0,rotation:shape.rotation,observed:false,viewTime:0}}
export function normalizeKiln(value:unknown,shape:ShapeDraft):KilnDraft|null{
 if(!value||typeof value!=='object'||shape.progress!==1||!shape.observed)return null
 const k=value as KilnDraft
 if(k.version!==1||k.sourceKey!==shape.sourceKey||k.vesselType!==shape.vesselType||k.shapeProgress!==1||!['idle','entering','firing','ready','opening','revealed'].includes(k.phase)||![k.elapsed,k.doorStart,k.rotation,k.viewTime].every(Number.isFinite))return null
 const max=k.phase==='entering'?kilnConfig.entryDuration:k.phase==='firing'?kilnConfig.firingDuration+kilnConfig.quietDuration:k.phase==='opening'?kilnConfig.openingDuration:k.phase==='revealed'?60000:0
 return {...initialKiln(shape),phase:k.phase,elapsed:bound(k.elapsed,0,max),doorStart:bound(k.doorStart,0,.85),rotation:k.rotation%(Math.PI*2),observed:k.phase==='revealed'&&k.observed===true,viewTime:k.phase==='revealed'?bound(k.viewTime,0,60000):0}
}
export const smooth=(t:number)=>{const p=bound(t);return p*p*(3-2*p)}
export function kilnFrame(k:KilnDraft){
 let depth=0,door=0,dark=0,heat=0,firing=0,approach=0,arch=0
 if(k.phase==='entering'){depth=smooth(k.elapsed/1400);door=smooth((k.elapsed-1200)/1200);dark=smooth((k.elapsed-600)/1800)*.94;arch=smooth(k.elapsed/850)}
 else if(k.phase==='firing'){depth=1;door=1;dark=.94;arch=1;firing=bound(k.elapsed/kilnConfig.firingDuration);heat=Math.sin(Math.PI*bound(firing/.95))*.85+.12;heat*=.97+.03*Math.sin(k.elapsed/760)}
 else if(k.phase==='ready'){depth=1;door=1;dark=.94;arch=1;firing=1;heat=.09}
 else if(k.phase==='opening'){const open=k.doorStart+(1-k.doorStart)*smooth(k.elapsed/kilnConfig.openingDuration);depth=1-smooth((open-.32)/.68);door=1-open;dark=.94*(1-smooth((open-.1)/.9));arch=1-smooth((open-.45)/.55);firing=1;heat=.38*Math.sin(Math.PI*open)+.09*(1-open)}
 else if(k.phase==='revealed'){firing=1;approach=smooth(k.elapsed/1800)*.055}
 return{depth,door,dark,heat,firing,approach,arch}
}
export function firingMaterial(progress:number){const p=bound(progress);return{roughness:1-.72*p,bumpScale:.018-.0135*p,clearcoat:.0001+.22*p,clearcoatRoughness:.42-.1*p,envIntensity:.62*p,pigmentMix:p,contrast:1+.08*p,saturation:1+.06*p}}
export function advanceKiln(k:KilnDraft,delta:number):KilnDraft{
 const next={...k},dt=bound(delta,0,100)
 if(['entering','firing','opening','revealed'].includes(k.phase))next.elapsed+=dt
 if(next.phase==='entering'&&next.elapsed>=kilnConfig.entryDuration){next.phase='firing';next.elapsed=0}
 if(next.phase==='firing'&&next.elapsed>=kilnConfig.firingDuration+kilnConfig.quietDuration){next.phase='ready';next.elapsed=0}
 if(next.phase==='opening'&&next.elapsed>=kilnConfig.openingDuration){next.phase='revealed';next.elapsed=0;next.viewTime=0}
 if(next.phase==='revealed'){next.elapsed=Math.min(next.elapsed,60000);next.viewTime=Math.min(next.viewTime+dt,60000)}
 return next
}
export const canCollect=(k:KilnDraft)=>k.phase==='revealed'&&k.observed&&k.viewTime>=kilnConfig.observationDuration
export function openingAmount(from:{x:number;y:number},to:{x:number;y:number}){const dy=from.y-to.y;return dy>Math.abs(to.x-from.x)*1.1?bound(dy/.44,0,.85):0}

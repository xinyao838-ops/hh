import {useEffect,useRef,useState,type RefObject} from 'react'
import {useWorkshop} from '../../state/WorkshopProvider'
import {kilnConfig,kilnCopy} from '../../config/kiln'
import {bound} from '../shaping/model'
import type {ShapingScene} from '../shaping/scene'
import {initialKiln,kilnFrame,advanceKiln,canCollect,openingAmount,type KilnDraft,type KilnPhase} from './model'
interface KilnUI {phase:KilnPhase;status:string;first:boolean;second:boolean;collect:boolean}
export function useKiln(canvasRef:RefObject<HTMLCanvasElement|null>,mainRef:RefObject<HTMLElement|null>,scene:ShapingScene|null,enabled:boolean){
 const {state,saveKiln}=useWorkshop(),latest=useRef(state),saveRef=useRef(saveKiln);latest.current=state;saveRef.current=saveKiln
 const [ui,setUI]=useState<KilnUI>({phase:state.kilnDraft?.phase??'idle',status:'',first:false,second:false,collect:false})
 const enterRef=useRef<()=>void>(()=>{}),flushRef=useRef<()=>void>(()=>{})
 useEffect(()=>{
  if(!enabled||!scene||!latest.current.shapeDraft)return
  const canvas=canvasRef.current!,main=mainRef.current!;let current:KilnDraft=latest.current.kilnDraft??initialKiln(latest.current.shapeDraft)
  let disposed=false,frameId=0,lastTime=0,saveTime=0,signature='',active:number|null=null,preview=0,returning=false,velocity=0,travel=0
  let from={x:0,y:0},last={x:0,y:0,time:0},startRotation=current.rotation
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
  scene.update(current.vesselType,current.shapeProgress)
  const persist=()=>{saveRef.current({...current});saveTime=0}
  flushRef.current=()=>{velocity=0;persist()}
  const sync=()=>{
   let status=''
   if(current.phase==='firing'&&current.elapsed<kilnConfig.firingDuration){const span=kilnConfig.firingDuration/4,inside=current.elapsed%span;if(inside>180&&inside<span-170)status=kilnCopy.states[Math.min(3,Math.floor(current.elapsed/span))]}
   if(current.phase==='ready')status=kilnCopy.ready
   const value={phase:current.phase,status,first:current.phase==='revealed'&&current.elapsed>=kilnConfig.revealQuiet,second:current.phase==='revealed'&&current.elapsed>=kilnConfig.revealQuiet+400,collect:canCollect(current)}
   const next=JSON.stringify(value);if(next!==signature){signature=next;setUI(value)}
  }
  const draw=(now:number)=>{
   frameId=0;if(disposed||document.hidden)return
   const dt=lastTime?Math.min(50,now-lastTime):0;lastTime=now
   const previous=current.phase
   current=advanceKiln(current,dt*(reduced&&['entering','firing','opening'].includes(current.phase)?3:1))
   if(active===null&&Math.abs(velocity)>.005){current.rotation+=velocity*dt/1000;velocity*=Math.exp(-5.5*dt/1000);if(Math.abs(velocity)<=.005){velocity=0;persist()}}
   if(returning){preview*=Math.exp(-14*dt/1000);if(preview<.002){preview=0;returning=false}}
   const view=preview>0&&current.phase==='ready'?kilnFrame({...current,phase:'opening',elapsed:0,doorStart:preview}):kilnFrame(current)
   scene.atmosphere(view.firing,view.depth,view.heat,view.approach);scene.render(current.rotation)
   main.style.setProperty('--kiln-darkness',String(view.dark));main.style.setProperty('--kiln-heat',String(view.heat));main.style.setProperty('--kiln-arch',String(view.arch));main.style.setProperty('--kiln-door',String(view.door))
   canvas.dataset.kilnPhase=current.phase;canvas.dataset.door=String(view.door);canvas.dataset.rotation=String(current.rotation);canvas.dataset.vesselType=current.vesselType;canvas.dataset.shapeProgress=String(current.shapeProgress);canvas.dataset.kilnObserved=String(current.observed)
   sync();saveTime+=dt
   if(previous!==current.phase||saveTime>=kilnConfig.saveInterval)persist()
   if(['entering','firing','opening'].includes(current.phase)||(current.phase==='revealed'&&current.elapsed<kilnConfig.observationDuration)||Math.abs(velocity)>.005||returning)frameId=requestAnimationFrame(draw)
  }
  const redraw=()=>{if(!frameId&&!disposed)frameId=requestAnimationFrame(draw)}
  enterRef.current=()=>{if(current.phase!=='idle')return;current={...current,phase:'entering',elapsed:0};persist();sync();lastTime=0;redraw()}
  const local=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
  const down=(e:PointerEvent)=>{
   if(!e.isPrimary||e.button!==0||active!==null||!['ready','revealed'].includes(current.phase))return
   const p=local(e)
   if(current.phase==='revealed'&&!scene.hit(p.x,p.y))return
   if(current.phase==='ready'&&(p.x<.12||p.x>.88||p.y<.12))return
   e.preventDefault();active=e.pointerId;from=p;last={...p,time:e.timeStamp};startRotation=current.rotation;velocity=0;travel=0;returning=false
   try{canvas.setPointerCapture(e.pointerId)}catch{/* Synthetic contact. */}
  }
  const move=(e:PointerEvent)=>{
   if(e.pointerId!==active)return;e.preventDefault();const p=local(e)
   if(current.phase==='ready')preview=openingAmount(from,p)
   else if(current.phase==='revealed'){const angle=(p.x-last.x)*4.5;current.rotation+=angle;travel+=Math.abs(angle);velocity=bound(angle/Math.max(.016,(e.timeStamp-last.time)/1000),-1.2,1.2)}
   last={...p,time:e.timeStamp};redraw()
  }
  const end=(e:PointerEvent)=>{
   if(e.pointerId!==active)return;const canceled=e.type==='pointercancel'||e.type==='lostpointercapture'
   if(current.phase==='ready'){
    if(!canceled&&preview>=.24){current={...current,phase:'opening',elapsed:0,doorStart:preview};preview=0;persist();sync()}
    else returning=preview>0
   }else{if(canceled){current.rotation=startRotation;velocity=0}else if(travel>=.16)current.observed=true;if(reduced)velocity=0;persist()}
   active=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);lastTime=0;redraw()
  }
  const key=(e:KeyboardEvent)=>{
   if(e.key==='ArrowUp'&&current.phase==='ready'){e.preventDefault();current={...current,phase:'opening',elapsed:0,doorStart:0};persist();sync();lastTime=0;redraw()}
   if(['ArrowLeft','ArrowRight'].includes(e.key)&&current.phase==='revealed'){e.preventDefault();current.rotation+=(e.key==='ArrowRight'?1:-1)*.25;current.observed=true;persist();redraw()}
  }
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;velocity=0;persist()}else{lastTime=0;redraw()}}
  const stop=(e:Event)=>e.preventDefault()
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);canvas.addEventListener('keydown',key);canvas.addEventListener('contextmenu',stop);canvas.addEventListener('dblclick',stop);document.addEventListener('visibilitychange',visibility)
  scene.resize();sync();redraw()
  return()=>{disposed=true;cancelAnimationFrame(frameId);persist();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);canvas.removeEventListener('lostpointercapture',end);canvas.removeEventListener('keydown',key);canvas.removeEventListener('contextmenu',stop);canvas.removeEventListener('dblclick',stop);document.removeEventListener('visibilitychange',visibility)}
 },[scene,enabled])
 return{...ui,enter:()=>enterRef.current(),flush:()=>flushRef.current()}
}

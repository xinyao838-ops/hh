import {useEffect,useRef,useState,type RefObject} from 'react'
import {useWorkshop} from '../../state/WorkshopProvider'
import {shapingConfig,vesselTypes,type VesselType} from '../../config/shaping'
import {bound,initialShape,liftProgress,type ShapeDraft} from './model'
import type {ShapingScene} from './scene'
export function useShaping(canvasRef:RefObject<HTMLCanvasElement|null>,scene:ShapingScene|null,enabled:boolean){
  const {state,saveShape}=useWorkshop(),saveRef=useRef(saveShape);saveRef.current=saveShape
  const [recipe]=useState(()=>state.finalPattern!)
  const current=useRef<ShapeDraft>(state.shapeDraft??initialShape(recipe.sourceKey))
  const [type,setType]=useState(current.current.vesselType),[complete,setComplete]=useState(current.current.progress===1),[observed,setObserved]=useState(current.current.observed)
  const [message,setMessage]=useState(false)
  const selectRef=useRef<(type:VesselType)=>void>(()=>{}),finishRef=useRef<()=>void>(()=>{})
  useEffect(()=>{
    if(!scene||!enabled)return
    const canvas=canvasRef.current!
    scene.atmosphere()
    let frame=0,timer=0,velocity=0,lastTick=0,active:number|null=null,axis:'lift'|'swipe'|'rotate'|null=null
    let start={x:0,y:0},last={x:0,y:0,time:0},startDraft={...current.current},rotationTravel=0,dirty=true,disposed=false
    let settling=false,displayProgress=current.current.progress,displayType=current.current.vesselType
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const persist=()=>saveRef.current({...current.current})
    finishRef.current=()=>{velocity=0;persist()}
    const sync=()=>{setType(current.current.vesselType);setComplete(current.current.progress===1);setObserved(current.current.observed)}
    const render=(now:number)=>{
      frame=0;if(disposed||document.hidden)return
      const dt=Math.min(.05,lastTick?(now-lastTick)/1000:1/60);lastTick=now
      if(active===null&&Math.abs(velocity)>.005){current.current.rotation+=velocity*dt;velocity*=Math.exp(-5.5*dt);if(Math.abs(velocity)<=.005){velocity=0;persist()}}
      if(settling){displayProgress+=(current.current.progress-displayProgress)*(1-Math.exp(-16*dt));if(Math.abs(displayProgress-current.current.progress)<.002){displayProgress=current.current.progress;displayType=current.current.vesselType;settling=false}dirty=true}
      else {displayProgress=current.current.progress;displayType=current.current.vesselType}
      if(dirty){scene.update(displayType,displayProgress);dirty=false}
      scene.render(current.current.rotation)
      canvas.dataset.progress=String(current.current.progress);canvas.dataset.vesselType=current.current.vesselType;canvas.dataset.observed=String(current.current.observed);canvas.dataset.rotation=String(current.current.rotation)
      canvas.dataset.phase=current.current.progress===1?'formed':'forming'
      if(settling||Math.abs(velocity)>.005)frame=requestAnimationFrame(render)
    }
    const redraw=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(render)}
    const select=(type:VesselType)=>{
      if(type===current.current.vesselType)return
      active=null;velocity=0;clearTimeout(timer);setMessage(false)
      current.current={...initialShape(recipe.sourceKey),vesselType:type};settling=!reduced;dirty=true;sync();persist();redraw()
    };selectRef.current=select
    const cycle=(direction:number)=>select(vesselTypes[(vesselTypes.findIndex(v=>v.id===current.current.vesselType)+direction+vesselTypes.length)%vesselTypes.length].id)
    const formed=()=>{setComplete(true);setMessage(true);clearTimeout(timer);timer=window.setTimeout(()=>setMessage(false),1200)}
    const local=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
    const down=(e:PointerEvent)=>{
      if(!e.isPrimary||e.button!==0||active!==null)return
      const p=local(e);if(!scene.hit(p.x,p.y))return
      e.preventDefault();active=e.pointerId;start=p;last={...p,time:e.timeStamp};startDraft={...current.current};rotationTravel=0;velocity=0;axis=current.current.progress===1?'rotate':null
      try{canvas.setPointerCapture(e.pointerId)}catch{/* Synthetic or released contact. */}
    }
    const move=(e:PointerEvent)=>{
      if(e.pointerId!==active)return;e.preventDefault();const p=local(e),r=canvas.getBoundingClientRect(),dx=(p.x-start.x)*r.width,dy=(p.y-start.y)*r.height
      if(!axis&&Math.hypot(dx,dy)>7)axis=Math.abs(dy)>Math.abs(dx)*.85?'lift':'swipe'
      if(axis==='lift'){
        const progress=liftProgress(startDraft.progress,dy,r.height);current.current.progress=progress;current.current.observed=false;dirty=true;settling=false
      }else if(axis==='rotate'){
        const angle=(p.x-last.x)*4.5;current.current.rotation+=angle;rotationTravel+=Math.abs(angle)
        velocity=bound(angle/Math.max(.016,(e.timeStamp-last.time)/1000),-1.5,1.5)
      }
      last={...p,time:e.timeStamp};redraw()
    }
    const end=(e:PointerEvent)=>{
      if(e.pointerId!==active)return
      const canceled=e.type==='pointercancel'||e.type==='lostpointercapture'
      if(canceled){current.current=startDraft;velocity=0;dirty=true;sync()}
      else if(axis==='swipe'&&Math.abs(last.x-start.x)*canvas.clientWidth>38){cycle(last.x<start.x?1:-1)}
      else{
        if(axis==='lift'&&current.current.progress===1&&startDraft.progress<1)formed()
        if(axis==='rotate'&&rotationTravel>=shapingConfig.rotationThreshold){current.current.observed=true;setObserved(true)}
        if(reduced||axis!=='rotate')velocity=0
        sync();persist()
      }
      active=null;axis=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);redraw()
    }
    const key=(e:KeyboardEvent)=>{
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();velocity=0
      if(current.current.progress<1){
        if(e.key==='ArrowLeft'||e.key==='ArrowRight'){cycle(e.key==='ArrowRight'?1:-1);return}
        const previous=current.current.progress;current.current.progress=bound(previous+(e.key==='ArrowUp'?.125:-.125));dirty=true;settling=false
        if(current.current.progress===1)formed()
      }else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){current.current.rotation+=(e.key==='ArrowRight'?1:-1)*.25;current.current.observed=true}
      sync();persist();redraw()
    }
    const stop=(e:Event)=>e.preventDefault()
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;velocity=0;persist()}else{lastTick=0;redraw()}}
    scene.resize();redraw()
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);canvas.addEventListener('keydown',key)
    canvas.addEventListener('contextmenu',stop);canvas.addEventListener('dblclick',stop);document.addEventListener('visibilitychange',visibility)
    return()=>{disposed=true;cancelAnimationFrame(frame);clearTimeout(timer)
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);canvas.removeEventListener('lostpointercapture',end);canvas.removeEventListener('keydown',key);canvas.removeEventListener('contextmenu',stop);canvas.removeEventListener('dblclick',stop);document.removeEventListener('visibilitychange',visibility)
    }
  },[recipe,scene,enabled])
  return{type,complete,observed,message,select:(type:VesselType)=>selectRef.current(type),finish:()=>finishRef.current()}
}

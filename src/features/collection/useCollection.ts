import {useEffect,useRef,type RefObject} from 'react'
import {useWorkshop} from '../../state/WorkshopProvider'
import type {ShapingScene} from '../shaping/scene'
import {CollectionRotation} from './rotation'
/** Share the fired scene, and persist orientation with its existing kiln record. */
export function useCollection(canvasRef:RefObject<HTMLCanvasElement|null>,scene:ShapingScene|null,enabled:boolean){
 const {state,saveKiln,finalizeWork}=useWorkshop(),latest=useRef({state,saveKiln,finalizeWork})
 latest.current={state,saveKiln,finalizeWork}
 useEffect(()=>{if(enabled)latest.current.finalizeWork()},[enabled])
 useEffect(()=>{
  const canvas=canvasRef.current,k=latest.current.state.kilnDraft
  if(!enabled||!canvas||!scene||!k)return
  scene.atmosphere(1,0,0,.055);scene.render(k.rotation)
  const rotation=new CollectionRotation(k.rotation)
  let raf=0
  const persist=()=>{const current=latest.current.state.kilnDraft;if(current)latest.current.saveKiln({...current,rotation:rotation.angle})}
  const paint=()=>scene.render(rotation.angle)
  const glide=()=>{raf=0;const active=rotation.tick();paint();if(active)raf=requestAnimationFrame(glide);else persist()}
  const release=(id:number)=>{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id)}
  const stop=()=>{cancelAnimationFrame(raf);raf=0;const id=rotation.pointer;rotation.stop();if(id!==null)release(id);persist()}
  const down=(e:PointerEvent)=>{if(!rotation.begin(e.pointerId,e.clientX,e.isPrimary,e.button))return;e.preventDefault();cancelAnimationFrame(raf);raf=0;try{canvas.setPointerCapture(e.pointerId)}catch{/* Synthetic inputs don't own capture. */}}
  const move=(e:PointerEvent)=>{if(rotation.move(e.pointerId,e.clientX,e.timeStamp)){e.preventDefault();paint()}}
  const up=(e:PointerEvent)=>{
   if(!rotation.end(e.pointerId,e.type!=='pointerup',e.timeStamp))return
   release(e.pointerId);persist()
   if(rotation.velocity)raf=requestAnimationFrame(glide)
  }
  const key=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();stop();rotation.angle+=e.key==='ArrowLeft'?-.14:.14;paint();persist()}
  const hidden=()=>{if(document.hidden)stop()}
  canvas.dataset.collectionReady='true'
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('keydown',key)
  window.addEventListener('pagehide',stop);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hidden)
  return()=>{stop();delete canvas.dataset.collectionReady;canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.removeEventListener('keydown',key);window.removeEventListener('pagehide',stop);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden)}
 },[canvasRef,scene,enabled])
}

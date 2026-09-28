import {useEffect,useRef,type RefObject} from 'react'
import {useWorkshop} from '../../state/WorkshopProvider'
import type {ShapingScene} from '../shaping/scene'
/** Share the fired scene, and persist orientation with its existing kiln record. */
export function useCollection(canvasRef:RefObject<HTMLCanvasElement|null>,scene:ShapingScene|null,enabled:boolean){
 const {state,saveKiln,finalizeWork}=useWorkshop(),latest=useRef({state,saveKiln,finalizeWork})
 latest.current={state,saveKiln,finalizeWork}
 useEffect(()=>{if(enabled)latest.current.finalizeWork()},[enabled])
 useEffect(()=>{
  const canvas=canvasRef.current,k=latest.current.state.kilnDraft
  if(!enabled||!canvas||!scene||!k)return
  scene.atmosphere(1,0,0,.055);scene.render(k.rotation)
  let angle=k.rotation,pointer:number|null=null,x=0,velocity=0,raf=0
  const persist=()=>{const current=latest.current.state.kilnDraft;if(current)latest.current.saveKiln({...current,rotation:angle})}
  const paint=()=>scene.render(angle)
  const glide=()=>{velocity*=.91;angle+=velocity;paint();if(Math.abs(velocity)>.0004)raf=requestAnimationFrame(glide);else persist()}
  const down=(e:PointerEvent)=>{if(pointer!==null||e.button!==0)return;e.preventDefault();cancelAnimationFrame(raf);pointer=e.pointerId;x=e.clientX;velocity=0;try{canvas.setPointerCapture(pointer)}catch{/* Synthetic inputs don't own capture. */}}
  const move=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;e.preventDefault();velocity=Math.max(-.07,Math.min(.07,(e.clientX-x)*.007));angle+=(e.clientX-x)*.007;x=e.clientX;paint()}
  const up=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;pointer=null;persist();raf=requestAnimationFrame(glide)}
  const key=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();cancelAnimationFrame(raf);angle+=e.key==='ArrowLeft'?-.14:.14;paint();persist()}
  canvas.dataset.collectionReady='true'
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key)
  return()=>{cancelAnimationFrame(raf);persist();delete canvas.dataset.collectionReady;canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',key)}
 },[canvasRef,scene,enabled])
}

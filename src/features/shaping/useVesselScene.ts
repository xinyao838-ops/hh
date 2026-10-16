import {useEffect,useState,useRef,type RefObject} from 'react'
import {useWorkshop} from '../../state/WorkshopProvider'
import {recoveryShape} from './recovery'
import type {FinalPattern} from '../reveal/pattern'
import type {ShapeDraft} from './model'
import {ShapingScene} from './scene'
/** This owner stays mounted through 05 -> 06; controllers only attach inputs. */
export function useVesselScene(canvasRef:RefObject<HTMLCanvasElement|null>,recipe:FinalPattern,initial:ShapeDraft){
 const {state}=useWorkshop(),latest=useRef(state);latest.current=state
 const [scene,setScene]=useState<ShapingScene|null>(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>{
  const canvas=canvasRef.current!;let view:ShapingScene|undefined
  const restoredShape=attempt>0?recoveryShape(latest.current,recipe.sourceKey):initial
  try{view=new ShapingScene(canvas,recipe);view.resize();view.update(restoredShape.vesselType,restoredShape.progress);view.render(restoredShape.rotation)}catch{view?.dispose();setScene(null);setError(true);return}
  const activeView=view
  setScene(view);setError(false)
  const resize=()=>{if(!activeView.renderer.getContext().isContextLost()){activeView.resize();activeView.render(activeView.mesh.rotation.y)}}
  const lost=(e:Event)=>{e.preventDefault();setScene(null);setError(true)}
  const restored=()=>setAttempt(n=>n+1)
  const observer=new ResizeObserver(resize);observer.observe(canvas)
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored)
  return()=>{observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);activeView.dispose()}
 },[recipe,attempt])
 return{scene,error,retry:()=>setAttempt(n=>n+1)}
}

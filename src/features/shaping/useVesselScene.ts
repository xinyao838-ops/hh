import {useEffect,useState,type RefObject} from 'react'
import type {FinalPattern} from '../reveal/pattern'
import type {ShapeDraft} from './model'
import {ShapingScene} from './scene'
/** This owner stays mounted through 05 -> 06; controllers only attach inputs. */
export function useVesselScene(canvasRef:RefObject<HTMLCanvasElement|null>,recipe:FinalPattern,initial:ShapeDraft){
 const [scene,setScene]=useState<ShapingScene|null>(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>{
  const canvas=canvasRef.current!;let view:ShapingScene
  try{view=new ShapingScene(canvas,recipe);view.resize();view.update(initial.vesselType,initial.progress);view.render(initial.rotation)}catch{setError(true);return}
  setScene(view);setError(false)
  const resize=()=>{view.resize();view.render(view.mesh.rotation.y)}
  const lost=(e:Event)=>{e.preventDefault();setError(true)}
  const restored=()=>setAttempt(n=>n+1)
  const observer=new ResizeObserver(resize);observer.observe(canvas)
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored)
  return()=>{observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);view.dispose()}
 },[recipe,attempt])
 return{scene,error,retry:()=>setAttempt(n=>n+1)}
}

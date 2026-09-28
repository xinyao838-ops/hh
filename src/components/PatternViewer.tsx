import {useEffect,useRef,useState} from 'react'
import type {FinalPattern} from '../features/reveal/pattern'
import {drawPatternFace} from '../features/reveal/render'
import {collectionCopy as copy} from '../config/collection'
export function PatternViewer({pattern,onClose}:{pattern:FinalPattern;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),canvas=useRef<HTMLCanvasElement>(null),[zoom,setZoom]=useState(1)
 const points=useRef(new Map<number,{x:number;y:number}>()),pinch=useRef({distance:0,zoom:1}),down=useRef({x:0,y:0,moved:false})
 useEffect(()=>{
  const el=dialog.current!,previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow
  el.showModal();document.body.style.overflow='hidden'
  const c=canvas.current!,ctx=c.getContext('2d')!;drawPatternFace(ctx,pattern,{x:60,y:60,width:1480,height:1480})
  return()=>{el.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true})}
 },[pattern])
 return <dialog className="pattern-dialog" ref={dialog} onCancel={e=>{e.preventDefault();onClose()}} aria-labelledby="pattern-view-title">
  <header><h2 id="pattern-view-title">{copy.inspect}</h2><button onClick={onClose} aria-label={copy.close}>×</button></header>
  <div className="pattern-viewport" onPointerDown={e=>{e.preventDefault();try{e.currentTarget.setPointerCapture(e.pointerId)}catch{/* Capture may be unavailable for synthetic or cancelled contacts. */}points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});down.current={x:e.clientX,y:e.clientY,moved:false};if(points.current.size===2){const[a,b]=[...points.current.values()];pinch.current={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom};down.current.moved=true}}} onPointerMove={e=>{if(!points.current.has(e.pointerId))return;e.preventDefault();points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(Math.hypot(e.clientX-down.current.x,e.clientY-down.current.y)>8)down.current.moved=true;if(points.current.size===2){const[a,b]=[...points.current.values()];setZoom(Math.max(1,Math.min(2,Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.current.distance)*pinch.current.zoom)))}}} onPointerUp={e=>{if(points.current.size===1&&!down.current.moved)setZoom(z=>z>1?1:1.65);points.current.delete(e.pointerId);down.current.moved=true}} onPointerCancel={e=>{points.current.delete(e.pointerId);down.current.moved=true}}>
   <canvas ref={canvas} width={1600} height={1600} style={{transform:`scale(${zoom})`}} role="img" aria-label="本次制作的完整胎内纹样"/>
  </div><p>{copy.zoom}</p><div className="pattern-zoom"><button aria-label="缩小纹样" onClick={()=>setZoom(z=>Math.max(1,z-.25))}>−</button><button aria-label="放大纹样" onClick={()=>setZoom(z=>Math.min(2,z+.25))}>＋</button></div>
 </dialog>
}


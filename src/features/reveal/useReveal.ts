import { useEffect, useRef, useState } from 'react'
import { useWorkshop } from '../../state/WorkshopProvider'
import { revealConfig } from '../../config/reveal'
import { clamp, type Point } from '../marbling/engine'
import { createFinalPattern } from './pattern'
import { CutGesture } from './input'
import { faceRect, renderReveal } from './render'

export function useReveal() {
  const {state,saveReveal}=useWorkshop(),saveRef=useRef(saveReveal);saveRef.current=saveReveal
  const [recipe]=useState(()=>state.finalPattern??createFinalPattern(state))
  const [initiallyOpen]=useState(()=>!!state.finalPattern)
  const [opened,setOpened]=useState(initiallyOpen),[cutting,setCutting]=useState(false)
  const [firstLine,setFirstLine]=useState(initiallyOpen),[secondLine,setSecondLine]=useState(initiallyOpen),[invitation,setInvitation]=useState(initiallyOpen)
  const [retry,setRetry]=useState(false),[zoomed,setZoomed]=useState(false)
  const canvasRef=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const canvas=canvasRef.current
    if(!canvas||!recipe)return
    let disposed=false,frame=0,drawFrame=0,animationStart=0,p=initiallyOpen?1:0,isOpen=initiallyOpen,isCutting=false
    let cutX:number=revealConfig.cutX
    let zoom=1,pan:Point={x:0,y:0},retryShown=false,mode:'cut'|'inspect'|'pinch'|null=null
    let startPoint:Point={x:0,y:0},lastPoint:Point={x:0,y:0},moved=false,pinchDistance=1,pinchZoom=1
    const touches=new Map<number,Point>(),cut=new CutGesture(),timers:number[]=[]
    const later=(callback:()=>void,delay:number)=>timers.push(window.setTimeout(()=>{if(!disposed)callback()},delay))
    const draw=()=>{
      drawFrame=0
      const r=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,3)
      const w=Math.max(1,r.width),h=Math.max(1,r.height)
      if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
      const ctx=canvas.getContext('2d')!;ctx.setTransform(ratio,0,0,ratio,0,0)
      renderReveal(ctx,recipe,w,h,{progress:p,cutX,trace:mode==='cut'?cut.points:[],zoom,pan,showGuide:!isCutting&&!isOpen})
      canvas.dataset.phase=isOpen?'revealed':isCutting?'cutting':'uncut'
      canvas.dataset.sourceKey=recipe.sourceKey;canvas.dataset.materialColors=recipe.colors.join(',')
      canvas.dataset.cutX=String(cutX);canvas.dataset.animationProgress=String(p);canvas.dataset.zoom=String(zoom)
    }
    const redraw=()=>{if(!drawFrame)drawFrame=requestAnimationFrame(draw)}
    const complete=()=>{
      p=1;isOpen=true;isCutting=false;setOpened(true);setCutting(false);draw();saveRef.current(recipe)
      // Let the fully opened face remain wordless before the two lines appear.
      later(()=>setFirstLine(true),revealConfig.firstLineDelay)
      later(()=>setSecondLine(true),revealConfig.secondLineDelay)
      later(()=>setInvitation(true),revealConfig.invitationDelay)
    }
    const open=()=>{
      if(isCutting||isOpen)return
      mode=null;touches.clear();setRetry(false);isCutting=true;setCutting(true);animationStart=performance.now()
      try{if(typeof navigator.vibrate==='function')navigator.vibrate(8)}catch{/* Optional. */}
      const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?180:revealConfig.duration
      const tick=(now:number)=>{
        p=clamp((now-animationStart)/duration);draw()
        if(p<1)frame=requestAnimationFrame(tick);else{frame=0;complete()}
      };frame=requestAnimationFrame(tick)
    }
    const local=(event:PointerEvent)=>{const r=canvas.getBoundingClientRect();return{x:clamp((event.clientX-r.left)/r.width),y:clamp((event.clientY-r.top)/r.height)}}
    const distance=()=>{const[a,b]=[...touches.values()];return Math.hypot((a.x-b.x)*canvas.clientWidth,(a.y-b.y)*canvas.clientHeight)}
    const toggleZoom=()=>{zoom=zoom>1?1:1.85;pan={x:0,y:0};setZoomed(zoom>1);redraw()}
    const down=(event:PointerEvent)=>{
      if(event.button!==0||isCutting)return
      const point=local(event)
      if(!isOpen){
        if(!event.isPrimary||!cut.begin(event.pointerId,point))return
        mode='cut';cutX=clamp(point.x,.177,.793)
      }else{
        if(touches.size>=2)return
        touches.set(event.pointerId,point)
        if(touches.size===2){mode='pinch';pinchDistance=Math.max(1,distance());pinchZoom=zoom;moved=true}
        else{mode='inspect';startPoint=point;lastPoint=point;moved=false}
      }
      event.preventDefault();try{canvas.setPointerCapture(event.pointerId)}catch{/* Contact may have ended. */}redraw()
    }
    const move=(event:PointerEvent)=>{
      const point=local(event)
      if(mode==='cut'&&cut.active===event.pointerId){event.preventDefault();cut.move(event.pointerId,point);cutX=clamp(cut.position,.177,.793);redraw()}
      else if(touches.has(event.pointerId)){
        event.preventDefault();touches.set(event.pointerId,point)
        if(mode==='pinch'&&touches.size===2){zoom=clamp(pinchZoom*distance()/pinchDistance,1,revealConfig.maxZoom);setZoomed(zoom>1.02)}
        else if(mode==='inspect'){
          moved ||= Math.hypot(point.x-startPoint.x,point.y-startPoint.y)>.018
          if(zoom>1){pan.x=clamp(pan.x+point.x-lastPoint.x,-.30*(zoom-1),.30*(zoom-1));pan.y=clamp(pan.y+point.y-lastPoint.y,-.28*(zoom-1),.28*(zoom-1))}
          lastPoint=point
        }
        if(zoom<=1.02)pan={x:0,y:0};redraw()
      }
    }
    const end=(event:PointerEvent)=>{
      const cancelled=event.type==='pointercancel'||event.type==='lostpointercapture'
      if(mode==='cut'&&cut.active===event.pointerId){
        if(!cancelled)cut.move(event.pointerId,local(event))
        const success=cut.finish(event.pointerId,cancelled);mode=null
        if(success){cutX=cut.position;open()}
        else if(!cancelled&&!retryShown){retryShown=true;setRetry(true);later(()=>setRetry(false),1800)}
        redraw()
      }else if(touches.has(event.pointerId)){
        const wasPinch=mode==='pinch';touches.delete(event.pointerId)
        if(!cancelled&&!moved&&!wasPinch){
          const point=local(event),r=faceRect(1,1)
          if(zoom>1||(point.x>=r.x&&point.x<=r.x+r.width&&point.y>=r.y&&point.y<=r.y+r.height))toggleZoom()
        }
        if(touches.size===1){lastPoint=[...touches.values()][0];mode='inspect';moved=true}
        else mode=null
      }
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId)
    }
    const keyboard=(event:KeyboardEvent)=>{
      if(!isOpen){if(event.key==='ArrowDown'){event.preventDefault();open()}return}
      if(['Enter',' ','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))event.preventDefault()
      if(event.key==='Enter'||event.key===' ')toggleZoom()
      if(event.key==='Escape'){zoom=1;pan={x:0,y:0};setZoomed(false)}
      if(zoom>1){if(event.key==='ArrowLeft')pan.x-=.035;if(event.key==='ArrowRight')pan.x+=.035;if(event.key==='ArrowUp')pan.y-=.035;if(event.key==='ArrowDown')pan.y+=.035;pan.x=clamp(pan.x,-.3,.3);pan.y=clamp(pan.y,-.28,.28)}
      redraw()
    }
    const stop=(event:Event)=>event.preventDefault()
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end)
    canvas.addEventListener('keydown',keyboard);canvas.addEventListener('contextmenu',stop);canvas.addEventListener('dblclick',stop)
    const observer=new ResizeObserver(redraw);observer.observe(canvas);draw()
    return()=>{disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(drawFrame);timers.forEach(clearTimeout);observer.disconnect()
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);canvas.removeEventListener('lostpointercapture',end)
      canvas.removeEventListener('keydown',keyboard);canvas.removeEventListener('contextmenu',stop);canvas.removeEventListener('dblclick',stop)
    }
  },[recipe,initiallyOpen])
  return {canvasRef,opened,cutting,firstLine,secondLine,invitation,retry,zoomed,recipe}
}

import {useEffect,useRef,useState} from 'react'
import {craftMedia,type CraftStage} from '../config/craftMedia'
import '../styles/craft-reference.css'
/** A read-only reference. Deliberately has no workshop state or save callback. */
export function CraftReference({stage,disabled=false}:{stage:CraftStage;disabled?:boolean}){
 const item=craftMedia[stage],dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null),trigger=useRef<HTMLButtonElement>(null)
 const [open,setOpen]=useState(false),[playing,setPlaying]=useState(false),[failed,setFailed]=useState(false)
 useEffect(()=>{
  if(!open)return
  const d=dialog.current!,old=document.body.style.overflow
  d.showModal();document.body.style.overflow='hidden'
  return()=>{const v=video.current;if(v){v.pause();v.removeAttribute('src');v.load()}d.close();document.body.style.overflow=old;trigger.current?.focus({preventScroll:true})}
 },[open])
 const close=()=>{const v=video.current;if(v){v.pause();v.removeAttribute('src');v.load()}setOpen(false);setPlaying(false);setFailed(false)}
 return <>
  <button ref={trigger} className="craft-reference" disabled={disabled} onClick={()=>setOpen(true)}><span>{item.title}</span><small>真实工艺 ↗</small></button>
  {open&&<dialog ref={dialog} className="craft-dialog" onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close()}} aria-labelledby="craft-reference-title">
   <section><div className="craft-eyebrow">金谷轩 · 真实工艺影像</div><header><h2 id="craft-reference-title">{item.heading}</h2><button onClick={close} aria-label="关闭工艺对照">×</button></header>
   <div className="craft-film">{failed?<><img className="craft-fallback" src={item.poster} alt="真实工艺影像封面"/><div className="craft-failure" role="status">影像暂时没有加载出来。<br/>你的纹还在，可以继续制作。<button onClick={()=>{setFailed(false);setPlaying(false)}}>重试</button></div></>:<><video ref={video} poster={item.poster} src={playing?item.video:undefined} controls={playing} muted playsInline preload="none" aria-label={item.heading} onError={()=>setFailed(true)}/>{!playing&&<button className="craft-play" onClick={()=>{setPlaying(true);requestAnimationFrame(()=>video.current?.play().catch(()=>setFailed(true)))}}>播放真实工艺 ▷</button>}</>}</div>
   <p>{item.description}</p><small>{item.source}</small><button className="craft-return" onClick={close}>继续我的这一纹 →</button>
   </section>
  </dialog>}
 </>
}

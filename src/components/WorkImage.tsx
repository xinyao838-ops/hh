import {useState} from 'react'
/** Network failure retains a small, genuine frame rather than an unexplained black box. */
export function WorkImage({src,preview,alt}:{src:string;preview:string;alt:string}){
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading'),[attempt,setAttempt]=useState(0)
 return <div className="work-image" data-status={status}>
  <img className="work-image-preview" src={preview} alt={status==='ready'?'':`${alt}（低清预览）`} width="64" height="80" aria-hidden={status==='ready'}/>
  {status!=='failed'&&<img key={attempt} className="work-image-full" loading="eager" decoding="sync" src={src} alt={alt} width="640" height="800" onLoad={()=>setStatus('ready')} onError={()=>setStatus('failed')}/>}
  {status!=='ready'&&<div className="work-image-status" role="status">{status==='failed'?<>高清图片暂未加载，先看预览。<button type="button" onClick={()=>{setStatus('loading');setAttempt(a=>a+1)}}>重新加载</button></>:'正在加载高清图'}</div>}
 </div>
}

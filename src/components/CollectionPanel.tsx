import {useEffect,useRef,useState} from 'react'
import {useWorkshop} from '../state/WorkshopProvider'
import {collectionConfig,collectionCopy as copy} from '../config/collection'
import {vesselTypes} from '../config/shaping'
import {navigate} from '../config/routes'
import {displayNumber,localDate} from '../features/collection/model'
import {createPatternCard} from '../features/collection/card'
import type {ShapingScene} from '../features/shaping/scene'
import {ArrowIcon} from './ArrowIcon'
import {PatternViewer} from './PatternViewer'
export function CollectionPanel({scene,error}:{scene:ShapingScene|null;error:boolean}){
 const {state,storageAvailable,archiveAndRestart}=useWorkshop(),[card,setCard]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[viewer,setViewer]=useState(false)
 const mounted=useRef(true),preview=useRef<HTMLElement>(null)
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 useEffect(()=>()=>{if(card)URL.revokeObjectURL(card)},[card])
 const generate=async()=>{if(!scene||busy||error)return;setBusy(true);setMessage('');try{const blob=await createPatternCard(state,scene);if(mounted.current){setCard(URL.createObjectURL(blob));window.setTimeout(()=>preview.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}),80)}}catch{if(mounted.current)setMessage(copy.exportError)}finally{if(mounted.current)setBusy(false)}}
 return <div className="collection-content">
  <p className="collection-caption">{copy.caption}</p>
  <section className="pattern-archive" aria-labelledby="archive-title"><h2 id="archive-title">{copy.archive}</h2><dl>
   <div className="archive-number"><dt>{copy.number}</dt><dd data-experience-id={state.experienceId}>{displayNumber(state.experienceId)}</dd></div>
   <div><dt>{copy.clays}</dt><dd>{state.selectedClays.map(c=>c.name).join(' × ')}</dd></div><div><dt>{copy.vessel}</dt><dd>{vesselTypes.find(v=>v.id===state.vesselType)?.name}</dd></div>
   <div><dt>{copy.date}</dt><dd>{localDate(state.createdAt)}</dd></div><div><dt>{copy.method}</dt><dd>{copy.methodValue}</dd></div>
  </dl><p className="archive-disclaimer">{copy.disclaimer}</p></section>
  <button className="start-twisting generate-card" disabled={!scene||busy||error} onClick={generate}><span>{busy?copy.generating:copy.generate}</span><ArrowIcon/></button>
  {card&&<section ref={preview} className="card-preview" aria-label="我的纹卡预览"><img src={card} alt="我的这一纹：包含金谷轩文字标识、本次器物、体验纹号、泥色和器型的竖版纹卡" width={1080} height={1440}/><a className="save-card" href={card} download={`${state.experienceId}-我的这一纹.png`} onClick={()=>setMessage(copy.downloaded)}>{copy.save}<span aria-hidden="true">↓</span></a><p>{copy.longPress}</p></section>}
  <button className="collection-text inspect-pattern" onClick={()=>setViewer(true)}>{copy.inspect}<span aria-hidden="true">↗</span></button>
  <p className="collection-status" role="status">{message||(!storageAvailable?copy.storageError:'')}</p>
  <section className="brand-invitation"><span aria-hidden="true">金谷轩</span><h2>{copy.brandTitle}</h2><p>{copy.brandBody}</p>{collectionConfig.brandProductUrl?<a href={collectionConfig.brandProductUrl} target="_blank" rel="noopener noreferrer">{copy.brandButton}<ArrowIcon/></a>:<button onClick={()=>navigate('brand')}>{copy.brandButton}<ArrowIcon/></button>}</section>
  <footer className="collection-footer"><button className="collection-text restart-work" onClick={()=>{if(archiveAndRestart())navigate('clay');else setMessage(copy.storageError)}}>{copy.restart}<span aria-hidden="true">↻</span></button><p>{copy.restartHint}</p></footer>
  {viewer&&<PatternViewer pattern={state.finalPattern!} onClose={()=>setViewer(false)}/>}
 </div>
}

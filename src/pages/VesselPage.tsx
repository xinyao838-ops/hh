import {useRef,useState} from 'react'
import {ArrowIcon} from '../components/ArrowIcon'
import {brand} from '../config/brand'
import {shapingCopy as shapeCopy,vesselTypes} from '../config/shaping'
import {kilnCopy} from '../config/kiln'
import {navigate} from '../config/routes'
import {useWorkshop} from '../state/WorkshopProvider'
import {initialShape} from '../features/shaping/model'
import {useVesselScene} from '../features/shaping/useVesselScene'
import {useShaping} from '../features/shaping/useShaping'
import {useKiln} from '../features/kiln/useKiln'
import {useCollection} from '../features/collection/useCollection'
import {CollectionPanel} from '../components/CollectionPanel'
import {collectionCopy} from '../config/collection'
/** A stable component and canvas on both routes: no renderer or mesh swap. */
export default function VesselPage({phase}:{phase:'shape'|'kiln'|'collection'}){
 const {state}=useWorkshop(),[recipe]=useState(()=>state.finalPattern!),[initial]=useState(()=>state.shapeDraft??initialShape(recipe.sourceKey))
 const canvasRef=useRef<HTMLCanvasElement>(null),mainRef=useRef<HTMLElement>(null)
 const {scene,error,retry}=useVesselScene(canvasRef,recipe,initial)
 const isKiln=phase==='kiln',isCollection=phase==='collection',shape=useShaping(canvasRef,scene,phase==='shape'&&!error),kiln=useKiln(canvasRef,mainRef,scene,isKiln&&!error)
 useCollection(canvasRef,scene,isCollection&&!error)
 const swiped=useRef(false),swipe=useRef<number|null>(null),selected=vesselTypes.find(v=>v.id===shape.type)!,copy=isCollection?collectionCopy:isKiln?kilnCopy:shapeCopy
 const back=()=>{if(isCollection){navigate('kiln')}else if(isKiln){kiln.flush();navigate('shape')}else{shape.finish();navigate('reveal')}}
 return <main ref={mainRef} className={`workshop shape-page${isKiln?' kiln-page phase-'+kiln.phase:isCollection?' collection-page':''}`} data-pattern-key={recipe.sourceKey}>
  <header className="clay-page-header"><button className="clay-back" aria-label={copy.back} onClick={back}><ArrowIcon back/></button><p>{copy.step}</p><span>{brand.name}</span></header>
  <header className="shape-heading"><h1 tabIndex={-1}>{copy.title}</h1><p>{copy.subtitle}</p></header>
  <section className={`shape-workspace${isKiln?' kiln-workspace':''}`} aria-label={isCollection?'我的这一纹成品':isKiln?'入窑工作台':'塑器工作台'}>
   {isKiln&&<div className="kiln-chamber" aria-hidden="true"><div className="kiln-ember"/></div>}
   <canvas ref={canvasRef} className={`shape-canvas${isKiln?' kiln-canvas':''}`} tabIndex={0} role="application" aria-label={copy.canvas}/>
   {isKiln&&<div className="kiln-mouth" aria-hidden="true"><div className="kiln-door"><div className="door-upper"/><div className="door-lower"><i/></div></div><div className="kiln-arch-rim"/></div>}
   {error&&<div className="shape-error" role="status"><p>{shapeCopy.unavailable}</p><button onClick={retry}>{shapeCopy.retry}</button></div>}
  </section>
  {isCollection?<CollectionPanel scene={scene} error={error}/>:isKiln?<>
   <div className="kiln-feedback" aria-live="polite">
    {kiln.status&&<p className="kiln-status" key={kiln.status}>{kiln.status}</p>}
    {kiln.phase==='ready'&&<p className="kiln-gesture">{kilnCopy.open}<span aria-hidden="true">↑</span></p>}
    <p className={`kiln-result${kiln.first?' is-visible':''}`}>{kiln.first?kilnCopy.first:''}</p>
    <p className={`kiln-result-small${kiln.second?' is-visible':''}`}>{kiln.second?kilnCopy.second:''}</p>
    {kiln.second&&<p className="kiln-inspect">{kilnCopy.turn}</p>}
   </div>
   <footer className="shape-footer kiln-footer">{kiln.phase==='idle'&&!error&&<button className="start-twisting" onClick={kiln.enter}><span>{kilnCopy.enter}</span><ArrowIcon/></button>}{kiln.collect&&!error&&<button className="start-twisting" onClick={()=>{kiln.flush();navigate('collection')}}><span>{kilnCopy.next}</span><ArrowIcon/></button>}</footer>
  </>:<>
   <div className="shape-feedback" aria-live="polite"><p className={`shape-formed${shape.message?' is-visible':''}`}>{shape.complete?shapeCopy.formed:''}</p><p className="shape-instruction">{shape.complete?shapeCopy.turn:shapeCopy.lift}</p></div>
   <section className="vessel-selection" aria-label="选择器型" onPointerDown={e=>{swiped.current=false;swipe.current=e.clientX}} onPointerUp={e=>{if(swipe.current!==null&&Math.abs(e.clientX-swipe.current)>38){swiped.current=true;const i=vesselTypes.findIndex(v=>v.id===shape.type);shape.select(vesselTypes[(i+(e.clientX<swipe.current?1:2))%3].id)}swipe.current=null}} onPointerCancel={()=>{swipe.current=null}}>
    <svg className="vessel-outline" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d={selected.outline}/></svg>
    <div className="vessel-names">{vesselTypes.map(v=><button key={v.id} type="button" className={shape.type===v.id?'is-selected':''} aria-pressed={shape.type===v.id} onClick={e=>{if(e.detail===0||!swiped.current)shape.select(v.id)}}>{v.name}</button>)}</div><p>{shapeCopy.switch}</p>
   </section>
   <footer className="shape-footer">{shape.complete&&shape.observed&&!error&&<button className="start-twisting" onClick={()=>{shape.finish();navigate('kiln')}}><span>{shapeCopy.next}</span><ArrowIcon/></button>}</footer>
  </>}
 </main>
}

import { ArrowIcon } from '../components/ArrowIcon'
import { brand } from '../config/brand'
import { revealCopy as copy } from '../config/reveal'
import { marblingCopy } from '../config/marbling'
import { navigate } from '../config/routes'
import { useWorkshop } from '../state/WorkshopProvider'
import { useReveal } from '../features/reveal/useReveal'
export function RevealPage(){
  const {storageAvailable}=useWorkshop()
  const {canvasRef,opened,cutting,firstLine,secondLine,invitation,retry,zoomed}=useReveal()
  return <main className="workshop reveal-page">
    <header className="clay-page-header"><button className="clay-back" type="button" aria-label={copy.back} onClick={()=>navigate('twist')}><ArrowIcon back/></button><p>{copy.step}</p><span>{brand.name}</span></header>
    <header className="reveal-heading"><h1 tabIndex={-1}>{copy.title}</h1><p>{copy.subtitle}</p></header>
    <section className={`reveal-workspace${opened?' is-open':''}`} aria-label="开纹工作台">
      <canvas ref={canvasRef} className="reveal-canvas" tabIndex={0} role="button" aria-label={opened?copy.openedCanvas:copy.canvas} aria-disabled={cutting}/>
      <p className="cut-guide" aria-live="polite">{!opened&&!cutting&&(retry?copy.retry:copy.guide)}</p>
    </section>
    <div className="reveal-words" aria-live="polite"><p className={firstLine?'is-visible':''}>{firstLine?copy.first:''}</p><p className={secondLine?'is-visible':''}>{secondLine?copy.second:''}</p></div>
    <p className="inspect-hint">{secondLine?(zoomed?copy.restore:copy.inspect):''}</p>
    {!storageAvailable&&<p className="reveal-storage" role="status">{marblingCopy.storage}</p>}
    <footer className="reveal-footer">{invitation&&<button className="start-twisting" type="button" onClick={()=>navigate('shape')}><span>{copy.next}</span><ArrowIcon/></button>}</footer>
  </main>
}

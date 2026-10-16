import { useRef } from 'react'
import { ArrowIcon } from '../components/ArrowIcon'
import { brand } from '../config/brand'
import { marblingConfig, marblingCopy as copy } from '../config/marbling'
import { navigate } from '../config/routes'
import { useMarbling } from '../features/marbling/useMarbling'
import { useWorkshop } from '../state/WorkshopProvider'

export function TwistPage() {
  const leaving=useRef(false)
  const { state, storageAvailable } = useWorkshop()
  const { canvasRef, progress, animating, interacting, fusionNotice, full, act, finish,canUndo,canRedo,undo,redo } = useMarbling()
  return <main className="workshop twist-page">
    <header className="clay-page-header"><button className="clay-back" type="button" aria-label={copy.back} onClick={() => navigate('clay')}><ArrowIcon back /></button><p>{copy.step}</p><span>{brand.name}</span></header>
    <header className="twist-heading"><h1 tabIndex={-1}>{copy.title}</h1><p>{copy.hint}</p></header>
    <section className="twist-workspace" aria-label="陶泥工作台">
      <div className="twist-clay-names">{state.selectedClays.map((clay, i) => <span key={clay.id}>{i > 0 && <i aria-hidden="true"> / </i>}{clay.name}</span>)}</div>
      <canvas ref={canvasRef} className="twist-canvas" aria-label="拖动揉拉，长按压合的两色陶泥；也可使用下方轻绞和折合控件" />
    </section>
    <div className="fusion-notice" role="status" aria-live="polite">{fusionNotice && <span>{copy.fused}</span>}</div>
    {!storageAvailable && <p className="twist-storage" role="status">{copy.storage}</p>}
    <div className="craft-actions" aria-label="辅助揉泥动作">
      <button type="button" disabled={animating || full || progress.twistCount >= marblingConfig.maxTwists} onClick={() => act('twist')}>{copy.twist}</button>
      <span aria-hidden="true">·</span>
      <button type="button" disabled={animating || full || progress.foldCount >= marblingConfig.maxFolds} onClick={() => act('fold')}>{copy.fold}</button>
    </div>
    <div className="history-actions" aria-label="修改上一步操作">
      <button type="button" disabled={animating||interacting||!canUndo} onClick={undo}>撤销</button>
      <span aria-hidden="true">·</span>
      <button type="button" disabled={animating||interacting||!canRedo} onClick={redo}>重做</button>
    </div>
    <footer className="twist-footer">{progress.ready && <button type="button" className="start-twisting" disabled={animating||interacting} onClick={() => { if (leaving.current) return; leaving.current=true; if (finish()) navigate('reveal'); else leaving.current=false }}><span>{copy.finish}</span><ArrowIcon /></button>}</footer>
  </main>
}

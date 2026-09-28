import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { ArrowIcon } from '../components/ArrowIcon'
import { ClayLump } from '../components/ClayLump'
import { GuideCharacter } from '../components/GuideCharacter'
import { brand } from '../config/brand'
import { clayCopy, clayMaterials, type ClayId } from '../config/clays'
import { navigate } from '../config/routes'
import { useWorkshop } from '../state/WorkshopProvider'

type Arrival = { x: number; y: number; scale: number }
export function ClayPage() {
  const { state: { selectedClays, operationLog }, selectClay } = useWorkshop()
  const [notice, setNotice] = useState('')
  const [arrivals, setArrivals] = useState<Partial<Record<ClayId, Arrival>>>({})
  const slots = useRef<(HTMLDivElement | null)[]>([])
  const count = selectedClays.length
  const message = notice || (count === 2 ? clayCopy.ready : count === 1 ? clayCopy.first : clayCopy.initial)
  const choose = (id: ClayId, event: MouseEvent<HTMLButtonElement>) => {
    const existing = selectedClays.some(clay => clay.id === id)
    if (!existing && count === 2) { setNotice(clayCopy.full); return }
    setNotice('')
    if (existing) setArrivals({})
    else {
      const source = event.currentTarget.querySelector('svg')?.getBoundingClientRect()
      const target = slots.current[count]?.getBoundingClientRect()
      if (source && target) setArrivals(previous => ({ ...previous, [id]: {
        x: source.x + source.width / 2 - target.x - target.width / 2,
        y: source.y + source.height / 2 - target.y - target.height / 2, scale: source.width / target.width,
      } }))
    }
    selectClay(id)
  }
  const remove = (id: ClayId) => { setNotice(''); setArrivals({}); selectClay(id) }
  return <main className="workshop clay-page">
    <header className="clay-page-header">
      <button type="button" className="clay-back" aria-label={clayCopy.back} onClick={() => navigate('entrance')}><ArrowIcon back /></button>
      <p>{clayCopy.step}</p><span>{brand.name}</span>
    </header>
    <div className="clay-making-area">
      <header className="clay-page-heading"><h1 tabIndex={-1}>{clayCopy.title}</h1><p>{clayCopy.intro}</p></header>
      <section className="making-table" aria-label={clayCopy.table}>
        <div className="table-caption"><span>{clayCopy.table}</span><span>{clayCopy.count} <b>{count}</b> / 2</span></div>
        <div className="table-surface">
          {[0, 1].map(index => {
            const clay = selectedClays[index]
            const arrival = clay && arrivals[clay.id]
            const style = arrival ? { '--from-x': `${arrival.x}px`, '--from-y': `${arrival.y}px`, '--from-scale': arrival.scale } as CSSProperties : undefined
            return <div className="table-slot" key={index}>
              <div className="table-clay-art" ref={element => { slots.current[index] = element }}>
                {clay ? <button type="button" key={clay.id} className={`placed-clay${arrival ? ' is-arriving' : ''}`} style={style} aria-label={`${clayCopy.remove}${clay.name}`} onClick={() => remove(clay.id)} onAnimationEnd={() => setArrivals(previous => ({ ...previous, [clay.id]: undefined }))}>
                  <ClayLump clay={clay} />
                </button> : <div className="empty-clay-imprint" aria-hidden="true" />}
              </div>
              <span className={`table-slot-label${clay ? ' is-filled' : ''}`}>{clay ? clay.name : clayCopy.slots[index]}</span>
            </div>
          })}
        </div>
      </section>
      <GuideCharacter message={message} />
      <section className="clay-palette" aria-label="选择两种数字体验泥料">
        {clayMaterials.map(clay => {
          const selected = selectedClays.some(item => item.id === clay.id)
          return <button type="button" key={clay.id} className={`clay-choice${selected ? ' is-selected' : ''}`} aria-label={clay.name} aria-pressed={selected} aria-describedby={`clay-${clay.id}-description`} onClick={event => choose(clay.id, event)}>
            <ClayLump clay={clay} /><span className="clay-choice-name">{clay.name}</span>
            <span className="clay-choice-status">{selected ? clayCopy.selected : '\u00a0'}</span>
            <span className="visually-hidden" id={`clay-${clay.id}-description`}>{clay.description}</span>
          </button>
        })}
      </section>
      <p className="clay-palette-hint">{operationLog.length ? clayCopy.changeWarning : clayCopy.hint}</p>
    </div>
    <footer className="clay-actions">
      <button type="button" className="start-twisting" disabled={count !== 2} onClick={() => navigate('twist')}><span>{clayCopy.next}</span><ArrowIcon /></button>
      <p>{clayCopy.disclaimer}</p>
    </footer>
  </main>
}

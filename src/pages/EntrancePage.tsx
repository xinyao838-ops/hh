import { ArrowIcon } from '../components/ArrowIcon'
import { ClaySectionArtwork } from '../components/ClaySectionArtwork'
import { EntranceProgress } from '../components/EntranceProgress'
import { WorkshopIdentity } from '../components/WorkshopIdentity'
import { brand } from '../config/brand'

export function EntrancePage({ onEnter, entering }: { onEnter: () => void; entering: boolean }) {
  return (
    <main className={`workshop entrance-page${entering ? ' is-entering' : ''}`} aria-busy={entering}>
      <WorkshopIdentity brandOwned />
      <div className="entrance-composition">
        <header className="entrance-heading">
          <h1 tabIndex={-1}>{brand.title}<span className="title-stamp" aria-hidden="true">入坊</span></h1>
          <p className="subtitle"><strong>{brand.name}</strong><span>{brand.workshopName}</span></p>
        </header>
        <div className="artwork-stage">
          <span className="artwork-note artwork-note--left">{brand.artworkLabels[0]}</span>
          <ClaySectionArtwork />
          <span className="artwork-note artwork-note--right">{brand.artworkLabels[1]}</span>
        </div>
        <section className="entry-action" aria-label="进入数字绞胎工坊">
          <p className="core-copy">{brand.description[0]}<br /><span>{brand.description[1]}</span></p>
          <button type="button" className="primary-button" onClick={onEnter} disabled={entering}>
            <svg className="button-clay-mark" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 6c6-4 10 5 16 1M3 11c6-4 10 5 16 1M3 16c6-4 10 5 16 1" stroke="currentColor" strokeWidth="1.2" /></svg>
            <span>{brand.entry}</span><ArrowIcon />
          </button>
        </section>
      </div>
      <footer className="journey-footer"><EntranceProgress /></footer>
    </main>
  )
}

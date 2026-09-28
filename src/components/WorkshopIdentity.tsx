import { brand } from '../config/brand'

export function WorkshopIdentity({ brandOwned = false }: { brandOwned?: boolean }) {
  return (
    <div className="workshop-identity">
      <div className="identity-name"><span className="brand-seal" aria-hidden="true">{brandOwned ? '金' : '绞'}</span><span>{brand.name}</span></div>
      <span className="identity-edition">{brand.edition}</span>
    </div>
  )
}

import {heritageContent,publishableHeritage} from '../config/heritage'
import {WorkImage} from './WorkImage'
import {workPreviews} from '../config/workPreviews'
import {exhibitionImages} from '../config/exhibition'
/** Enterprise photography is never substituted for the user's generated work. */
export function RealWorksGallery(){
 const items=publishableHeritage(heritageContent).filter(item=>item.id.startsWith('m0'))
 return <div className="real-works"><div className="real-works-pair">{items.map(item=><figure key={item.id}><WorkImage src={item.src} preview={workPreviews[item.id]} alt={item.alt}/><figcaption><strong>{item.title}</strong></figcaption></figure>)}</div><figure className="real-works-group"><img loading="lazy" decoding="async" src={exhibitionImages.group.src} alt={exhibitionImages.group.alt} width="800" height="600"/><figcaption>金谷轩 · 器物群像</figcaption></figure></div>
}

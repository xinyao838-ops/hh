import {heritageContent,publishableHeritage} from '../config/heritage'
import {exhibitionImages} from '../config/exhibition'
/** Enterprise photography is never substituted for the user's generated work. */
export function RealWorksGallery(){
 const items=publishableHeritage(heritageContent).filter(item=>item.id.startsWith('m0'))
 return <div className="real-works"><p className="real-works-label">企业实拍作品 · 与你的数字作品分别展示</p><div className="real-works-pair">{items.map(item=><figure key={item.id}><img loading="lazy" decoding="async" src={item.src} alt={item.alt} width="1200" height="675"/><figcaption><strong>{item.title}</strong><small>企业提供影像 · 名称沿用片名</small></figcaption></figure>)}</div><figure className="real-works-group"><img loading="lazy" decoding="async" src={exhibitionImages.group.src} alt={exhibitionImages.group.alt} width="800" height="600"/><figcaption>金谷轩 · 器物群像<br/><small>企业提供照片</small></figcaption></figure></div>
}

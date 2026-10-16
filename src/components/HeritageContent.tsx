import {heritageContent,publishableHeritage} from '../config/heritage'
import {collectionCopy as copy} from '../config/collection'
export function HeritageContent(){
 const items=publishableHeritage(heritageContent)
 if(!items.length)return <section><h1 tabIndex={-1}>{copy.brandPlaceholder}</h1><p>{copy.brandPending}</p></section>
 return <section><h1 tabIndex={-1}>走近真实的绞胎瓷</h1>{items.map(item=><figure key={item.id}>
  {item.kind==='video'?<video controls playsInline preload="none" aria-label={item.alt} src={item.src}/>:<img loading="lazy" src={item.src} alt={item.alt}/>}
  <figcaption><h2>{item.title}</h2><p>{item.caption}</p><small>来源：{item.source}</small></figcaption>
 </figure>)}</section>
}

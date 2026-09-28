import {collectionCopy as copy} from '../config/collection'
import {navigate} from '../config/routes'
export function BrandWorksPlaceholderPage(){return <main className="workshop brand-placeholder"><p>金谷轩 · 真实作品</p><section><h1 tabIndex={-1}>{copy.brandPlaceholder}</h1><p>{copy.brandPending}</p></section><button className="collection-text" onClick={()=>navigate('collection')}>{copy.brandReturn}</button></main>}

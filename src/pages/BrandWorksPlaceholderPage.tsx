import {collectionCopy as copy} from '../config/collection'
import {navigate} from '../config/routes'
import {HeritageContent} from '../components/HeritageContent'
export function BrandWorksPlaceholderPage(){return <main className="workshop brand-placeholder"><p>金谷轩 · 真实作品</p><HeritageContent/><button className="collection-text" onClick={()=>navigate('collection')}>{copy.brandReturn}</button></main>}

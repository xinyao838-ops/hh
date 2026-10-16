/** Fill only from supplied, verified materials; never infer brand craft facts. */
export interface HeritageItem {
 id:string
 title:string
 kind:'image'|'video'
 src:string
 alt:string
 caption:string
 source:string
 authorization:string
 factChecked:boolean
 publication:'placeholder'|'cleared'
}
export const heritageContent:HeritageItem[]=[{id:'jgx-ppt38',title:'金谷轩 · 器物影像',kind:'image',src:'/media/works/jgx-ppt38.jpg',alt:'企业提供的金谷轩器物实拍照片',caption:'真实作品影像，与这一纹的数字体验相互对照。具体产品名称与价格暂不标注。',source:'企业提供《金谷轩绞胎瓷(1)》第38页',authorization:'用户2026-10-17明确许可用于07真实作品展示，不标产品名或价格',factChecked:true,publication:'cleared'}]
export function publishableHeritage(items:HeritageItem[]){
 return items.filter(item=>item.publication==='cleared'&&item.factChecked
  &&item.source.trim()&&item.authorization.trim()&&item.alt.trim()
  &&/^\/media\/[a-zA-Z0-9/_\-.]+$/.test(item.src)&&!item.src.includes('..')
  &&['image','video'].includes(item.kind))
}

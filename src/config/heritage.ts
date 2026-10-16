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
export const heritageContent:HeritageItem[]=[]
export function publishableHeritage(items:HeritageItem[]){
 return items.filter(item=>item.publication==='cleared'&&item.factChecked
  &&item.source.trim()&&item.authorization.trim()&&item.alt.trim()
  &&/^\/media\/[a-zA-Z0-9/_\-.]+$/.test(item.src)&&!item.src.includes('..')
  &&['image','video'].includes(item.kind))
}

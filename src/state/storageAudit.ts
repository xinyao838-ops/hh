/** Estimates, not browser quota guarantees. Reads values without rewriting them. */
export function serializedSize(value:unknown){
 const text=JSON.stringify(value)??''
 return {characters:text.length,utf16Bytes:text.length*2,utf8Bytes:new TextEncoder().encode(text).byteLength}
}
export function auditWorkshopSize(state:Record<string,unknown>){
 const fields=['operationLog','gesturePath','generatedPattern','finalPattern'] as const
 return {total:serializedSize(state),fields:Object.fromEntries(fields.map(key=>[key,serializedSize(state[key])]))}
}
export function auditStoredValues(storage:Pick<Storage,'getItem'>,keys:readonly string[]){
 return keys.map(key=>{try{
  const raw=storage.getItem(key)
  return {key,characters:raw?.length??0,utf16Bytes:(raw?.length??0)*2,readable:true}
 }catch{return {key,characters:null,utf16Bytes:null,readable:false}}})
}

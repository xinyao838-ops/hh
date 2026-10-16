import type {CraftOperation} from './engine.ts'
/** Undo a whole gesture, not an arbitrary browser event/frame. */
export function undoOperations(operations:CraftOperation[]){
  if(!operations.length)return {operations,removed:[] as CraftOperation[]}
  let start=operations.length-1
  const last=operations[start]
  if(last.kind==='drag')while(start>0){
    const previous=operations[start-1]
    if(previous.kind!=='drag'||previous.strokeId!==last.strokeId)break
    start--
  }
  return {operations:operations.slice(0,start),removed:operations.slice(start)}
}
export function redoOperations(operations:CraftOperation[],removed:CraftOperation[]){return [...operations,...removed]}

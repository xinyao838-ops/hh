import { marblingConfig } from '../../config/marbling.ts'
import { revealConfig } from '../../config/reveal.ts'
import { replay, modelFingerprint, type ClayModel, type CraftOperation } from '../marbling/engine.ts'
interface PatternSource {
  selectedClays: {color:string}[]; interactionSeed:number; operationLog:CraftOperation[]
  gesturePath: {x:number;y:number}[]; twistCount:number; foldCount:number
  generatedPattern: {seed:number;algorithmVersion:number;operationCount:number;imageDataUrl:string} | null
}
/** Durable vector recipe; future vessel/card pages use this same object.
 * The stored 03 snapshot certifies the completed source. Its low-res PNG is not
 * enlarged: the exact operation log reconstitutes its material boundaries. */
export interface FinalPattern {
  version: number; sourceKey: string; seed: number; colors: [string,string]; model: ClayModel
  source: {gesturePointCount:number;twistCount:number;foldCount:number;generatedAlgorithmVersion:number;generatedOperationCount:number}
}
export function createFinalPattern(source:PatternSource):FinalPattern | null {
  const p=source.generatedPattern
  if(source.selectedClays.length!==2||!p||p.seed!==source.interactionSeed||p.algorithmVersion!==marblingConfig.version
    ||p.operationCount!==source.operationLog.length||!p.imageDataUrl.startsWith('data:image/png;base64,'))return null
  const model=replay(source.interactionSeed,source.operationLog)
  if(model.history.twistCount!==source.twistCount||model.history.foldCount!==source.foldCount)return null
  let pointIndex=0,stroke=-1
  const matches=(point:{x:number;y:number})=>{const saved=source.gesturePath[pointIndex++];return saved?.x===point.x&&saved?.y===point.y}
  for(const op of source.operationLog)if(op.kind==='drag'){
    if(stroke!==op.strokeId&&!matches(op.from))return null
    if(!matches(op.to))return null
    stroke=op.strokeId
  }
  if(pointIndex!==source.gesturePath.length)return null
  const colors=source.selectedClays.map(c=>c.color) as [string,string]
  const sourceKey=[revealConfig.version,marblingConfig.version,source.interactionSeed,modelFingerprint(model),p.operationCount,...colors].join(':')
  return {version:revealConfig.version,sourceKey,seed:source.interactionSeed,colors,model,
    source:{gesturePointCount:source.gesturePath.length,twistCount:source.twistCount,foldCount:source.foldCount,generatedAlgorithmVersion:p.algorithmVersion,generatedOperationCount:p.operationCount}}
}

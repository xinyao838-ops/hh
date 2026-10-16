import type {WorkshopState} from '../../state/workshopModel.ts'
import {initialShape,normalizeShape} from './model.ts'
import {normalizeKiln} from '../kiln/model.ts'
/** Recover latest durable geometry and inspection angle, never the mount snapshot. */
export function recoveryShape(state:WorkshopState,sourceKey:string){
 const shape=normalizeShape(state.shapeDraft,sourceKey)??initialShape(sourceKey)
 const kiln=normalizeKiln(state.kilnDraft,shape)
 return kiln?{...shape,rotation:kiln.rotation}:shape
}

import type { WorkshopState } from '../../state/workshopModel.ts'
import {canCollect} from '../kiln/model.ts'
export const PATTERN_ARCHIVE_KEY='myPatterns'
/** Experience identifiers only. These are NOT official product/traceability codes. */
export function experienceNumber(seed:number,createdAt:string){
 const date=new Date(createdAt)
 return `JGX-${date.getFullYear()}-${date.getTime().toString(36).toUpperCase()}-${(seed>>>0).toString(36).padStart(7,'0').toUpperCase()}`
}
export function displayNumber(id:string){return id.replace(/^JGX-(\d{4})-/,'JGX · $1 · ')}
export function localDate(iso:string){const d=new Date(iso);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`}
export function finalizeIdentity(state:WorkshopState):WorkshopState {
 if(!state.finalPattern||!state.kilnDraft||!canCollect(state.kilnDraft))return state
 return state.experienceId.startsWith('JGX-')?state:{...state,legacyExperienceId:state.experienceId,experienceId:experienceNumber(state.interactionSeed,state.createdAt)}
}
/** Reserved backing records for the future 我的纹样馆; no gallery UI yet. */
export interface PatternArchive {version:1;experienceId:string;createdAt:string;archivedAt:string;workshop:WorkshopState;finalPattern:NonNullable<WorkshopState['finalPattern']>;vesselType:string;selectedClays:WorkshopState['selectedClays']}
export function archivePattern(storage:Pick<Storage,'getItem'|'setItem'>,state:WorkshopState){
 if(!state.finalPattern||!state.vesselType||!state.kilnDraft||!canCollect(state.kilnDraft))throw Error('The fired work is not ready')
 const raw=storage.getItem(PATTERN_ARCHIVE_KEY),records:PatternArchive[]=raw?JSON.parse(raw):[]
 if(!Array.isArray(records)||records.some(r=>!r||typeof r.experienceId!=='string'))throw Error('Unreadable archive; keep the current work')
 const record:PatternArchive={version:1,experienceId:state.experienceId,createdAt:state.createdAt,archivedAt:new Date().toISOString(),workshop:state,finalPattern:state.finalPattern,vesselType:state.vesselType,selectedClays:state.selectedClays}
 const next=[...records.filter(r=>r.experienceId!==state.experienceId),record]
 // setItem is atomic; callers must NOT reset the active work when this throws.
 storage.setItem(PATTERN_ARCHIVE_KEY,JSON.stringify(next))
 return record
}

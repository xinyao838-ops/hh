import test from 'node:test'
import assert from 'node:assert/strict'
import {createWorkshopState,toggleClay,saveOperations,saveFinalPattern,saveShapeDraft,saveKilnDraft,restoreWorkshop} from '../src/state/workshopModel.ts'
import {createFinalPattern} from '../src/features/reveal/pattern.ts'
import {initialShape} from '../src/features/shaping/model.ts'
import {initialKiln} from '../src/features/kiln/model.ts'
import {marblingConfig} from '../src/config/marbling.ts'
import {finalizeIdentity,experienceNumber,archivePattern,PATTERN_ARCHIVE_KEY} from '../src/features/collection/model.ts'
function completed(){let s=toggleClay(toggleClay(createWorkshopState(),'ivory'),'umber');const ops=[{kind:'fold'},{kind:'twist'},{kind:'fold'}];s=saveOperations(s,ops,{seed:s.interactionSeed,algorithmVersion:marblingConfig.version,operationCount:ops.length,imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384});s=saveFinalPattern(s,createFinalPattern(s));s=saveShapeDraft(s,{...initialShape(s.finalPattern.sourceKey),progress:1,observed:true,rotation:.75});return saveKilnDraft(s,{...initialKiln(s.shapeDraft),phase:'revealed',observed:true,viewTime:3000})}
test('experience number migrates once, preserving seed, identity provenance and all geometry across refresh',()=>{
 const before=completed(),after=finalizeIdentity(before);assert.match(after.experienceId,/^JGX-\d{4}-[A-Z0-9]+-[A-Z0-9]+$/);assert.equal(after.legacyExperienceId,before.experienceId);assert.equal(after.interactionSeed,before.interactionSeed);assert.deepEqual(after.finalPattern,before.finalPattern);assert.deepEqual(after.kilnDraft,before.kilnDraft)
 const restored=restoreWorkshop(JSON.stringify(after));assert.equal(finalizeIdentity(restored).experienceId,after.experienceId);assert.equal(restored.createdAt,before.createdAt);assert.deepEqual(restored.finalPattern,before.finalPattern)
 assert.notEqual(experienceNumber(1,'2026-09-29T00:00:00.000Z'),experienceNumber(1,'2026-09-29T00:00:00.001Z'));assert.notEqual(experienceNumber(1,before.createdAt),experienceNumber(2,before.createdAt))
})
test('archiving is idempotent, retains full provenance, and preserves multiple works',()=>{
 const memory=new Map(),store={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},a=finalizeIdentity(completed()),b=finalizeIdentity(completed())
 archivePattern(store,a);archivePattern(store,a);archivePattern(store,b);const saved=JSON.parse(memory.get(PATTERN_ARCHIVE_KEY));assert.equal(saved.length,2);assert.deepEqual(saved[0].workshop.gesturePath,a.gesturePath);assert.deepEqual(saved[0].finalPattern,a.finalPattern);assert.equal(saved[0].createdAt,a.createdAt);assert.equal(saved[0].workshop.kilnDraft.rotation,.75)
})
test('quota errors, malformed archives and unfinished works never silently overwrite the archive',()=>{
 const work=finalizeIdentity(completed());let writes=0
 assert.throws(()=>archivePattern({getItem:()=>'{broken',setItem:()=>writes++},work));assert.equal(writes,0)
 assert.throws(()=>archivePattern({getItem:()=>null,setItem:()=>{throw Error('QuotaExceededError')}},work))
 assert.throws(()=>archivePattern({getItem:()=>null,setItem:()=>writes++},createWorkshopState()));assert.equal(writes,0)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {previewSeed,previewSamples} from './fixtures/media-preview.ts'
import {replay,modelFingerprint,modelProgress} from '../src/features/marbling/engine.ts'
import {createWorkshopState,toggleClay,saveOperations,saveFinalPattern,restoreWorkshop} from '../src/state/workshopModel.ts'
import {createFinalPattern} from '../src/features/reveal/pattern.ts'
import {marblingConfig} from '../src/config/marbling.ts'
test('review samples reproduce progressive material layers without changing the engine',()=>{
 const models=previewSamples.map(s=>replay(previewSeed,s.operations))
 assert.equal(models[0].layers.length,0);assert.equal(models[1].layers.length,0)
 assert.ok(models[2].layers.length>0)
 assert.ok(models[3].layers.length>=models[2].layers.length)
 for(let i=0;i<models.length;i++){
  assert.equal(models[i].columns.length,57)
  assert.deepEqual(models[i],replay(previewSeed,previewSamples[i].operations))
 }
 assert.notEqual(modelFingerprint(models[3]),modelFingerprint(models[4]))
 assert.notDeepEqual(models[3].layers,models[4].layers)
 assert.equal(modelProgress(models[1]).interactionProgress,.20500000000000002)
})
test('worked review logs pass source checks and restore; tampering is rejected',()=>{
 for(const sample of previewSamples.slice(1)){
  let state=toggleClay(toggleClay(createWorkshopState(),'ivory'),'umber')
  state={...state,interactionSeed:previewSeed}
  // Unit-test PNG marker only; browser preview supplies a real rendered PNG.
  state=saveOperations(state,sample.operations,{seed:previewSeed,algorithmVersion:marblingConfig.version,operationCount:sample.operations.length,imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384})
  const result=createFinalPattern(state);assert.ok(result)
  assert.deepEqual(result.model,replay(previewSeed,sample.operations))
  assert.deepEqual(restoreWorkshop(JSON.stringify(saveFinalPattern(state,result))).finalPattern,result)
  assert.equal(createFinalPattern({...state,twistCount:99}),null)
  assert.equal(createFinalPattern({...state,generatedPattern:{...state.generatedPattern,seed:1}}),null)
 }
})

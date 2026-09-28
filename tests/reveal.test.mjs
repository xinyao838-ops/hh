import test from 'node:test'
import assert from 'node:assert/strict'
import { CutGesture } from '../src/features/reveal/input.ts'
import { createFinalPattern } from '../src/features/reveal/pattern.ts'
import { createWorkshopState,toggleClay,saveOperations,saveFinalPattern,restoreWorkshop } from '../src/state/workshopModel.ts'
import { marblingConfig } from '../src/config/marbling.ts'
const drag=(x=.45,y=.4,toX=.6,toY=.6)=>({kind:'drag',from:{x,y},to:{x:toX,y:toY},pressure:.65,time:20,strokeId:1,pointerType:'touch'})
function completed(ops=[drag(),{kind:'fold'},{kind:'twist'},{kind:'fold'}]){
  let state=toggleClay(toggleClay(createWorkshopState(),'ivory'),'terracotta');state.interactionSeed=137
  return saveOperations(state,ops,{seed:137,algorithmVersion:marblingConfig.version,operationCount:ops.length,imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384})
}
const cut=(points,cancelled=false)=>{const input=new CutGesture();input.begin(1,points[0]);points.slice(1).forEach(p=>input.move(1,p));return input.finish(1,cancelled)}
test('cut accepts downward strokes anywhere across the clay, including starting on its surface',()=>{
  for(const x of [.18,.24,.35,.48,.64,.74,.79]){
    assert.equal(cut([{x,y:.26},{x,y:.50},{x,y:.77}]),true)
    assert.equal(cut([{x,y:.48},{x,y:.75}]),true)
    const input=new CutGesture();input.begin(1,{x,y:.26});input.move(1,{x,y:.50});input.move(1,{x,y:.77});assert.equal(input.finish(1),true);assert.equal(input.position,x)
  }
  assert.equal(cut([{x:0.63,y:.26},{x:0.67,y:.43},{x:0.61,y:.61},{x:0.65,y:.77}]),true)
  for(const path of [ [{x:0.64,y:.7},{x:0.64,y:.25}], [{x:0.64,y:.3},{x:0.64,y:.48}], [{x:0.08,y:.3},{x:0.09,y:.8}], [{x:0.34,y:.5},{x:0.94,y:.51}], [{x:0.64,y:.3},{x:0.94,y:.5},{x:0.64,y:.8}], [{x:0.64,y:.62},{x:0.64,y:.8}] ])assert.equal(cut(path),false)
  assert.equal(cut([{x:0.64,y:.25},{x:0.64,y:.8}],true),false)
})
test('second pointer and unrelated end events cannot steal the cutting contact',()=>{
  const input=new CutGesture();assert.equal(input.begin(1,{x:0.64,y:.25}),true);assert.equal(input.begin(2,{x:0.64,y:.25}),false)
  input.move(2,{x:0.64,y:.8});assert.equal(input.finish(2),false);input.move(1,{x:0.64,y:.8});assert.equal(input.finish(1),true)
})
test('final recipe exactly reuses the saved seed, pigments, gesture-driven model and operation ordering',()=>{
  const state=completed(),a=createFinalPattern(state),b=createFinalPattern(restoreWorkshop(JSON.stringify(state)))
  assert.deepEqual(a,b);assert.deepEqual(a.colors,['#dfcfb3','#ad6647']);assert.equal(a.seed,137)
  assert.notEqual(a.sourceKey,createFinalPattern(completed([drag(.4,.4,.2,.65),{kind:'twist'},{kind:'fold'},{kind:'fold'}])).sourceKey)
  const recolored={...state,selectedClays:[state.selectedClays[0],{...state.selectedClays[1],color:'#37332e'}]}
  assert.notEqual(a.sourceKey,createFinalPattern(recolored).sourceKey)
  assert.equal(createFinalPattern({...state,generatedPattern:{...state.generatedPattern,seed:999}}),null)
  assert.equal(createFinalPattern({...state,generatedPattern:null}),null)
  assert.equal(createFinalPattern({...state,gesturePath:[{x:.1,y:.2}]}),null)
  assert.equal(createFinalPattern({...state,twistCount:99}),null)
})
test('finalPattern survives refresh; unchanged return through 03 retains it; new kneading invalidates it',()=>{
  const source=completed(),recipe=createFinalPattern(source),saved=saveFinalPattern(source,recipe)
  assert.deepEqual(restoreWorkshop(JSON.stringify(saved)).finalPattern,recipe)
  assert.deepEqual(saveOperations(saved,saved.operationLog,saved.generatedPattern).finalPattern,recipe)
  assert.equal(saveOperations(saved,[...saved.operationLog,drag()]).finalPattern,null)
  assert.equal(toggleClay(saved,'ivory').finalPattern,null)
  assert.equal(saveFinalPattern(source,{...recipe,sourceKey:'unrelated'}),source)
})
test('restore reconstructs validated vector geometry and rejects mismatched lineage',()=>{
  const source=completed(),recipe=createFinalPattern(source),saved=saveFinalPattern(source,recipe)
  assert.equal(restoreWorkshop(JSON.stringify({...saved,finalPattern:{...recipe,sourceKey:'old'}})).finalPattern,null)
  assert.deepEqual(restoreWorkshop(JSON.stringify({...saved,finalPattern:{...recipe,model:{bad:'geometry'}}})).finalPattern,recipe)
  assert.equal(restoreWorkshop(JSON.stringify({...saved,finalPattern:undefined})).finalPattern,null)
})

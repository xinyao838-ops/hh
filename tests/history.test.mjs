import test from 'node:test'
import assert from 'node:assert/strict'
import {undoOperations,redoOperations} from '../src/features/marbling/history.ts'
import {replay,modelFingerprint} from '../src/features/marbling/engine.ts'
import {createWorkshopState,toggleClay,saveOperations,saveFinalPattern,restoreWorkshop} from '../src/state/workshopModel.ts'
import {createFinalPattern} from '../src/features/reveal/pattern.ts'
import {marblingConfig} from '../src/config/marbling.ts'
const drag=(id,x)=>({kind:'drag',strokeId:id,from:{x,y:.5},to:{x:x+.01,y:.51},pressure:.5,pointerType:'touch',time:1})
test('undo groups a complete stroke; replay after redo exactly matches geometry and counters',()=>{
 const ops=[{kind:'fold'},drag(1,.4),drag(1,.41),drag(2,.5),drag(2,.51)]
 const a=undoOperations(ops);assert.equal(a.removed.length,2)
 const b=undoOperations(a.operations);assert.equal(b.removed.length,2)
 const rebuilt=redoOperations(redoOperations(b.operations,b.removed),a.removed)
 assert.deepEqual(rebuilt,ops)
 assert.equal(modelFingerprint(replay(42,rebuilt)),modelFingerprint(replay(42,ops)))
 assert.deepEqual(undoOperations([]).removed,[])
})
test('undo invalidates PNG and final pattern; refresh restores the active log, redo requires a new finish',()=>{
 let state=toggleClay(toggleClay(createWorkshopState(),'ivory'),'umber')
 const ops=[{kind:'fold'},{kind:'twist'},{kind:'fold'}]
 const png={seed:state.interactionSeed,algorithmVersion:marblingConfig.version,operationCount:3,imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384}
 state=saveOperations(state,ops,png);state=saveFinalPattern(state,createFinalPattern(state));assert.ok(state.finalPattern)
 const change=undoOperations(ops),undone=saveOperations(state,change.operations)
 assert.equal(undone.generatedPattern,null);assert.equal(undone.finalPattern,null);assert.equal(undone.shapeDraft,null);assert.equal(undone.kilnDraft,null)
 const restored=restoreWorkshop(JSON.stringify(undone));assert.deepEqual(restored.operationLog,change.operations)
 const redone=saveOperations(restored,redoOperations(restored.operationLog,change.removed));assert.equal(redone.finalPattern,null)
 const finished=saveOperations(redone,redone.operationLog,png)
 assert.deepEqual(createFinalPattern(finished),state.finalPattern)
})

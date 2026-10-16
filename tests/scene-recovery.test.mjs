import test from 'node:test'
import assert from 'node:assert/strict'
import {recoveryShape} from '../src/features/shaping/recovery.ts'
import {initialShape} from '../src/features/shaping/model.ts'
import {initialKiln} from '../src/features/kiln/model.ts'
test('context recovery preserves latest vessel progress and fired inspection angle',()=>{
 const shape={...initialShape('source'),vesselType:'cup',progress:1,observed:true,rotation:.8}
 const state={shapeDraft:shape,kilnDraft:{...initialKiln(shape),phase:'revealed',rotation:1.7}}
 const recovered=recoveryShape(state,'source')
 assert.equal(recovered.vesselType,'cup');assert.equal(recovered.progress,1);assert.equal(recovered.rotation,1.7)
 assert.equal(state.shapeDraft.rotation,.8)
 assert.deepEqual(recoveryShape(state,'different'),initialShape('different'))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {auditStoredValues,auditWorkshopSize,serializedSize} from '../src/state/storageAudit.ts'
test('capacity audit distinguishes encoded bytes, reports blocked storage and never writes',()=>{
 const storage={getItem:key=>{if(key==='blocked')throw Error('SecurityError');return key==='work'?'泥':null}}
 assert.deepEqual(auditStoredValues(storage,['work','missing','blocked']).map(v=>v.utf16Bytes),[2,0,null])
 assert.equal(serializedSize('泥').utf8Bytes,5)
 const state={operationLog:[{kind:'fold'}],generatedPattern:{imageDataUrl:'abc'}},before=JSON.stringify(state)
 assert.ok(auditWorkshopSize(state).total.utf16Bytes>auditWorkshopSize(state).fields.operationLog.utf16Bytes)
 assert.equal(JSON.stringify(state),before)
})

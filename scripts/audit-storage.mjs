import {createWorkshopState,toggleClay,saveOperations} from '../src/state/workshopModel.ts'
import {auditWorkshopSize,serializedSize} from '../src/state/storageAudit.ts'
import {marblingConfig} from '../src/config/marbling.ts'
// Synthetic records only. Never opens a user's browser or localStorage.
const base=toggleClay(toggleClay(createWorkshopState(),'ivory'),'umber')
for(const count of [100,1000,marblingConfig.maxOperations]){
 const ops=Array.from({length:count},(_,i)=>({kind:'drag',strokeId:Math.floor(i/50),from:{x:.4,y:.5},to:{x:.41,y:.51},time:i*16,pressure:.5,pointerType:'touch'}))
 const state=saveOperations(base,ops)
 console.log(JSON.stringify({operations:count,...auditWorkshopSize(state)},null,2))
}
console.log('PNG restore ceiling (characters): 1500000; near-ceiling PNG UTF-16 bytes:',serializedSize('x'.repeat(1499999)).utf16Bytes)
console.log('Archive currently duplicates finalPattern and embeds the full workshop, including its PNG. Actual browser quota varies. No data migrated.')

import {readFile,readdir,stat} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import assert from 'node:assert/strict'
const root=resolve('dist'),html=await readFile(join(root,'index.html'),'utf8')
const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1])
for(const ref of refs){assert.ok(!/^https?:\/\//.test(ref),'Initial assets must be self-hosted');assert.ok(ref.startsWith('/'),'Assets must resolve from the public domain root');await stat(join(root,ref))}
let scripts=0,css=0
for(const file of await readdir(join(root,'assets'))){
 if(!/\.(js|css)$/.test(file))continue
 const content=await readFile(join(root,'assets',file),'utf8')
 assert.ok(!/https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(?=[:/"'])/i.test(content),`Local development URL in ${file}`)
 assert.ok(!content.includes('/@vite/client'),`Development client in ${file}`)
 if(file.endsWith('.js'))scripts++;else css++
}
assert.ok(scripts>=2&&css>=1,'Missing application, lazy 3D bundle or styles')
for(const name of['src','tests','node_modules','.env','.git','docs']){try{await stat(join(root,name));throw Error(`Private/development directory in dist: ${name}`)}catch(e){if(e.code!=='ENOENT')throw e}}
console.log(`Production audit passed: ${refs.length} entry assets; ${scripts} JS bundles; ${css} stylesheet(s); no local service URLs or development files.`)

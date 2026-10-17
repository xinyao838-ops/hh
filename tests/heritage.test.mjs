import test from 'node:test'
import assert from 'node:assert/strict'
import {heritageContent,publishableHeritage} from '../src/config/heritage.ts'
test('unapproved assets and unverified facts stay out of the published module',()=>{
 assert.deepEqual(publishableHeritage(heritageContent).slice(0,3).map(item=>item.id),['jgx-ppt38','m01-vessel','m02-vessel'])
 const item={id:'test',title:'fixture',kind:'image',src:'/media/example.jpg',alt:'测试',caption:'测试',source:'测试资料',authorization:'测试授权记录',factChecked:true,publication:'cleared'}
 assert.equal(publishableHeritage([item]).length,1)
 for(const patch of [{publication:'placeholder'},{factChecked:false},{authorization:''},{source:''},{src:'https://unknown.test/a.jpg'},{src:'/media/../secret'}])assert.equal(publishableHeritage([{...item,...patch}]).length,0)
})

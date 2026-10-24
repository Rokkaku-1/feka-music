import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('seasonal calendar changes at month boundaries and resets after December',async()=>{
 const context={module:{exports:{}}};
 vm.runInNewContext(await readFile(new URL('./sonora-prototype/seasonal.js',import.meta.url),'utf8'),context);
 const {seasonForDate}=context.module.exports;
 for(const [month,day,expected] of [[8,30,'default'],[9,1,'halloween'],[9,31,'halloween'],[10,1,'default'],[10,30,'default'],[11,1,'christmas'],[11,31,'christmas'],[0,1,'default']]){
  assert.equal(seasonForDate(new Date(2026,month,day,23,59)),expected);
 }
 assert.equal(seasonForDate(new Date('invalid')),'default');
});

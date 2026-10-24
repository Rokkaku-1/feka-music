import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createFileSearchStore} from './feka-music-local-store.mjs';

test('persistent cache deduplicates concurrent requests and enforces daily budget',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'feka-cache-test-'));
 try{
  const filename=path.join(dir,'cache.json'),store=createFileSearchStore(filename);
  const claims=await Promise.all([store.claim('same',2),store.claim('same',2)]);
  assert.deepEqual(claims.map(x=>x.status),['claimed','pending']);
  await store.complete('same',[{id:'example'}]);
  const reloaded=createFileSearchStore(filename);
  assert.deepEqual(await reloaded.claim('same',2),{status:'hit',results:[{id:'example'}]});
  assert.equal((await reloaded.claim('second',2)).used,2);
  assert.equal((await reloaded.claim('third',2)).status,'quota');
  await reloaded.release('second');
  assert.equal((await reloaded.claim('second',2)).status,'quota');
  assert.equal((await reloaded.claim('same',2)).status,'hit');
 }finally{await rm(dir,{recursive:true,force:true});}
});

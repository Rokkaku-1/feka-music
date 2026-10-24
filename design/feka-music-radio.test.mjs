import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {handler} from './sonora-prototype/server/youtube-handler.mjs';

test('radio preserves its seed, avoids repeated tracks/artists and discards stale requests',async()=>{
 const context={module:{exports:{}}};vm.runInNewContext(await readFile(new URL('./sonora-prototype/radio-core.js',import.meta.url),'utf8'),context);
 const radio=context.module.exports.createRadioQueue();
 const a={id:'a',artist:'Radiohead'},b={id:'b',artist:'Nirvana'},c={id:'c',artist:'Muse'};
 const old=radio.start(a);
 radio.install([a,{id:'duplicateArtist',artist:'RadioheadVEVO'},b,b,c],old);
 assert.equal(radio.peek(a,10).length,2);assert.equal(radio.peek(a)[0].id,'b');
 radio.record(b);assert.equal(radio.seed.id,'a');assert.equal(radio.peek(b)[0].id,'c');
 radio.record(c);assert.equal(radio.peek(c).length,0);
 const next=radio.start(b);assert.equal(radio.install([c],old),false);assert.equal(radio.seed.id,'b');
 radio.install([a,c],next);assert.equal(radio.peek(b).length,2);
});

test('radio API verifies shared topics and playable videos before caching',async()=>{
 const savedFetch=globalThis.fetch,savedKey=process.env.YOUTUBE_API_KEY;process.env.YOUTUBE_API_KEY='test';let cache,calls=0;
 const seed='abcdefghijk',topic='https://en.wikipedia.org/wiki/Rock_music';
 const track=(id,channel,topics,embeddable=true)=>({id,snippet:{title:id,channelTitle:channel,channelId:channel},status:{embeddable},topicDetails:{topicCategories:topics}});
 const store={claim:async()=>cache?{status:'hit',results:cache}:{status:'claimed',used:1},complete:async(key,items)=>{cache=items;},release:async()=>{}};
 try{
  globalThis.fetch=async url=>{calls++;const u=new URL(url);
   if(u.pathname.endsWith('/search'))return Response.json({items:['lmnopqrstuv','ABCDEFGHIJK','LMNOPQRSTUV','12345678901'].map(id=>({id:{videoId:id}}))});
   return Response.json({items:u.searchParams.get('id')===seed?[track(seed,'Seed',[topic])]:[track('lmnopqrstuv','Other',[topic]),track('ABCDEFGHIJK','Seed',[topic]),track('LMNOPQRSTUV','Unrelated',['https://en.wikipedia.org/wiki/Pop_music']),track('12345678901','Blocked',[topic],false)]});
  };
  assert.equal((await handler({httpMethod:'GET',queryStringParameters:{mode:'radio',seed:'invalid'}},{searchStore:store})).statusCode,400);
  const event={httpMethod:'GET',queryStringParameters:{mode:'radio',seed}};
  const response=await handler(event,{searchStore:store});assert.equal(response.statusCode,200);
  const items=JSON.parse(response.body).items;assert.equal(items.length,1);assert.equal(items[0].id,'lmnopqrstuv');assert.equal(items[0].radioTopic,'Rock music');assert.equal(calls,3);
  assert.equal(JSON.parse((await handler(event,{searchStore:store})).body).cached,true);assert.equal(calls,3);
 }finally{globalThis.fetch=savedFetch;if(savedKey===undefined)delete process.env.YOUTUBE_API_KEY;else process.env.YOUTUBE_API_KEY=savedKey;}
});

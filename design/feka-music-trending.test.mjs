import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handler} from './sonora-prototype/server/youtube-handler.mjs';

test('trends use music charts, deduplicate playable videos and reuse shared cache',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.YOUTUBE_API_KEY;
 process.env.YOUTUBE_API_KEY='test-only';
 let saved,calls=0,released=false;
 const store={claim:async()=>saved?{status:'hit',results:saved}:{status:'claimed',used:1},complete:async(key,items)=>{saved=items;},release:async()=>{released=true;}};
 try{
  globalThis.fetch=async url=>{
   calls++;const params=new URL(url).searchParams;
   assert.equal(params.get('chart'),'mostPopular');assert.equal(params.get('videoCategoryId'),'10');
   assert.ok(['PE','US','KR'].includes(params.get('regionCode')));
   return Response.json({items:[
    {id:'abcdefghijk',status:{embeddable:true},snippet:{title:'Music',channelTitle:'Artist'},topicDetails:{topicCategories:['https://en.wikipedia.org/wiki/Pop_music']}},
    {id:'lmnopqrstuv',status:{embeddable:false},snippet:{title:'Blocked',channelTitle:'Artist'}},
    {id:'ABCDEFGHIJK',status:{embeddable:true},snippet:{title:'Unknown genre',channelTitle:'Artist'}}
   ]});
  };
  const event={httpMethod:'GET',queryStringParameters:{mode:'trending'}};
  const first=await handler(event,{searchStore:store});assert.equal(first.statusCode,200);
  const data=JSON.parse(first.body);assert.equal(data.items.length,2);assert.equal(data.items[0].genre,'Pop');assert.equal(data.items[1].genre,'Sin clasificar');assert.equal(calls,3);assert.equal(released,false);
  const second=JSON.parse((await handler(event,{searchStore:store})).body);assert.equal(second.cached,true);assert.equal(calls,3);
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.YOUTUBE_API_KEY;else process.env.YOUTUBE_API_KEY=originalKey;}
});

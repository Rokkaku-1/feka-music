import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handler} from './sonora-prototype/server/youtube-handler.mjs';

test('search validates requests, handles absent credentials and conserves provider calls',async()=>{
  assert.equal((await handler({httpMethod:'POST'})).statusCode,405);
  assert.equal((await handler({httpMethod:'GET',queryStringParameters:{q:'a'}})).statusCode,400);
  const saved={...process.env},originalFetch=globalThis.fetch;
  try{
    delete process.env.YOUTUBE_API_KEY;
    const event={httpMethod:'GET',queryStringParameters:{q:' Los   Toribianitos '}};
    assert.equal((await handler(event)).statusCode,503);
    Object.assign(process.env,{YOUTUBE_API_KEY:'test-only',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test_only',YOUTUBE_DAILY_SEARCH_LIMIT:'100'});
    const cases=[['hit',200],['pending',202],['quota',429]];
    for(const [status,expected] of cases){let calls=0;globalThis.fetch=async url=>{calls++;assert.ok(url.includes('/rpc/claim_music_search'));return Response.json({status,results:[]});};assert.equal((await handler(event)).statusCode,expected);assert.equal(calls,1);}
    let calls=[];
    globalThis.fetch=async (url,options)=>{calls.push({url,options});if(url.includes('/rpc/'))return Response.json({status:'claimed',used:1});if(url.includes('googleapis.com'))return Response.json({items:[{id:{videoId:'sOnqjkJTMaA'},snippet:{title:'Thriller',channelTitle:'Michael Jackson',thumbnails:{medium:{url:'https://i.ytimg.com/vi/sOnqjkJTMaA/mqdefault.jpg'}}}}]});return new Response(null,{status:204});};
    const result=await handler(event);assert.equal(result.statusCode,200);assert.equal(JSON.parse(result.body).items[0].id,'sOnqjkJTMaA');assert.equal(calls.length,3);assert.equal(JSON.parse(calls[0].options.body).p_limit,100);assert.equal(new URL(calls[1].url).searchParams.get('q'),'los toribianitos');assert.ok(!calls[0].options.headers.Authorization);
    calls=[];globalThis.fetch=async(url,options)=>{calls.push(url);if(url.includes('/rpc/'))return Response.json({status:'claimed',used:1});if(url.includes('googleapis.com'))return Response.json({error:{errors:[{reason:'quotaExceeded'}]}},{status:403});return new Response(null,{status:204});};
    assert.equal((await handler(event)).statusCode,429);assert.equal(calls.filter(u=>u.includes('googleapis.com')).length,1);assert.equal(calls.length,3);
  }finally{globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);}
});

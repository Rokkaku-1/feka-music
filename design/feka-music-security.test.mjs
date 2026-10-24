import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {validateRequest} from './sonora-prototype/server/request-security.mjs';
import {handler} from './sonora-prototype/server/youtube-handler.mjs';

test('public API rejects cross-site requests, pollution, missing headers and unsafe methods',()=>{
 const request=(path='',options={})=>new Request('https://feka.example/api/music'+path,{headers:{'X-Feka-Search':'1',...options.headers},method:options.method||'GET'});
 assert.equal(validateRequest(request('?q=music')),null);
 assert.equal(validateRequest(request('?q=music',{headers:{Origin:'https://feka.example'}})),null);
 assert.equal(validateRequest(request('?q=music',{method:'POST'})),405);
 assert.equal(validateRequest(new Request('https://feka.example/api/music?q=music')),403);
 assert.equal(validateRequest(request('?q=music',{headers:{Origin:'https://evil.example'}})),403);
 assert.equal(validateRequest(request('?q=music',{headers:{'Sec-Fetch-Site':'cross-site'}})),403);
 for(const query of ['?q=a&q=b','?mode=radio&seed=abcdefghijk&seed=lmnopqrstuv','?callback=alert','?key=secret','?__proto__=x'])assert.equal(validateRequest(request(query)),400);
 assert.equal(validateRequest(request('?q='+'a'.repeat(2200))),414);
});

test('malformed modes and parameter types never call providers',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('Must not fetch');};
 try{for(const parameters of [{mode:'admin'},{q:{}},{q:['a','b']},{mode:'radio',seed:'../../secret'},{q:'a'},{q:'x'.repeat(121)}])assert.equal((await handler({httpMethod:'GET',queryStringParameters:parameters})).statusCode,400);assert.equal(calls,0);}finally{globalThis.fetch=original;}
});

test('untrusted library metadata is bounded, escaped and cannot set image URLs or prototype keys',async()=>{
 const context={module:{exports:{}}};vm.runInNewContext(await readFile(new URL('./sonora-prototype/client-data.js',import.meta.url),'utf8'),context);
 const {normalizeTrack,normalizeLibrary,escapeHtml}=context.module.exports;
 const payload='<img src=x onerror="alert(1)"><script>alert(2)</script>';
 const track=normalizeTrack({id:'abcdefghijk',title:payload,artist:'x'.repeat(2000),cover:'javascript:alert(1)',genre:'<svg/onload=alert(1)>'},['Pop']);
 assert.equal(track.cover,'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');assert.equal(track.artist.length,160);assert.equal(track.genre,'Sin clasificar');
 assert.ok(!escapeHtml(track.title).includes('<'));assert.ok(escapeHtml(track.title).includes('&lt;'));
 assert.equal(normalizeTrack({id:'../../secrets',title:'a',artist:'b'}),null);
 const input=JSON.parse('{"version":1,"favorites":["abcdefghijk","javascript:alert(1)"],"playlists":[{"name":"'+ 'x'.repeat(90)+'","ids":["abcdefghijk"]}],"genres":["Pop","evil"],"history":[{"id":"abcdefghijk","at":-1}],"__proto__":{"admin":true}}');
 const library=normalizeLibrary(input,['Pop']);assert.equal(library.favorites.length,1);assert.equal(library.playlists[0].name.length,48);assert.equal(library.genres.length,1);assert.equal(library.history.length,0);assert.equal(Object.hasOwn(library,'__proto__'),false);
 assert.throws(()=>normalizeLibrary({version:1,favorites:[],playlists:[],junk:'x'.repeat(262145)}));
 assert.equal(normalizeTrack({id:'abcdefghijk',title:'Old data',artist:'Old artist',fetchedAt:1},[],31*86400000).title,'Canción guardada');
});

test('deployment public tree contains no private config, server sources, SQL or review documents',async()=>{
 const root=new URL('./sonora-prototype/dist/',import.meta.url);
 const entries=await readdir(root,{recursive:true});
 for(const file of entries){assert.ok(!/(^|[\\/])\.|\.mjs$|\.sql$|\.md$|^server[\\/]|^netlify[\\/]/.test(file),file);}
 for(const name of entries.filter(file=>/\.(js|html|css|json|webmanifest)$/.test(file))){const source=await readFile(new URL(name.replaceAll('\\','/'),root),'utf8');assert.ok(!/AIza[\w-]{30,}|sb_secret_[\w-]+|"role":"service_role"/.test(source),name);}
 const headers=await readFile(new URL('./sonora-prototype/netlify.toml',import.meta.url),'utf8');
 for(const directive of ["object-src 'none'","frame-ancestors 'none'","base-uri 'none'","form-action 'self'",'Strict-Transport-Security'])assert.ok(headers.includes(directive));
 assert.ok(!headers.includes("script-src 'unsafe-inline'"));
});

import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {handler} from './sonora-prototype/server/youtube-handler.mjs';
import {createFileSearchStore} from './feka-music-local-store.mjs';
const root=fileURLToPath(new URL('./sonora-prototype/',import.meta.url));
const privateRoot=fileURLToPath(new URL('./.private/',import.meta.url));
try{
 const env=(await readFile(path.join(privateRoot,'feka-music.env'),'utf8')).replace(/^\uFEFF/,'');
 for(const line of env.split(/\r?\n/)){const match=line.match(/^([A-Z_]+)=(.*)$/);if(match&&['YOUTUBE_API_KEY','YOUTUBE_DAILY_SEARCH_LIMIT','SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY'].includes(match[1]))process.env[match[1]]=match[2].trim();}
}catch(e){if(e.code!=='ENOENT')throw e;}
const searchStore=createFileSearchStore(path.join(privateRoot,'feka-search-cache.json'));
const cleanup=setInterval(()=>searchStore.prune().catch(()=>{}),3600000);cleanup.unref();
const types={'.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/plain; charset=utf-8'};
const origins=new Set(['http://localhost:5500','http://127.0.0.1:5500','http://localhost:4186']);
const recent=new Map();
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost:4186');
 if(['/.netlify/functions/youtube-search','/api/music'].includes(url.pathname)){
  const origin=req.headers.origin;if(origin&&!origins.has(origin)){res.writeHead(403).end();return;}
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'X-Feka-Search'}).end();return;}
  if(req.headers['x-feka-search']!=='1'){res.writeHead(403).end();return;}
  const address=req.socket.remoteAddress,now=Date.now(),hits=(recent.get(address)||[]).filter(t=>now-t<60000);
  if(hits.length>=20){res.writeHead(429,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Espera un momento antes de buscar otra vez.'}));return;}hits.push(now);recent.set(address,hits);
  try{const result=await handler({httpMethod:req.method,queryStringParameters:Object.fromEntries(url.searchParams)},process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY?{}:{searchStore});res.writeHead(result.statusCode,result.headers).end(result.body);}catch{res.writeHead(500).end('{"error":"Servicio no disponible."}');}return;
 }
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const pathname=decodeURIComponent(url.pathname);
  if(pathname.split('/').some(p=>p.startsWith('.'))||/^\/(netlify|supabase|server)(\/|$)/.test(pathname)){res.writeHead(404).end();return;}
  if(!/\.(html|css|js|png|webmanifest)$/.test(pathname)&&pathname!=='/'){res.writeHead(404).end();return;}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root)){res.writeHead(403).end();return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Referrer-Policy':'strict-origin-when-cross-origin'}).end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404).end('Not found');}
}).listen(4186,'127.0.0.1',()=>console.log('Feka Music: http://localhost:4186 — API privada preparada para Live Server.'));

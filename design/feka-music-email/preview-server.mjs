import http from 'node:http';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('./preview.html',import.meta.url));
const server=http.createServer((req,res)=>{
  if(!['/','/preview.html'].includes(new URL(req.url,'http://localhost').pathname)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}).end(html);
});
server.listen(0,'127.0.0.1',()=>console.log(`Vista previa del correo: http://localhost:${server.address().port}/`));

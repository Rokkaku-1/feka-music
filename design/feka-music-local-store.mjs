import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
export function createFileSearchStore(filename){
  let tail=Promise.resolve();
  async function transaction(fn){
    const work=tail.then(async()=>{
      let state;try{state=JSON.parse(await readFile(filename,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state={cache:{},usage:{}};}
      const now=Date.now();for(const [key,row] of Object.entries(state.cache)){if((row.expires||0)<now&&(row.lease||0)<now)delete state.cache[key];}
      const result=fn(state,now);await mkdir(path.dirname(filename),{recursive:true});await writeFile(filename+'.tmp',JSON.stringify(state));await rename(filename+'.tmp',filename);return result;
    });tail=work.catch(()=>{});return work;
  }
  return {
    claim:(key,limit)=>transaction((s,now)=>{
      const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
      const day=`${parts.year}-${parts.month}-${parts.day}`,usage=s.usage[day]??={searches:0,cacheHits:0};
      const row=s.cache[key];if(row?.expires>now){usage.cacheHits++;return {status:'hit',results:row.results};}
      if(row?.lease>now)return {status:'pending'};
      if(usage.searches>=limit)return {status:'quota'};
      usage.searches++;s.cache[key]={lease:now+20000};return {status:'claimed',used:usage.searches};
    }),
    complete:(key,items)=>transaction((s,now)=>{s.cache[key]={results:items,expires:now+86400000};}),
    release:key=>transaction(s=>{if(s.cache[key]&&!s.cache[key].results)delete s.cache[key];}),
    prune:()=>transaction(()=>{}),
  };
}

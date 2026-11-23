/** A agenda só limita uma prescrição já calculada; nunca redistribui a sobra. */
export function fitTimeConstraints<T extends {date:Date;minutes:number}>(sessions:T[],daily:unknown,sessionLimit?:number,weeklyLimit?:number|null):(T&{prescribedMinutes:number})[]{
 let result=sessions.map(session=>({...session,prescribedMinutes:session.minutes,minutes:Math.min(session.minutes,sessionLimit??Infinity)}));
 const limits=daily&&typeof daily==='object'&&!Array.isArray(daily)?daily as Record<string,unknown>:{};
 const scale=(group:typeof result,cap:number)=>{
  const total=group.reduce((sum,s)=>sum+s.minutes,0);if(total<=cap)return;
  const desired=group.map(s=>s.minutes*cap/total);group.forEach((s,i)=>{s.minutes=Math.floor(desired[i]);});
  let remaining=Math.floor(cap)-group.reduce((sum,s)=>sum+s.minutes,0);
  const ranked=desired.map((v,i)=>({i,remainder:v-Math.floor(v)})).sort((a,b)=>b.remainder-a.remainder);
  for(const item of ranked)if(remaining-->0)group[item.i].minutes++;
 };
 for(const date of new Set(result.map(s=>s.date.toISOString().slice(0,10)))){
  const group=result.filter(s=>s.date.toISOString().slice(0,10)===date);
  const day=['dom','seg','ter','qua','qui','sex','sab'][group[0].date.getUTCDay()];const raw=limits[day];
  if(raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw)))scale(group,Math.max(0,Number(raw)));
 }
 if(weeklyLimit!=null&&Number.isFinite(weeklyLimit))scale(result,Math.max(0,weeklyLimit));
 // Não transformar fragmentos menores que dez minutos em sessões extras nem compensar em outro dia.
 result=result.filter(s=>s.minutes>=10);
 return result;
}

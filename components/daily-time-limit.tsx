'use client';
import {useState} from 'react';
const options=[0,15,30,45,60,90,120,180,240,360,480];
const label=(value:number)=>value===0?'Sem tempo para treinar neste dia':`${Math.floor(value/60)?Math.floor(value/60)+' h ':''}${value%60?value%60+' min':''}`.trim();
export function DailyTimeLimit({day,name,value,onChange,error}:{day:string;name:string;value:unknown;onChange:(value:number|undefined)=>void;error?:string}){
 const [custom,setCustom]=useState(false);
 const current=value==null||value===''?'':String(value);
 const input='w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-base';
 return <div className="space-y-2"><label className="block text-sm font-medium">{day} — limite opcional<select name={name} aria-invalid={!!error} className={input} value={custom?'custom':current} onChange={e=>{if(e.target.value==='custom'){setCustom(true);return;}setCustom(false);onChange(e.target.value===''?undefined:Number(e.target.value));}}><option value="">Sem limite de horário informado</option>{options.map(minutes=><option key={minutes} value={minutes}>{label(minutes)}</option>)}{current!==''&&!options.includes(Number(current))&&<option value={current}>{label(Number(current))}</option>}<option value="custom">Outro limite…</option></select></label>{custom&&<label className="block text-sm">Duração máxima em minutos<input className={input} type="number" min={0} max={480} value={current} onChange={e=>onChange(e.target.value===''?undefined:Number(e.target.value))} /></label>}{error&&<p className="text-sm text-destructive">{error}</p>}</div>;
}

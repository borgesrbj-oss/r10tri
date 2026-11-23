'use client';
import { useEffect, useRef, useState } from 'react';
import type { AssessmentIssue } from '@/lib/assessment-review';

export function AssessmentReview({issues,onReview}:{issues:AssessmentIssue[];onReview:(issue:AssessmentIssue)=>void}) {
  if(!issues.length)return null;
  return <div role="alert" className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
    <p className="font-semibold">Revise os campos da triagem antes de gerar o plano</p>
    <ul className="my-3 space-y-2">{issues.map(issue=><li key={issue.field}>
      <p><strong>{issue.label}:</strong> {issue.message}</p>
      <button type="button" className="min-h-11 text-left underline font-medium" onClick={()=>onReview(issue)}>Revisar triagem: {issue.label}</button>
    </li>)}</ul>
  </div>;
}

/** Aguarda a etapa/aba montar antes de destacar e focar o controle real. */
export function useAssessmentReview(issues:AssessmentIssue[],initialField?:string) {
  const scope=useRef<HTMLDivElement>(null);
  const [request,setRequest]=useState<{field:string;nonce:number}|null>(()=>initialField?{field:initialField,nonce:0}:null);
  useEffect(()=>{
    const root=scope.current;
    if(!root)return;
    const marked:HTMLElement[]=[];
    for(const issue of issues){
      const field=issue.field==='recentRaceTimeSeconds'?'recentRaceTime':issue.field;
      const target=root.querySelector<HTMLElement>(`[name="${CSS.escape(field)}"], [data-assessment-field="${CSS.escape(field)}"]`) ?? root.querySelector<HTMLElement>(`[data-assessment-field="${CSS.escape(field.split('.')[0])}"]`);
      if(target){target.setAttribute('data-review-invalid','true');marked.push(target);}
    }
    return ()=>marked.forEach(el=>el.removeAttribute('data-review-invalid'));
  });
  useEffect(()=>{
    if(!request)return;
    const frame=requestAnimationFrame(()=>{
      const field=request.field==='recentRaceTimeSeconds'?'recentRaceTime':request.field;
      const target=scope.current?.querySelector<HTMLElement>(`[name="${CSS.escape(field)}"], [data-assessment-field="${CSS.escape(field)}"]`) ?? scope.current?.querySelector<HTMLElement>(`[data-assessment-field="${CSS.escape(field.split('.')[0])}"]`);
      if(!target)return;
      target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      const control=target.matches('input,select,textarea,button')?target:target.querySelector<HTMLElement>('input,select,textarea,button');
      (control??target).focus({preventScroll:true});
    });
    return ()=>cancelAnimationFrame(frame);
  },[request]);
  return {scope,focusField:(field:string)=>setRequest({field,nonce:Date.now()})};
}

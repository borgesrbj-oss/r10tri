import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {generateStructuredPlan} from '../lib/training-structure';
import {auditProfiles,auditStart} from '../tests/fixtures/audit-profiles';
const require=createRequire(import.meta.url),mod={exports:{} as any};
const code=ts.transpileModule(execFileSync('git',['show','929e690:lib/training-structure.ts'],{encoding:'utf8'}),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(code,{module:mod,exports:mod.exports,require:(name:string)=>require(path.resolve('lib',name)),Date,console});
const rows=auditProfiles.map(item=>{const date=new Date(auditStart+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+item.raceWeeks*7);const args=[item.profile,[{date,priority:'A'}],item.profile.availableDays!,auditStart,Math.min(12,item.raceWeeks+2)] as Parameters<typeof generateStructuredPlan>;const before=mod.exports.generateStructuredPlan(...args),after=generateStructuredPlan(...args);return {perfil:item.name,antesMin:before.summary.weeks[0]?.plannedMinutes??0,depoisMin:after.summary.weeks[0]?.plannedMinutes??0,antesIntenso:before.summary.distribution.highSeconds,depoisIntenso:after.summary.distribution.highSeconds,revisao:after.summary.requiresCoachReview,caminhada:after.workouts.some(w=>w.structure.steps.some(s=>s.label.includes('Caminhada'))),tecnica:after.workouts.some(w=>w.structure.steps.some(s=>s.label.includes('respiração')))};});
writeFileSync('docs/COMPARACAO_TREINOS_2026.json',JSON.stringify(rows,null,2)+'\n');
writeFileSync('docs/COMPARACAO_TREINOS_2026.md','# Comparação reproduzível de planejamentos fictícios\n\nReferência: commit 929e690; nova versão: cópia de trabalho desta auditoria. Dados sintéticos, início 16/11/2026. A ausência de check-ins não autoriza progressão automática na versão nova. Mesma triagem e horizonte em cada comparação. Minutos são da primeira semana; intensidade é a soma em segundos de todo o ciclo comparado. Não é ensaio de eficácia clínica.\n\n| Perfil | Antes min/semana 1 | Depois min/semana 1 | Intenso antes (s) | Intenso depois (s) | Revisão | Caminhada | Técnica |\n|---|---:|---:|---:|---:|---|---|---|\n'+rows.map(row=>`| ${row.perfil} | ${row.antesMin} | ${row.depoisMin} | ${row.antesIntenso} | ${row.depoisIntenso} | ${row.revisao?'Sim':'Não'} | ${row.caminhada?'Sim':'Não'} | ${row.tecnica?'Sim':'Não'} |`).join('\n')+'\n\nReproduzir: `npx tsx scripts/comparar-planos.ts`. Resultados exatos também em COMPARACAO_TREINOS_2026.json. Os testes adicionais verificam limites diários somando modalidades, falta de dados, afastamento, competições próximas, FC incompatível, fadiga, faltas e edição de blocos. Resultados individuais diferem porque os perfis diferem; nenhuma melhoria de desempenho humano foi medida.\n');
console.log(JSON.stringify({perfis:rows.length,resultado:'comparação registrada sem dados reais'}));


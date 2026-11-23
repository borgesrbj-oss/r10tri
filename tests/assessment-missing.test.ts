import {assessmentIssue,assessmentIssues} from '../lib/assessment-review';
import {assessmentReadiness} from '../lib/assessment-validation';
import test from 'node:test';
import assert from 'node:assert/strict';
import { missingAssessmentFields } from '../lib/assessment-missing';
test('triagem identifica campos faltantes e suas etapas sem exigir limiares opcionais',()=>{
 const result=missingAssessmentFields({modality:'triatlo'});
 for(const field of ['level','canSwim','birthDate','currentWeight','availableDays','currentWeeklyVol'])assert.ok(result.some(item=>item.field===field));
 assert.equal(result.find(item=>item.field==='currentWeight')?.step,4);
 assert.ok(!result.some(item=>['ftp','swimCssPace','runThresholdPace'].includes(item.field)));
});
test('pendências desaparecem ao preencher e volume atual zero é permitido',()=>{
 assert.deepEqual(missingAssessmentFields({modality:'corrida',level:'iniciante',birthDate:'1990-01-01',currentWeight:70,availableDays:['seg'],weeklyHours:2,currentWeeklyVol:0,planningPreferences:{recentMinutes:{corrida:0}}}),[]);
});

test('todo campo obrigatório informado pelo servidor aponta para a mesma etapa da triagem',()=>{
 const readiness=assessmentReadiness({});
 for(const issue of readiness.issues){
   const missing=missingAssessmentFields({}).find(item=>item.field===issue.field);
   assert.ok(missing);assert.equal(issue.step,missing.step);
 }
});
test('aviso preserva o caminho do limite diário e ignora dados sem campo conhecido',()=>{
 assert.equal(assessmentIssue('dailyMinutes.seg','Reveja')?.step,7);
 assert.equal(assessmentIssue('restingHeartRate','Reveja')?.step,4);
 assert.deepEqual(assessmentIssues([{field:'password',message:'x'},'x',null]),[]);
 assert.equal(assessmentIssues([{field:'birthDate',message:'Data inválida'}])[0].label,'Data de nascimento');
});

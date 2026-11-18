import test from 'node:test';
import assert from 'node:assert/strict';
import { missingAssessmentFields } from '../lib/assessment-missing';
test('triagem identifica campos faltantes e suas etapas sem exigir limiares opcionais',()=>{
 const result=missingAssessmentFields({modality:'triatlo'});
 for(const field of ['level','canSwim','birthDate','currentWeight','availableDays','weeklyHours','currentWeeklyVol'])assert.ok(result.some(item=>item.field===field));
 assert.equal(result.find(item=>item.field==='currentWeight')?.step,4);
 assert.ok(!result.some(item=>['ftp','swimCssPace','runThresholdPace'].includes(item.field)));
});
test('pendências desaparecem ao preencher e volume atual zero é permitido',()=>{
 assert.deepEqual(missingAssessmentFields({modality:'corrida',level:'iniciante',birthDate:'1990-01-01',currentWeight:70,availableDays:['seg'],weeklyHours:2,currentWeeklyVol:0}),[]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {assessmentData, assessmentReadiness} from '../lib/assessment-validation';

test('triagem recusa FC incoerente, números não finitos e datas inexistentes',()=>{
  assert.equal(assessmentData({maxHeartRate:180,restingHeartRate:190}).ok,false);
  assert.equal(assessmentData({ftp:'Infinity'}).ok,false);
  assert.equal(assessmentData({birthDate:'2020-02-31'}).ok,false);
  assert.equal(assessmentData({availableDays:['dia inventado']}).ok,false);
});
test('triagem não transforma campo vazio em número ou ritmo presumido',()=>{
  const result=assessmentData({ftp:'',runThresholdPace:'',availableDays:[]});
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.data.ftp,null);assert.equal(result.data.runThresholdPace,null);assert.deepEqual(result.data.availableDays,[]);}
});
test('campos de autorização e credenciais são descartados da avaliação',()=>{
  const result=assessmentData({role:'coach',userId:'outro',intervalsIcuApiKey:'valor-que-nao-pode-ser-atribuido'});
  assert.equal(result.ok,true);
  if(result.ok) assert.deepEqual(result.data,{});
});
test('prontidão exige disponibilidade explícita e dados mínimos reais',()=>{
  assert.equal(assessmentReadiness({}).complete,false);
  const profile={birthDate:new Date('1990-01-01'),currentWeight:70,level:'intermediario',weeklyHours:5,availableDays:['seg'],modality:'corrida'};
  assert.equal(assessmentReadiness(profile).complete,true);
  assert.equal(assessmentReadiness({...profile,weeklyHours:0}).complete,false);
});

test('atualização parcial de FC valida o perfil final contra os valores já salvos', () => {
  const previous = { maxHeartRate: 180, restingHeartRate: 60, thresholdHeartRate: 160 };
  assert.equal(assessmentData({ restingHeartRate: 190 }, previous).ok, false);
  assert.equal(assessmentData({ maxHeartRate: 150 }, previous).ok, false);
  assert.equal(assessmentData({ thresholdHeartRate: 190 }, previous).ok, false);
  assert.equal(assessmentData({ maxHeartRate: 200, restingHeartRate: 190 }, previous).ok, true);
  assert.deepEqual(previous, { maxHeartRate: 180, restingHeartRate: 60, thresholdHeartRate: 160 });
});

test('patch legítimo preserva campos omitidos e aceita datas Date já persistidas', () => {
  const previous = { birthDate: new Date('1990-01-01T12:00:00Z'), recentRaceDate: new Date('2020-06-01T12:00:00Z'), maxHeartRate: 180, restingHeartRate: 60, currentWeight: 70, nickname: 'Atleta', userId: 'dono-do-perfil' };
  const result = assessmentData({ currentWeight: '72' }, previous);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.data, { currentWeight: 72 });
  assert.equal(previous.birthDate.toISOString(), '1990-01-01T12:00:00.000Z');
  assert.equal(assessmentData({ restingHeartRate: null }, previous).ok, true);
  assert.equal(assessmentData({ birthDate: '1990-01-01T12:00:00Z' }, previous).ok, false);
});

test('opções vazias significam campo omitido e não apagam a prontidão já confirmada', () => {
  const previous = { birthDate: new Date('1990-01-01T12:00:00Z'), currentWeight: 70, level: 'intermediario', modality: 'corrida', weeklyHours: 5, availableDays: ['seg'] };
  const result = assessmentData({ level: '', modality: '' }, previous);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, {});
    assert.equal(assessmentReadiness({ ...previous, ...result.data }).complete, true);
  }
});

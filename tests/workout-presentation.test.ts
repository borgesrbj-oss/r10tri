import {buildWorkoutStructure} from '../lib/training-structure';
import {stepPrescription,workoutPrescription} from '../lib/training-prescription';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkoutStructure, trainingDistribution, workoutWhatsappMessage } from '../components/workout-structure';

const step = (durationSeconds: number, zone: string | null, rest: 'ativo' | 'passivo' | null = null) => ({ kind: rest ? 'recuperacao' : 'principal', durationSeconds, zone, rest, target: { text: rest === 'passivo' ? 'Pausa' : 'Esforço informado pelo treinador' } });
const workout = (modality: string, steps: ReturnType<typeof step>[]) => ({ structure: { version: 1, modality, durationSeconds: steps.reduce((sum, entry) => sum + entry.durationSeconds, 0), steps } });

test('80/20 usa tempo aeróbico ativo sem somar força e pausas ao denominador', () => {
  const total = trainingDistribution([
    workout('corrida', [step(2400, 'Z2'), step(600, 'Z4'), step(600, null, 'passivo')]),
    workout('forca', [step(3600, null)]),
  ]);
  assert.equal(total.endurance, 3000);
  assert.equal(total.low / total.endurance, 0.8);
  assert.equal(total.high / total.endurance, 0.2);
  assert.equal(total.rest, 600);
  assert.equal(total.strength, 3600);
});

test('recuperação ativa entra na baixa intensidade e Z3 permanece separada', () => {
  const total = trainingDistribution([workout('ciclismo', [step(900, 'Z1', 'ativo'), step(300, 'Z3'), step(300, 'Z5')])]);
  assert.equal(total.low, 900);
  assert.equal(total.moderate, 300);
  assert.equal(total.high, 300);
  assert.equal(total.rest, 0);
});

test('treino legado ou duração inconsistente não recebe estrutura ou intensidade inventada', () => {
  assert.equal(getWorkoutStructure('6x800m'), null);
  assert.equal(getWorkoutStructure({ ...workout('corrida', [step(600, 'Z2')]).structure, durationSeconds: 500 }), null);
  const total = trainingDistribution([{ structure: null }]);
  assert.equal(total.legacy, 1);
  assert.equal(total.endurance, 0);
});

test('texto de WhatsApp compartilha apenas prescrição e não histórico sensível', () => {
  const data = { ...workout('corrida', [step(600, 'Z2')]), title: 'Corrida fácil', date: '2026-11-16', description: 'Observação médica que não deve ser incluída' };
  const message = workoutWhatsappMessage(data);
  assert.ok(message.includes('Corrida fácil'));
  assert.ok(message.includes('10min'));
  assert.ok(message.includes('Z2'));
  assert.equal(message.includes('Observação médica'), false);
});

test('modo km mostra a distância como prescrição e tempo como estimativa na tela e WhatsApp',()=>{
 const structure=buildWorkoutStructure({runStructure:'distancia',runThresholdPace:'05:00',currentWeeklyVol:5},'corrida','base',30);
 const item={structure,duration:30,title:'Corrida por km',date:'2027-01-01'};
 assert.match(workoutPrescription(item),/km.*~30 min/);
 assert.match(stepPrescription(structure,structure.steps[0],seconds=>String(seconds)),/km.*tempo estimado/);
 assert.match(workoutWhatsappMessage(item),/km.*tempo estimado/);
});

test('resumo por km não quebra ao receber estrutura antiga ou inválida',()=>{
 assert.equal(workoutPrescription({duration:30,structure:{prescriptionMode:'distancia',steps:[null]}}),'30 min');
 assert.equal(workoutPrescription({duration:30,structure:null}),'30 min');
});

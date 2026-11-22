import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compileSession,
  sessionSchema,
  draftPreview,
} from '../lib/coach-editor';
import {readWorkoutStructure} from '../lib/training-structure';
import { activeLink, athleteScope } from '../lib/coach-access';
const profile = {
  ftp: 200,
  hasPowerMeter: true,
  availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
};
const block = {
  kind: 'principal',
  label: 'Limiar',
  seconds: 300,
  repeat: 3,
  recoverySeconds: 60,
  zone: 'Z4',
  ftpLow: 95,
  ftpHigh: 100,
};
const spec = () =>
  sessionSchema.parse({
    date: '2027-01-04',
    title: 'Bike',
    modality: 'ciclismo',
    blocks: [block],
  });
test('editor expande repetições e recuperações sem inventar minutos nem watts', () => {
  const [w] = compileSession(spec(), profile);
  const s = w.structure as any;
  assert.equal(s.durationSeconds, 1020);
  assert.equal(w.duration, 17);
  assert.equal(s.steps.length, 5);
  assert.equal(s.steps[0].target.low, 190);
  assert.equal(s.steps[0].target.high, 200);
  assert.equal(s.distribution.highSeconds, 900);
  assert.equal(s.distribution.lowSeconds, 120);
});
test('percentuais incompatíveis com zona ou equipamento não produzem um 80/20 falso', () => {
  assert.throws(
    () =>
      compileSession(
        { ...spec(), blocks: [{ ...spec().blocks[0], zone: 'Z2' }] },
        profile,
      ),
    /fora da zona/,
  );
  assert.throws(
    () => compileSession(spec(), { ...profile, hasPowerMeter: false }),
    /equipamento/,
  );
  assert.equal(
    sessionSchema.safeParse({ ...spec(), blocks: [{ ...block, ftpHigh: 90 }] })
      .success,
    false,
  );
});
test('brick tem três partes independentes e transição fora do tempo de endurance', () => {
  const parts = compileSession(
    sessionSchema.parse({
      ...spec(),
      modality: 'brick',
      transitionSeconds: 120,
      runBlocks: [
        {
          kind: 'principal',
          label: 'Corrida confortável',
          seconds: 600,
          zone: 'Z2',
        },
      ],
    }),
    profile,
  );
  assert.equal(parts.length, 3);
  assert.deepEqual(
    parts.map((w) => w.modality),
    ['ciclismo', 'descanso', 'corrida'],
  );
  assert.equal((parts[1].structure as any).distribution.enduranceSeconds, 0);
  assert.equal(parts[0].spec?.modality, 'ciclismo');
  assert.equal(parts[2].spec?.modality, 'corrida');
});
test('revisão de movimento desconta a semana original e contabiliza a nova sem duplicar', () => {
  const [w] = compileSession(spec(), profile);
  const original = {
    ...w,
    id: 'original',
    date: '2027-01-04',
    updatedAt: new Date(),
    completed: false,
  };
  const changed = { ...w, id: 'original', date: '2027-01-11' };
  const result = draftPreview(
    [original],
    { baseProfileAt: null, changes: [changed] },
    profile,
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].before.minutes, 17);
  assert.equal(result[0].after.minutes, 0);
  assert.equal(result[1].after.minutes, 17);
});
test('validação recusa data inexistente e expansão excessiva antes de publicar', () => {
  assert.equal(
    sessionSchema.safeParse({ ...spec(), date: '2027-02-30' }).success,
    false,
  );
  assert.equal(
    sessionSchema.safeParse({ ...spec(), blocks: [{ ...block, repeat: 31 }] })
      .success,
    false,
  );
  assert.throws(
    () =>
      compileSession(
        {
          ...spec(),
          blocks: [{ ...spec().blocks[0], seconds: 21600, repeat: 30 }],
        },
        profile,
      ),
    /24 horas/,
  );
});
test('vínculo ativo é obrigatório mesmo quando o ator tem papel de coach', async () => {
  const tx = {
    coachAthlete: { findUnique: async () => ({ id: 'link', status: 'ended' }) },
  };
  await assert.rejects(
    activeLink(tx as any, { id: 'coach', role: 'coach' }, 'aluno'),
    /Vínculo/,
  );
  await assert.rejects(
    activeLink(tx as any, { id: 'aluno', role: 'atleta' }, 'aluno'),
    /exclusiva/,
  );
  assert.deepEqual(athleteScope({ id: 'atleta', role: 'atleta' }), {
    id: 'atleta',
  });
  const revoked = {
    coachAthlete: {
      findUnique: async () => ({ id: 'link', status: 'active' }),
      updateMany: async () => ({ count: 0 }),
    },
  };
  await assert.rejects(
    activeLink(revoked as any, { id: 'coach', role: 'coach' }, 'aluno', true),
    /encerrado/,
  );
});

test('prescrição manual curta é lida sem relaxar o contrato do gerador',()=>{const parts=compileSession(sessionSchema.parse({...spec(),modality:'brick',transitionSeconds:120,runBlocks:[{kind:'principal',label:'Corrida',seconds:600,zone:'Z2'}]}),profile);for(const part of parts)assert.ok(readWorkoutStructure(part.structure));const transition=parts[1].structure as any;assert.equal(readWorkoutStructure({...transition,origin:undefined}),null);assert.equal((parts[2].structure as any).distribution.lowSeconds,600);assert.deepEqual(parts.map(w=>w.partOrder),[0,1,2]);assert.equal(new Set(parts.map(w=>w.brickGroupId)).size,1);});

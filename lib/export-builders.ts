// Construtores de arquivos de treino nos formatos nativos das plataformas.
// buildFit -> Garmin Connect (.FIT, todas as modalidades).
// buildZwo -> MyWhoosh / Zwift / Rouvy (.ZWO, ciclismo e corrida).
// Determinístico, sem IA/créditos. Reutilizado pela exportação individual e pela do plano completo.
import { Encoder, Profile } from '@garmin/fitsdk';
import type { FileIdMesg, WorkoutMesg, WorkoutStepMesg } from '@garmin/fitsdk';
import { describeStructure, readWorkoutStructure } from './training-structure';
import type { TrainingStep, WorkoutStructure } from './training-types';

const M = Profile.MesgNum;

export class WorkoutExportError extends Error {}

const sportMap: Record<string, WorkoutMesg['sport']> = {
  ciclismo: 'cycling',
  corrida: 'running',
  natacao: 'swimming',
  forca: 'training',
};

// Estrutura presente e inválida deve ser revisada; nunca substituir seus intervalos por blocos genéricos.
function structureForExport(workout: any): WorkoutStructure | null {
  if (workout?.structure == null) return null;
  const structure = readWorkoutStructure(workout.structure);
  if (!structure || structure.modality !== workout.modality) {
    throw new WorkoutExportError('Estrutura do treino inválida. Peça ao treinador para revisar antes de exportar.');
  }
  return structure;
}

function xmlEscape(value: unknown): string {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function fitText(value: string, maxBytes = 240): string {
  let result = '';
  for (const character of value) {
    if (Buffer.byteLength(result + character, 'utf8') > maxBytes) break;
    result += character;
  }
  return result;
}

function stepNotes(step: TrainingStep): string {
  return `${step.zone ?? 'Repouso'}; ${step.target.text}; ${step.target.source}${step.rest ? `; recuperação ${step.rest === 'passivo' ? 'passiva' : 'ativa'}` : ''}`;
}

function structuredDescription(structure: WorkoutStructure): string {
  return `${structure.requiresCoachReview ? 'REVISÃO DO TREINADOR NECESSÁRIA.\n' : ''}${describeStructure(structure)}`;
}

export function describeWorkoutForExport(workout: any): string {
  const structure = structureForExport(workout);
  if (!structure) return String(workout?.description ?? '');
  // As instruções de ambiente são complementares; tempos e zonas sempre vêm da estrutura validada.
  const environment = String(workout?.description ?? '').split(/\r?\n/).filter(line => /^Ambiente informado:/.test(line));
  return [structuredDescription(structure), ...new Set(environment)].join('\n');
}

function speedRange(step: TrainingStep): [number, number] | null {
  const { target } = step;
  if (step.rest === 'passivo' || target.low <= 0 || target.high <= 0) return null;
  const meters = target.basis === 'run_threshold' && target.unit === 's/km' ? 1000
    : target.basis === 'css' && target.unit === 's/100m' ? 100 : null;
  return meters == null ? null : [meters / target.high, meters / target.low];
}

function buildStructuredFit(workout: any, structure: WorkoutStructure, mode: 'zona' | 'km'): Buffer {
  const steps = structure.steps.map((step, messageIndex): WorkoutStepMesg => {
    const speed = speedRange(step);
    const paceDistance = step.target.basis === 'run_threshold' && step.target.low > 0
      ? step.durationSeconds / ((step.target.low + step.target.high) / 2) * 1000 : null;
    // Somente o principal de corrida usa a estimativa de distância calculada pelo motor com pace informado.
    const estimatedDistance = mode === 'km' && structure.modality === 'corrida' && step.kind === 'principal'
      && speed != null && step.distanceMeters != null && paceDistance != null && Math.abs(step.distanceMeters - paceDistance) <= 5.01;
    const target: Pick<WorkoutStepMesg, 'targetType' | 'targetValue' | 'customTargetValueLow' | 'customTargetValueHigh'> = step.target.basis === 'ftp' && step.target.unit === 'W' && step.rest !== 'passivo'
      ? { targetType: 'power', targetValue: 0, customTargetValueLow: 1000 + Math.round(step.target.low), customTargetValueHigh: 1000 + Math.round(step.target.high) }
      : step.target.basis === 'threshold_hr' && step.target.unit === 'bpm' && step.rest !== 'passivo'
      ? { targetType: 'heartRate', targetValue: 0, customTargetValueLow: 100 + Math.round(step.target.low), customTargetValueHigh: 100 + Math.round(step.target.high) }
      : speed ? { targetType: 'speed', targetValue: 0, customTargetValueLow: Math.round(speed[0] * 1000), customTargetValueHigh: Math.round(speed[1] * 1000) }
      : { targetType: 'open' };
    const intensity = step.kind === 'aquecimento' ? 'warmup' : step.kind === 'desaquecimento' ? 'cooldown'
      : step.rest === 'passivo' ? 'rest' : step.kind === 'recuperacao' ? 'recovery' : 'active';
    const notes = `${estimatedDistance ? `DISTÂNCIA ESTIMADA: ${step.distanceMeters} m; prescrição original ${step.durationSeconds} s. ` : ''}${stepNotes(step)}`;
    return {
      messageIndex, wktStepName: fitText(`${step.label} · ${step.zone ?? 'repouso'}`, 100),
      durationType: estimatedDistance ? 'distance' : 'time',
      // O Encoder recebe os campos-base sem aplicar as escalas dos subcampos: tempo em ms; distância em cm.
      durationValue: estimatedDistance ? Math.round(step.distanceMeters! * 100) : step.durationSeconds * 1000,
      ...target, intensity, notes: fitText(notes),
    };
  });
  const encoder = new Encoder();
  const fileId: FileIdMesg = { type: 'workout', manufacturer: 'development', product: 0, timeCreated: scheduledAt(workout), serialNumber: 10001 };
  const summary: WorkoutMesg = { sport: sportMap[structure.modality], numValidSteps: steps.length, wktName: fitText(workout.title || 'Treino', 200), wktDescription: fitText(describeWorkoutForExport(workout)) };
  encoder.onMesg(M.FILE_ID, fileId);
  encoder.onMesg(M.WORKOUT, summary);
  for (const step of steps) encoder.onMesg(M.WORKOUT_STEP, step);
  return Buffer.from(encoder.close());
}

export function slugify(s: string) {
  return (s ?? 'treino').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

// Horário agendado do treino = a data do treino às 04:30 no horário local do Brasil (America/Sao_Paulo, UTC-3).
// Plataformas como Intervals.icu e Garmin usam esse horário ao agendar no calendário; sem ele o treino
// cai em 01:00/meia-noite. 04:30 (pode ser ajustado depois no app de destino).
export function scheduledAt(workout: any): Date {
  const base = workout?.date ? new Date(workout.date) : new Date();
  const d = isNaN(base.getTime()) ? new Date() : base;
  d.setUTCHours(7, 30, 0, 0); // 07:30 UTC = 04:30 em America/Sao_Paulo
  return d;
}

// Data do treino no formato YYYY-MM-DD (para prefixar nomes de arquivo e agendar no calendário).
export function dateStr(workout: any): string | null {
  const base = workout?.date ? new Date(workout.date) : null;
  return base && !isNaN(base.getTime()) ? base.toISOString().slice(0, 10) : null;
}

// Horário de treino padrão (local), usado no envio direto ao Intervals.icu via API.
export const DEFAULT_WORKOUT_TIME = '04:30';

// start_date_local no formato ISO-8601 LOCAL (sem fuso) exigido pelo Intervals.icu: 'YYYY-MM-DDT04:30:00'.
// O Intervals.icu interpreta esse valor como horário local do atleta, então o treino cai às 04:30.
export function intervalsStartLocal(workout: any, time: string = DEFAULT_WORKOUT_TIME): string | null {
  const ds = dateStr(workout);
  return ds ? `${ds}T${time}:00` : null;
}

// Offsets de pace por zona (segundos somados ao pace de limiar) — iguais aos do motor de plano.
const FIT_RUN_OFFSETS: Record<string, [number, number]> = { Z1: [60, 90], Z2: [35, 60], Z3: [15, 35], Z4: [-5, 15], Z5: [-35, -5] };

// Gera um arquivo .FIT estruturado (aquecimento / principal / desaceleração).
// mode='zona' -> passo principal por TEMPO com alvo de ZONA DE FC (alertas de FC no relógio).
// mode='km'   -> passo principal por DISTÂNCIA (metros), alvo aberto (controle por pace/GPS).
//   A distância por km só é aplicada à CORRIDA quando o pace de limiar do atleta é conhecido;
//   caso contrário recai para o modo por tempo (arquivo sempre válido).
export function buildFit(workout: any, opts?: { mode?: 'zona' | 'km'; thresholdPaceSec?: number | null }): Buffer {
  const mode = opts?.mode === 'km' ? 'km' : 'zona';
  const structure = structureForExport(workout);
  if (structure) return buildStructuredFit(workout, structure, mode);
  const thr = opts?.thresholdPaceSec ?? null;
  const sport = sportMap[workout.modality] ?? 'generic';
  const dur = workout.duration || 60;
  const warmMs = Math.round(dur * 0.15 * 60 * 1000);
  const coolMs = Math.round(dur * 0.15 * 60 * 1000);
  const mainMs = Math.max(60000, dur * 60 * 1000 - warmMs - coolMs);
  const zone = workout.targetZone ? parseInt(String(workout.targetZone).replace(/[^0-9]/g, ''), 10) : 0;
  const hasZone = zone >= 1 && zone <= 5;
  const isRun = workout.modality === 'corrida';

  // Distância (em metros) percorrida em `min` minutos numa zona, pelo pace de limiar do atleta.
  const midPace = (z: string) => { const o = FIT_RUN_OFFSETS[z] ?? [35, 60]; return (thr as number) + (o[0] + o[1]) / 2; };
  const distM = (min: number, z: string) => Math.round((min * 60) / midPace(z) * 1000);
  const canKm = mode === 'km' && isRun && thr != null;

  const steps: any[] = [];
  let i = 0;
  steps.push({ messageIndex: i++, wktStepName: 'Aquecimento', durationType: 'time', durationValue: warmMs, targetType: 'open', intensity: 'warmup' });
  if (canKm) {
    // Passo principal por DISTÂNCIA (durationValue em metros).
    let meters: number; let name: string;
    if (zone === 4) { meters = 4800; name = 'Principal 6x800m'; }
    else if (zone === 3) { meters = distM(Math.round(dur * 0.6), 'Z3'); name = 'Principal Tempo'; }
    else { meters = distM(dur, 'Z2'); name = 'Principal'; }
    // FIT: duration_distance usa escala 100 (metros*100). Ex.: 4800 m -> 480000.
    steps.push({ messageIndex: i++, wktStepName: name.slice(0, 200), durationType: 'distance', durationValue: Math.round(Math.max(100, meters) * 100), targetType: 'open', intensity: 'active' });
  } else if (hasZone) {
    steps.push({ messageIndex: i++, wktStepName: ('Principal' + (workout.targetZone ? ' ' + workout.targetZone : '')).slice(0, 200), durationType: 'time', durationValue: mainMs, targetType: 'heartRate', targetValue: zone, intensity: 'active' });
  } else {
    steps.push({ messageIndex: i++, wktStepName: 'Principal', durationType: 'time', durationValue: mainMs, targetType: 'open', intensity: 'active' });
  }
  steps.push({ messageIndex: i++, wktStepName: 'Desaceleração', durationType: 'time', durationValue: coolMs, targetType: 'open', intensity: 'cooldown' });

  const enc = new Encoder();
  const onMesg = (num: any, mesg: any) => enc.onMesg(num, mesg);
  onMesg(M.FILE_ID, { type: 'workout', manufacturer: 'development', product: 0, timeCreated: scheduledAt(workout), serialNumber: 10001 });
  onMesg(M.WORKOUT, { sport, capabilities: 32, numValidSteps: steps.length, wktName: (workout.title || 'Treino').slice(0, 200) });
  for (const s of steps) onMesg(M.WORKOUT_STEP, s);

  const bytes = enc.close();
  return Buffer.from(bytes);
}

// Gera um arquivo .TCX de TREINO (Training Center XML, formato nativo do Garmin).
// É o formato de intercâmbio mais aceito pelo Garmin Connect / Garmin Express / TrainingPeaks
// para treinos PLANEJADOS. Estrutura: TrainingCenterDatabase > Workouts > Workout > Step (1..n).
// Determinístico, sem IA/créditos.
const TCX_SPORT: Record<string, string> = { corrida: 'Running', ciclismo: 'Biking', natacao: 'Other', forca: 'Other' };

function repeatLabel(label: string): string {
  return label.replace(/^Bloco \d+\/\d+ controlado$/, 'Bloco controlado').replace(/^Recuperação \d+\/\d+$/, 'Recuperação');
}

function tcxGroups(steps: TrainingStep[]): { steps: TrainingStep[]; repetitions: number }[] {
  if (steps.length <= 20) return steps.map(step => ({ steps: [step], repetitions: 1 }));
  // TCX limita StepId a 20 e Repetitions a 99. Repetições equivalentes mantêm duração/alvos e ordem.
  const keys = steps.map(step => JSON.stringify({ ...step, label: repeatLabel(step.label) }));
  const costs = Array<number>(steps.length + 1).fill(Infinity);
  const choices: { length: number; count: number }[] = [];
  costs[steps.length] = 0;
  for (let index = steps.length - 1; index >= 0; index--) {
    costs[index] = 1 + costs[index + 1];
    choices[index] = { length: 1, count: 1 };
    for (let length = 1; length <= Math.floor((steps.length - index) / 2); length++) {
      let count = 1;
      while (count < 99 && index + (count + 1) * length <= steps.length
        && keys.slice(index, index + length).every((key, offset) => key === keys[index + count * length + offset])) {
        count++;
        const cost = length + 1 + costs[index + count * length];
        if (cost < costs[index]) { costs[index] = cost; choices[index] = { length, count }; }
      }
    }
  }
  const groups: { steps: TrainingStep[]; repetitions: number }[] = [];
  for (let index = 0; index < steps.length;) {
    const { length, count } = choices[index];
    groups.push({ steps: steps.slice(index, index + length), repetitions: count });
    index += length * count;
  }
  const identifiers = groups.reduce((total, group) => total + (group.repetitions > 1 ? 1 : 0) + group.steps.length, 0);
  if (identifiers > 20) throw new WorkoutExportError('O TCX aceita no máximo 20 identificadores de etapas. Este treino não cabe nesse formato sem alterar os intervalos. Exporte FIT ou TXT para preservar o treino completo.');
  return groups;
}

export function buildTcx(workout: any): string {
  const structure = structureForExport(workout);
  if (structure) {
    const name = xmlEscape(Array.from(String(workout.title || 'Treino')).slice(0, 15).join(''));
    let nextId = 1;
    const renderStep = (step: TrainingStep, tag = 'Step', repeating = false) => {
      const speed = speedRange(step);
      // O schema TCX não prevê alvo de potência/RPE. Esses alvos ficam nas notas completas do treino.
      const target = speed
        ? `<Target xsi:type="Speed_t"><SpeedZone xsi:type="CustomSpeedZone_t"><ViewAs>Pace</ViewAs><LowInMetersPerSecond>${speed[0].toFixed(6)}</LowInMetersPerSecond><HighInMetersPerSecond>${speed[1].toFixed(6)}</HighInMetersPerSecond></SpeedZone></Target>`
        : step.target.basis === 'threshold_hr' && step.target.unit === 'bpm' && step.rest !== 'passivo'
        ? `<Target xsi:type="HeartRate_t"><HeartRateZone xsi:type="CustomHeartRateZone_t"><Low xsi:type="HeartRateInBeatsPerMinute_t"><Value>${Math.round(step.target.low)}</Value></Low><High xsi:type="HeartRateInBeatsPerMinute_t"><Value>${Math.round(step.target.high)}</Value></High></HeartRateZone></Target>`
        : '<Target xsi:type="None_t" />';
      const label = Array.from(`${step.zone ?? 'Repouso'} ${repeating ? repeatLabel(step.label) : step.label}`).slice(0, 15).join('');
      return `      <${tag} xsi:type="Step_t"><StepId>${nextId++}</StepId><Name>${xmlEscape(label)}</Name><Duration xsi:type="Time_t"><Seconds>${step.durationSeconds}</Seconds></Duration><Intensity>${step.rest === 'passivo' ? 'Resting' : 'Active'}</Intensity>${target}</${tag}>`;
    };
    const steps = tcxGroups(structure.steps).map(group => {
      if (group.repetitions === 1) return renderStep(group.steps[0]);
      const id = nextId++;
      return `      <Step xsi:type="Repeat_t"><StepId>${id}</StepId><Repetitions>${group.repetitions}</Repetitions>${group.steps.map(step => renderStep(step, 'Child', true)).join('')}</Step>`;
    }).join('\n');
    const ds = dateStr(workout);
    return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts><Workout Sport="${TCX_SPORT[structure.modality]}"><Name>${name}</Name>
${steps}${ds ? `\n      <ScheduledOn>${ds}</ScheduledOn>` : ''}
      <Notes>${xmlEscape(describeWorkoutForExport(workout))}</Notes>
  </Workout></Workouts>
</TrainingCenterDatabase>`;
  }
  const esc = (s: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const sport = TCX_SPORT[workout?.modality] ?? 'Other';
  const dur = workout?.duration || 60;
  const warm = Math.round(dur * 0.15 * 60);
  const cool = Math.round(dur * 0.15 * 60);
  const main = Math.max(60, dur * 60 - warm - cool);
  const zone = workout?.targetZone ? parseInt(String(workout.targetZone).replace(/[^0-9]/g, ''), 10) : 0;
  const hasZone = zone >= 1 && zone <= 5;
  // Nome do treino no TCX é limitado a 15 caracteres pelo schema do Garmin.
  const name = esc(Array.from(String(workout?.title ?? 'Treino')).slice(0, 15).join('')) || 'Treino';
  const ds = dateStr(workout); // agenda o treino nesse dia (ScheduledOn, formato YYYY-MM-DD)
  const noneTgt = '<Target xsi:type="None_t" />';
  const hrTgt = hasZone
    ? `<Target xsi:type="HeartRate_t"><HeartRateZone xsi:type="PredefinedHeartRateZone_t"><Number>${zone}</Number></HeartRateZone></Target>`
    : noneTgt;
  const step = (id: number, nm: string, secs: number, tgt: string) =>
    `      <Step xsi:type="Step_t">\n` +
    `        <StepId>${id}</StepId>\n` +
    `        <Name>${nm}</Name>\n` +
    `        <Duration xsi:type="Time_t"><Seconds>${secs}</Seconds></Duration>\n` +
    `        <Intensity>Active</Intensity>\n` +
    `        ${tgt}\n` +
    `      </Step>`;
  const steps = [
    step(1, 'Aquecimento', warm, noneTgt),
    step(2, 'Principal', main, hrTgt),
    step(3, 'Volta calma', cool, noneTgt),
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts>
    <Workout Sport="${sport}">
      <Name>${name}</Name>
${steps}${ds ? `
      <ScheduledOn>${ds}</ScheduledOn>` : ''}
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;
}

// Gera um arquivo .ZWO (Zwift/MyWhoosh/Rouvy). Ciclismo usa potência (%FTP); corrida usa Duration com nota de pace.
export function buildZwo(workout: any, opts?: { ftp?: number | null }): string {
  const structure = structureForExport(workout);
  if (structure) {
    if (structure.modality !== 'corrida' && structure.modality !== 'ciclismo') {
      throw new WorkoutExportError('O formato ZWO é destinado a corrida e ciclismo. Para natação ou força, exporte FIT, TCX ou TXT.');
    }
    const ftp = opts?.ftp;
    const hasFtp = typeof ftp === 'number' && Number.isFinite(ftp) && ftp > 0;
    const instructions = 'Alvos em watts requerem o mesmo FTP no aplicativo de destino. Blocos livres preservam pace/percepção nas instruções, sem controle automático de potência.';
    const steps = structure.steps.map(step => {
      const note = `<textevent timeoffset="0" message="${xmlEscape(`${step.label}: ${stepNotes(step)}`)}"/>`;
      if (hasFtp && step.target.basis === 'ftp' && step.target.unit === 'W' && step.rest !== 'passivo') {
        // ZWO trabalha com fração do FTP; o centro da faixa é o alvo executável, com a faixa original nas notas.
        const power = ((step.target.low + step.target.high) / 2 / ftp).toFixed(6);
        return `    <SteadyState Duration="${step.durationSeconds}" Power="${power}">${note}</SteadyState>`;
      }
      return `    <FreeRide Duration="${step.durationSeconds}" FlatRoad="1">${note}</FreeRide>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>R10 TRI</author><name>${xmlEscape(workout.title || 'Treino')}</name>
  <description>${xmlEscape(`${describeWorkoutForExport(workout)}\n${instructions}`)}</description>
  <sportType>${structure.modality === 'corrida' ? 'run' : 'bike'}</sportType><tags/>
  <workout>
${steps}
  </workout>
</workout_file>`;
  }
  const dur = workout?.duration ?? 60;
  const isRun = workout?.modality === 'corrida';
  const sportType = isRun ? 'run' : 'bike';
  const esc = (s: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const zone = workout?.targetZone;
  const mainPower = zone === 'Z4' || zone === 'Z5' ? '0.95' : zone === 'Z3' ? '0.80' : '0.65';
  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>R10 TRI</author>
  <name>${esc(workout?.title ?? 'Treino')}</name>
  <description>${esc(workout?.description ?? '')}</description>
  <sportType>${sportType}</sportType>
  <tags/>
  <workout>
    <Warmup Duration="${Math.round(dur * 0.15 * 60)}" PowerLow="0.40" PowerHigh="0.60"/>
    <SteadyState Duration="${Math.round(dur * 0.70 * 60)}" Power="${mainPower}"/>
    <Cooldown Duration="${Math.round(dur * 0.15 * 60)}" PowerLow="0.55" PowerHigh="0.35"/>
  </workout>
</workout_file>`;
}

// Texto estruturado de fallback (natação/força no MyWhoosh, ou quando não há formato nativo).
export function buildTxt(workout: any): string {
  const structure = structureForExport(workout);
  const modLabels: Record<string, string> = { natacao: 'Natação', ciclismo: 'Ciclismo', corrida: 'Corrida', forca: 'Força' };
  const mod = modLabels[workout?.modality] ?? workout?.modality ?? 'Treino';
  return `=== ${mod}: ${workout?.title ?? 'Treino'} ===
Data: ${workout?.date ? new Date(workout.date).toLocaleDateString('pt-BR') : ''}
Duração: ${structure ? `${structure.durationSeconds} s (${structure.durationSeconds / 60} min)` : `${workout?.duration ?? 0} min`}
Zona-alvo: ${workout?.targetZone ?? 'N/A'}
Semana: ${workout?.weekNumber ?? ''}

--- DESCRIÇÃO ---
${describeWorkoutForExport(workout)}

Gerado por R10 TRI
`;
}

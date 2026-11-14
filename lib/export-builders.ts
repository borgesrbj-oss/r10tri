// Construtores de arquivos de treino nos formatos nativos das plataformas.
// buildFit -> Garmin Connect (.FIT, todas as modalidades).
// buildZwo -> MyWhoosh / Zwift / Rouvy (.ZWO, ciclismo e corrida).
// Determinístico, sem IA/créditos. Reutilizado pela exportação individual e pela do plano completo.
import { Encoder, Profile } from '@garmin/fitsdk';

const M = Profile.MesgNum;

const sportMap: Record<string, string> = {
  ciclismo: 'cycling',
  corrida: 'running',
  natacao: 'swimming',
  forca: 'training',
};

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
export function buildTcx(workout: any): string {
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
export function buildZwo(workout: any): string {
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
  const modLabels: Record<string, string> = { natacao: 'Natação', ciclismo: 'Ciclismo', corrida: 'Corrida', forca: 'Força' };
  const mod = modLabels[workout?.modality] ?? workout?.modality ?? 'Treino';
  return `=== ${mod}: ${workout?.title ?? 'Treino'} ===
Data: ${workout?.date ? new Date(workout.date).toLocaleDateString('pt-BR') : ''}
Duração: ${workout?.duration ?? 0} min
Zona-alvo: ${workout?.targetZone ?? 'N/A'}
Semana: ${workout?.weekNumber ?? ''}

--- DESCRIÇÃO ---
${workout?.description ?? ''}

Gerado por R10 TRI
`;
}

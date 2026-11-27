import type { TrainingModality, TrainingProfile, TrainingTarget, TrainingZone } from './training-types';
import { criticalSwimSpeed } from './triathlon-metrics';

export function numericValue(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parsePaceSeconds(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{1,3}:[0-5]\d$/.test(value.trim())) return null;
  const [minutes, seconds] = value.trim().split(':').map(Number);
  const total = minutes * 60 + seconds;
  return total > 0 ? total : null;
}

export function formatPaceSeconds(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

/** CSS é a inclinação distância/tempo; com 400 e 200 m, ritmo/100 m = (t400-t200)/2. */
export function cssFromTests(time400: unknown, time200: unknown): number | null {
  const longer = parsePaceSeconds(time400);
  const shorter = parsePaceSeconds(time200);
  if (!longer || !shorter || longer < shorter * 2) return null;
  const pace = criticalSwimSpeed(longer, shorter)?.secondsPer100m;
  return pace != null && pace >= 25 && pace <= 600 ? pace : null;
}

export function ftpFromTwentyMinutes(watts: unknown): number | null {
  const value = numericValue(watts);
  return value != null && value >= 1 && value <= 1500 ? Math.max(1, Math.round(value * 0.95)) : null;
}

export function runThreshold(profile: TrainingProfile | null): number | null {
  const value = parsePaceSeconds(profile?.runThresholdPace) ?? parsePaceSeconds(profile?.testRunPace);
  return value != null && value >= 90 && value <= 1200 ? value : null;
}

export function swimThreshold(profile: TrainingProfile | null): number | null {
  const value = parsePaceSeconds(profile?.swimCssPace) ?? cssFromTests(profile?.testCSS400, profile?.testCSS200) ?? parsePaceSeconds(profile?.testCSSPace);
  return value != null && value >= 25 && value <= 600 ? value : null;
}

export function bikeThreshold(profile: TrainingProfile | null): number | null {
  const value = numericValue(profile?.ftp) ?? ftpFromTwentyMinutes(profile?.testFTP20min) ?? numericValue(profile?.testFTPEstimated);
  return value != null && value > 0 && value <= 1500 ? value : null;
}

const RPE: Record<TrainingZone, [number, number]> = { Z1: [1, 2], Z2: [2, 3], Z3: [4, 5], Z4: [6, 7], Z5: [8, 9] };
const POWER: Record<TrainingZone, [number, number]> = { Z1: [0.4, 0.55], Z2: [0.56, 0.75], Z3: [0.76, 0.90], Z4: [0.91, 1.05], Z5: [1.06, 1.20] };
// Faixas operacionais relativas a um limiar informado; não são uma conversão VDOT.
const RUN: Record<TrainingZone, [number, number]> = { Z1: [1.25, 1.40], Z2: [1.12, 1.25], Z3: [1.04, 1.12], Z4: [0.97, 1.03], Z5: [0.90, 0.96] };
const SWIM: Record<TrainingZone, [number, number]> = { Z1: [12, 20], Z2: [6, 12], Z3: [3, 6], Z4: [-1, 2], Z5: [-5, -2] };

export function effortTarget(zone: TrainingZone, source = 'Percepção de esforço; limiar específico não informado.'): TrainingTarget {
  const [low, high] = RPE[zone];
  return { basis: 'rpe', unit: 'RPE', low, high, source, text: `Percepção ${low}–${high}/10${zone === 'Z1' || zone === 'Z2' ? ', confortável e conversacional' : ', forte e controlada, sem esforço máximo'}` };
}

export function targetForZone(profile: TrainingProfile | null, modality: TrainingModality, zone: TrainingZone): TrainingTarget {
  if (modality === 'forca') return effortTarget('Z2', 'Força e mobilidade orientadas pelo treinador; sem equivalência automática de FC.');
  if (modality === 'ciclismo') {
    const ftp = bikeThreshold(profile);
    const canReadPower = profile?.hasPowerMeter !== false || profile?.hasTrainer === true;
    if (ftp && canReadPower) {
      const [lo, hi] = POWER[zone];
      const low = Math.round(ftp * lo), high = Math.round(ftp * hi);
      return { basis: 'ftp', unit: 'W', low, high, source: profile?.ftp ? 'FTP informado; faixas de Coggan.' : 'FTP estimado informado; confirmar com treinador.', text: `${low}–${high} W (${Math.round(lo * 100)}–${Math.round(hi * 100)}% do FTP)` };
    }
    return effortTarget(zone, ftp ? 'FTP informado, mas sem medidor de potência/rolo configurado; utilizar percepção.' : 'FTP não informado; não foram inventados alvos em watts.');
  }
  if (modality === 'corrida') {
    const heartRate = numericValue(profile?.thresholdHeartRate);
    const maximum = numericValue(profile?.maxHeartRate);
    const resting = numericValue(profile?.restingHeartRate);
    const consistent = heartRate && (!maximum || heartRate <= maximum) && (!resting || resting < heartRate);
    if (profile?.runStructure === 'zona' && profile.hasHRM !== false && consistent && heartRate >= 60 && heartRate <= 230) {
      // Friel, tabela revisada em setembro/2025: FTHR, sem estimar FC pela idade.
      const bands: Record<TrainingZone, [number, number]> = { Z1: [0.5, 0.78], Z2: [0.78, 0.87], Z3: [0.87, 0.94], Z4: [0.94, 1], Z5: [1, 1.05] };
      const [lo, hi] = bands[zone];
      const max = maximum;
      const low = Math.ceil(heartRate * lo);
      const high = Math.max(low, Math.min(zone === 'Z5' ? Math.floor(heartRate * hi) : Math.ceil(heartRate * hi) - 1, max ?? 250));
      return { basis: 'threshold_hr', unit: 'bpm', low, high, source: 'FC de limiar funcional informada; cinco faixas operacionais do Gotri, sem equivalência literal às sete zonas Friel. Piso Z1 de 50% e teto Z5 de 105% são limites operacionais do app. FC responde com atraso em intervalos curtos; revisar com treinador.', text: `${low}–${high} bpm` };
    }
    const threshold = runThreshold(profile);
    if (threshold) {
      const [lo, hi] = RUN[zone];
      const low = Math.round(threshold * lo), high = Math.round(threshold * hi);
      return { basis: 'run_threshold', unit: 's/km', low, high, source: 'Faixa operacional relativa ao limiar informado/testado; revisar com o treinador.', text: `${formatPaceSeconds(low)}–${formatPaceSeconds(high)}/km` };
    }
    return effortTarget(zone, 'Limiar de corrida não informado; tempo de 3 km isolado e ritmo desejado não foram tratados como VDOT.');
  }
  const css = swimThreshold(profile);
  if (css) {
    const [lo, hi] = SWIM[zone];
    const low = Math.max(20, Math.round(css + lo)), high = Math.max(20, Math.round(css + hi));
    const source = parsePaceSeconds(profile?.swimCssPace) ? 'CSS informado no perfil.' : 'CSS derivado dos testes de 400/200 m.';
    return { basis: 'css', unit: 's/100m', low, high, source: `${source} Ajustar ao tamanho da piscina.`, text: `${formatPaceSeconds(low)}–${formatPaceSeconds(high)}/100 m` };
  }
  return effortTarget(zone, 'CSS não informado; não foram inventados ritmos de natação.');
}

export function thresholdWarnings(profile: TrainingProfile | null, modality: TrainingModality): string[] {
  if (modality === 'corrida' && profile?.runStructure === 'zona') {
    if (targetForZone(profile,'corrida','Z2').unit === 'bpm') return ['Faixas de FC usam o limiar funcional informado; FC não deve ser perseguida em intervalos curtos por seu atraso de resposta.'];
    return ['Modo FC sem limiar funcional ou monitor: usar limiar de pace quando disponível; caso contrário, percepção. Nenhuma FC foi estimada pela idade.'];
  }
  if (modality === 'corrida' && !runThreshold(profile)) return ['Sem limiar de corrida: prescrição por percepção, sem pace ou FC fictícios.'];
  if (modality === 'ciclismo' && !bikeThreshold(profile)) return ['Sem FTP: prescrição por percepção, sem potência fictícia.'];
  if (modality === 'ciclismo' && profile?.hasPowerMeter === false && profile?.hasTrainer !== true) return ['Sem medidor de potência/rolo: alvos de ciclismo usam percepção de esforço.'];
  if (modality === 'natacao' && !swimThreshold(profile)) return ['Sem CSS: prescrição por percepção, sem ritmo fictício por 100 m.'];
  return [];
}

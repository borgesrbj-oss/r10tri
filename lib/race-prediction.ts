/** Regra de potência de Riegel, não VDOT: https://doi.org/10.1371/journal.pone.0157257 */
export const RIEGEL_EXPONENT = 1.06;
// Limite de atualidade do produto; não é uma medida de validade fisiológica.
export const MAX_RESULT_AGE_DAYS = 180;

export function parseRaceTime(value: string): number | null {
  const clean = value.trim();
  if (!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(clean)) return null;
  const parts = clean.split(':').map(Number);
  if (parts.slice(1).some(part => part > 59)) return null;
  const seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  return seconds > 0 ? seconds : null;
}

export function formatRaceTime(value: number): string {
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

type PredictionInput = {
  modality?: string | null;
  recentRaceDistanceKm?: unknown;
  recentRaceTimeSeconds?: unknown;
  recentRaceDate?: Date | string | null;
  targetDistanceKm: unknown;
};

export type RacePredictionResult =
  | { available: false; reason: string }
  | { available: true; seconds: number; paceSecondsPerKm: number; resultAgeDays: number; warnings: string[] };

export function predictRaceTime(input: PredictionInput, now: Date): RacePredictionResult {
  if (input.modality !== 'corrida') return { available: false, reason: 'A estimativa está disponível apenas para provas de corrida. O tempo total de um triatlo exige dados separados das modalidades e transições.' };
  const distance = Number(input.recentRaceDistanceKm);
  const seconds = Number(input.recentRaceTimeSeconds);
  const target = Number(input.targetDistanceKm);
  if (!Number.isFinite(target) || target <= 0) return { available: false, reason: 'Escolha a distância da prova de corrida que deseja estimar.' };
  if (!Number.isFinite(distance) || distance < 3 || distance > 42.195 || !Number.isInteger(seconds) || seconds <= 0 || !input.recentRaceDate) {
    return { available: false, reason: 'Registre na triagem a distância, o tempo e a data de uma prova de corrida recente entre 3 km e maratona. Nenhum resultado será presumido.' };
  }
  const resultDate = new Date(input.recentRaceDate);
  if (!Number.isFinite(resultDate.getTime()) || !Number.isFinite(now.getTime())) return { available: false, reason: 'A data do resultado precisa ser válida.' };
  const originalDay = input.recentRaceDate instanceof Date ? input.recentRaceDate.toISOString().slice(0, 10) : input.recentRaceDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(originalDay) || resultDate.toISOString().slice(0, 10) !== originalDay) return { available: false, reason: 'A data do resultado precisa ser válida.' };
  const day = new Date(`${originalDay}T00:00:00Z`).getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const ageDays = Math.floor((today - day) / 86_400_000);
  if (ageDays < 0) return { available: false, reason: 'O resultado informado está no futuro. Use uma prova já concluída.' };
  if (ageDays > MAX_RESULT_AGE_DAYS) return { available: false, reason: `Atualize seu resultado de corrida: o app utiliza apenas resultados dos últimos ${MAX_RESULT_AGE_DAYS} dias.` };
  if (target < 3 || target > 42.195 || seconds / distance < 120 || seconds / distance > 1200) return { available: false, reason: 'Confira a distância e o tempo informados. A estimativa não será calculada com dados fora da faixa suportada.' };
  const predicted = seconds * Math.pow(target / distance, RIEGEL_EXPONENT);
  if (!Number.isFinite(predicted)) return { available: false, reason: 'Não foi possível calcular uma estimativa com esses dados.' };
  return {
    available: true,
    seconds: Math.round(predicted),
    paceSecondsPerKm: predicted / target,
    resultAgeDays: ageDays,
    warnings: [
      'Estimativa matemática de Riegel, não VDOT, meta garantida ou prescrição de ritmo de treino.',
      'Pressupõe esforço de prova e preparação comparável. Clima, percurso, fadiga e resistência específica podem mudar muito o resultado.',
      ...(target > distance * 2 ? ['A distância alvo é mais que o dobro da distância de referência; revise a extrapolação com seu treinador.'] : []),
    ],
  };
}

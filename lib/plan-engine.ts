// Fachada compatível com o motor anterior. A geração atual usa passos e duração real.
import { buildWorkoutStructure, describeStructure, generateStructuredPlan } from './training-structure';
import { numericValue, parsePaceSeconds } from './training-zones';
import type { TrainingProfile, TrainingRace, TrainingZone } from './training-types';

export { generateStructuredPlan } from './training-structure';

export function paceToSec(p?: string | null): number | null {
  return parsePaceSeconds(p);
}

/** Aproximação legada, preservada para compatibilidade; não é um cálculo de VDOT. */
export function thresholdFrom3k(t3k?: string | null): number | null {
  const total = paceToSec(t3k);
  return total ? Math.round(total / 3 + 18) : null;
}

/** Preferências legadas de zona, sem equivalência com a distribuição por tempo do novo plano. */
export function runZonesForRace(dist?: string | null): string[] {
  const map: Record<string, string[]> = {
    '5k': ['Z5', 'Z2', 'Z4', 'Z2long'], '10k': ['Z4', 'Z2', 'Z5', 'Z2long'],
    '21k': ['Z3', 'Z2', 'Z4', 'Z2long'], '42k': ['Z2', 'Z3', 'Z4', 'Z2long'],
    supersprint: ['Z4', 'Z2', 'Z5', 'Z2'], sprint: ['Z4', 'Z2', 'Z5', 'Z2'],
    olimpico: ['Z3', 'Z2', 'Z4', 'Z2long'], '70.3': ['Z3', 'Z2', 'Z2', 'Z2long'],
    ironman: ['Z2', 'Z3', 'Z2', 'Z2long'],
  };
  return map[dist || ''] || ['Z2', 'Z3', 'Z4', 'Z2long'];
}

export function buildRunDescription(profile: TrainingProfile | null, zone: string, dur: number, dayNum: number, opts?: { isLong?: boolean }): string {
  if (!Number.isFinite(dur) || dur < 4) return 'Informe uma duração válida antes de estruturar a sessão.';
  const selected: TrainingZone = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].includes(zone) ? zone as TrainingZone : 'Z2';
  const high = !opts?.isLong && (selected === 'Z4' || selected === 'Z5') ? Math.floor(dur * 60 * 0.4 / 30) * 30 : 0;
  const structure = buildWorkoutStructure(profile, 'corrida', 'base', Math.round(dur), high, selected, selected === 'Z3' ? 'Z3' : 'Z2');
  let environment = '';
  try {
    const day = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][dayNum];
    const setting = JSON.parse(profile?.runEnvByDay || '{}')[day];
    if (setting === 'esteira') environment = '\nAmbiente informado: esteira; ajuste com seu treinador.';
    if (setting === 'rua') environment = '\nAmbiente informado: rua; considere terreno e condições locais.';
  } catch { /* Preferências legadas inválidas não alteram os passos do treino. */ }
  return `${opts?.isLong ? 'Sessão aeróbica longa, conforme duração informada.\n' : ''}${describeStructure(structure)}${environment}`;
}

export function generateNutrition(profile: any) {
  const measuredWeight = numericValue(profile?.currentWeight);
  if (measuredWeight == null || measuredWeight < 20 || measuredWeight > 350) {
    return 'GUIA GERAL DE ALIMENTAÇÃO E HIDRATAÇÃO\n\nPeso não informado ou inválido: não foram inventados peso, calorias ou macronutrientes. Informe seus dados e revise necessidades com um nutricionista esportivo.\n\nOrganize refeições habituais, teste a alimentação dos treinos antes das provas e ajuste hidratação ao ambiente e à orientação profissional. Restrições alimentares, condições de saúde e objetivos de composição corporal exigem acompanhamento individual.';
  }
  const w = measuredWeight;
  const mod = profile?.modality ?? 'triatlo';
  const modLabel: Record<string, string> = { triatlo: 'Triatlo', natacao: 'Natação', ciclismo: 'Ciclismo', corrida: 'Corrida' };
  const prot = Math.round(w * 1.8);
  const carbLow = Math.round(w * 5);
  const carbHigh = Math.round(w * 8);
  const fat = Math.round(w * 1);
  const kcalLow = Math.round(prot * 4 + carbLow * 4 + fat * 9);
  const kcalHigh = Math.round(prot * 4 + carbHigh * 4 + fat * 9);
  const waterMl = Math.round(w * 35);
  return `GUIA NUTRICIONAL GERAL — ESTIMATIVAS PARA REVISÃO (${modLabel[mod] ?? mod}) — base: ${w} kg

== METAS DIÁRIAS (ajuste pelo volume do dia) ==
• Calorias: ${kcalLow}–${kcalHigh} kcal/dia (use a faixa alta em dias de treino longo/intenso e a baixa em dias leves/descanso).
• Proteínas: ~${prot} g/dia (1,8 g/kg) — distribua em 4–5 refeições de 25–40 g.
• Carboidratos: ${carbLow}–${carbHigh} g/dia (5–8 g/kg) — periodize conforme a carga do dia.
• Gorduras boas: ~${fat} g/dia (azeite, castanhas, abacate, peixes).
• Hidratação base: ~${waterMl} ml/dia + reposição nos treinos.

== ANTES DO TREINO (1–3 h) ==
• Refeição rica em carboidrato de fácil digestão + proteína moderada e pouca gordura/fibra. Ex.: pão/tapioca + ovo/queijo + fruta.
• Treino cedo e curto: lanche leve (banana, torrada com mel) 30–60 min antes.

== DURANTE O TREINO ==
• Até 60 min: água.
• 60–150 min: 30–60 g de carboidrato/hora (gel, isotônico, fruta) + água com eletrólitos.
• Acima de 150 min: 60–90 g de carboidrato/hora (mix glicose+frutose) e sódio (300–700 mg/hora).

== APÓS O TREINO (até 30–60 min) ==
• Recuperação: carboidrato (~1 g/kg) + proteína (20–30 g). Ex.: vitamina de leite/whey com fruta e aveia.
• Reidrate: 1,5 L de líquido para cada 1 kg perdido no treino.

== DIAS DE PROVA ==
• Café 3–4 h antes, rico em carboidrato já testado nos treinos. Nada novo no dia da prova.
• Siga a estratégia de carboidrato/hidratação treinada.

Observação: este guia é um ponto de partida geral. Para restrições, condições de saúde ou objetivos específicos de composição corporal, consulte um nutricionista esportivo.`;
}


/** Mantém assinatura e retorno em lista para consumidores existentes. */
export function generateFallbackPlan(profile: TrainingProfile | null, races: TrainingRace[], daysAvail: string[], startDate?: string | Date | null, weeks?: number | string | null) {
  return generateStructuredPlan(profile, races, daysAvail, startDate, weeks).workouts;
}
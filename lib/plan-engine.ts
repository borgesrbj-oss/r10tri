// Motor de geração de plano 100% GRATUITO (determinístico, sem IA/créditos).
// Funções puras: recebem o perfil do atleta e produzem um programa periodizado completo
// (base -> construção -> pico -> polimento) respeitando a distribuição semanal fixa do atleta.

// Helpers de pace (mm:ss) — usados para prescrição precisa por zona de FC e por distância/km.
export function paceToSec(p?: string | null): number | null {
  if (!p) return null;
  const parts = String(p).trim().split(':');
  if (parts.length !== 2) return null;
  const m = Number(parts[0]); const s = Number(parts[1]);
  if (isNaN(m) || isNaN(s)) return null;
  return m * 60 + s;
}
function secToPace(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Deriva o pace de LIMIAR (threshold, s/km) a partir do teste de 3 km (metodologia Daniels/VDOT):
// pace médio do 3 km + ~18 s/km ≈ ritmo de limiar sustentável. É a base para TODAS as zonas de corrida.
// Ex.: 3 km em 14:30 → 290 s/km de média → ~308 s/km (5:08/km) de limiar.
export function thresholdFrom3k(t3k?: string | null): number | null {
  const total = paceToSec(t3k); // paceToSec interpreta mm:ss como tempo total do teste de 3 km
  if (!total) return null;
  return Math.round(total / 3 + 18);
}

// Ênfase de zonas de corrida por DISTÂNCIA-ALVO (periodização específica da prova).
// O marcador 'Z2long' indica o Longão (corrida longa) da semana. Determinístico, sem IA/créditos.
export function runZonesForRace(dist?: string | null): string[] {
  const map: Record<string, string[]> = {
    '5k': ['Z5', 'Z2', 'Z4', 'Z2long'],
    '10k': ['Z4', 'Z2', 'Z5', 'Z2long'],
    '21k': ['Z3', 'Z2', 'Z4', 'Z2long'],
    '42k': ['Z2', 'Z3', 'Z4', 'Z2long'],
    supersprint: ['Z4', 'Z2', 'Z5', 'Z2'],
    sprint: ['Z4', 'Z2', 'Z5', 'Z2'],
    olimpico: ['Z3', 'Z2', 'Z4', 'Z2long'],
    '70.3': ['Z3', 'Z2', 'Z2', 'Z2long'],
    ironman: ['Z2', 'Z3', 'Z2', 'Z2long'],
  };
  return map[dist ?? ''] ?? ['Z2', 'Z3', 'Z4', 'Z2long'];
}

// ===== CORRIDA: descrição estruturada em DUAS opções (FC e DISTÂNCIA/KM) =====
// Metodologia alinhada aos melhores treinadores do mundo (Jack Daniels — pace E/M/T/I,
// Joe Friel — "Triathlete's Training Bible", Matt Fitzgerald): TODA sessão de corrida
// informa SEMPRE a DISTÂNCIA a percorrer (tiros em metros + distância total da sessão),
// além do pace/km e da zona de FC equivalente. Determinístico, sem IA/créditos.
const RUN_OFFSETS: Record<string, [number, number]> = { Z1: [60, 90], Z2: [35, 60], Z3: [15, 35], Z4: [-5, 15], Z5: [-35, -5] };
export function buildRunDescription(profile: any, zone: string, dur: number, dayNum: number, opts?: { isLong?: boolean }): string {
  const isLong = opts?.isLong === true;
  const km = (v: number) => v.toFixed(1).replace('.', ',');
  const numToDay: Record<number, string> = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
  const runEnv: Record<string, string> = (() => { try { return JSON.parse(profile?.runEnvByDay || '{}') ?? {}; } catch { return {}; } })();
  const e = runEnv[numToDay[dayNum]] ?? 'rua';
  const env = e === 'esteira'
    ? ' Cenário: na ESTEIRA — use inclinação 1% para simular a rua e mantenha o pace alvo.'
    : ' Cenário: na RUA — terreno variável, controle por GPS/pace e FC.';

  // Pace de limiar derivado PRIORITARIAMENTE do teste de 3 km (VDOT/Daniels); fallback para o pace informado.
  const thr = thresholdFrom3k(profile?.testRun3km) ?? paceToSec(profile?.testRunPace || profile?.runPace);
  const paceRange = (z: string): { lo: number; hi: number } | null => {
    if (!thr) return null;
    const [o1, o2] = RUN_OFFSETS[z] ?? [35, 60];
    return { lo: Math.min(thr + o1, thr + o2), hi: Math.max(thr + o1, thr + o2) };
  };
  const paceStrOf = (z: string): string | null => { const r = paceRange(z); return r ? `${secToPace(r.lo)}–${secToPace(r.hi)}/km` : null; };
  const distFromTime = (min: number, z: string): number | null => { const r = paceRange(z); if (!r) return null; return (min * 60) / ((r.lo + r.hi) / 2); };
  const zoneName: Record<string, string> = { Z2: 'fácil/aeróbico', Z3: 'maratona/tempo', Z4: 'limiar', Z5: 'VO₂máx' };

  let body: string;
  if (isLong) {
    // Longão (corrida longa) — base aeróbica e resistência específica (Friel/Daniels "L").
    const pace = paceStrOf('Z2');
    const total = distFromTime(dur, 'Z2');
    const finalMin = Math.round(dur * 0.2);
    body = `Longão de ${dur}min em ritmo fácil/aeróbico${total != null ? ` — distância ~${km(total)} km` : ''}. Mantenha Z2 conversacional; nos últimos ${finalMin}min, opcional elevar a Z3 (ritmo de maratona) se estiver bem. Hidrate e pratique a nutrição de prova (gel/isotônico a cada 30–40min). 🎯 Opção FC: Zona 2 (${zoneName.Z2}), subindo a Z3 no final. 🏃 Opção distância: percorra ~${total != null ? km(total) : '—'} km${pace ? ` no ritmo ${pace}` : ''}.`;
  } else if (zone === 'Z5') {
    // Intervalado de VO₂máx (Daniels "I"): repetições de 1000 m fortes com trote de recuperação.
    const pace = paceStrOf('Z5') ?? 'pace de VO₂máx';
    const reps = dur >= 55 ? 5 : 4;
    const repsKm = reps * 1.0;
    const wu = distFromTime(12, 'Z2');
    const cd = distFromTime(10, 'Z2');
    const rec = distFromTime(reps * 3, 'Z1');
    const total = wu != null && cd != null && rec != null ? wu + repsKm + rec + cd : null;
    body = `Aquecer 12min em Z1–Z2${wu != null ? ` (~${km(wu)} km)` : ''}. Principal: ${reps}x1000m no VO₂máx — ${km(repsKm)} km de tiros a ${pace}, com 3min de trote entre os tiros. Desaquecer 10min${cd != null ? ` (~${km(cd)} km)` : ''}. 🎯 Opção FC: Zona 5 (${zoneName.Z5}). 🏃 Opção distância: ${reps} tiros de 1000 m (${km(repsKm)} km de tiros)${total != null ? ` — sessão completa ~${km(total)} km` : ''}, no ritmo ${pace}.`;
  } else if (zone === 'Z4') {
    // Intervalado de limiar (Daniels "T" / Garmin Coach): 6x800m com 90s de trote.
    const pace = paceStrOf('Z4') ?? 'pace de limiar';
    const repsKm = 6 * 0.8; // 4,8 km de tiros (fixo, independe do pace)
    const wu = distFromTime(10, 'Z2');
    const cd = distFromTime(10, 'Z2');
    const rec = distFromTime(6 * 1.5, 'Z1'); // 6 trotes de 90s
    const total = wu != null && cd != null && rec != null ? wu + repsKm + rec + cd : null;
    body = `Aquecer 10min em Z1–Z2${wu != null ? ` (~${km(wu)} km)` : ''}. Principal: 6x800m no limiar — ${km(repsKm)} km de tiros a ${pace}, com 90s de trote entre os tiros. Desaquecer 10min${cd != null ? ` (~${km(cd)} km)` : ''}. 🎯 Opção FC: Zona 4 (${zoneName.Z4}). 🏃 Opção distância: 6 tiros de 800 m (${km(repsKm)} km de tiros)${total != null ? ` — sessão completa ~${km(total)} km` : ''}, no ritmo ${pace}.`;
  } else if (zone === 'Z3') {
    // Tempo run / ritmo de maratona (Daniels "M/T", Friel).
    const pace = paceStrOf('Z3');
    const mainMin = Math.round(dur * 0.6);
    const mainKm = distFromTime(mainMin, 'Z3');
    const wu = distFromTime(10, 'Z2');
    const cd = distFromTime(5, 'Z2');
    const total = mainKm != null && wu != null && cd != null ? wu + mainKm + cd : null;
    body = `Aquecer 10min leve${wu != null ? ` (~${km(wu)} km)` : ''}. Principal: ${mainMin}min progressivo no ritmo de tempo/maratona${mainKm != null ? ` — ~${km(mainKm)} km` : ''} a ${pace ?? 'ritmo de tempo'}. Desaquecer 5min${cd != null ? ` (~${km(cd)} km)` : ''}. 🎯 Opção FC: Zona 3 (${zoneName.Z3}). 🏃 Opção distância: percorra ~${mainKm != null ? km(mainKm) : '—'} km no bloco principal${total != null ? ` (sessão completa ~${km(total)} km)` : ''}.`;
  } else {
    // Corrida contínua fácil (Daniels "E", base aeróbica).
    const pace = paceStrOf('Z2');
    const total = distFromTime(dur, 'Z2');
    body = `Corrida contínua de ${dur}min, cadência alta (>170spm)${total != null ? ` — distância ~${km(total)} km` : ''}. 🎯 Opção FC: Zona 2 (${zoneName.Z2}, ritmo conversacional). 🏃 Opção distância: percorra ~${total != null ? km(total) : '—'} km${pace ? ` no ritmo ${pace}` : ''}.`;
  }

  const noThr = !thr ? ' (defina seu teste de 3 km — ou o pace/teste de corrida — no perfil para calcular as distâncias com precisão).' : '';
  return `${body} 📊 Controle por ZONA DE FC (${isLong ? 'Z2–Z3' : zone}) OU por DISTÂNCIA/PACE — ambas equivalem à mesma intensidade.${noThr}` + env;
}

export function generateNutrition(profile: any) {
  const w = Number(profile?.currentWeight) || 70;
  const mod = profile?.modality ?? 'triatlo';
  const modLabel: Record<string, string> = { triatlo: 'Triatlo', natacao: 'Natação', ciclismo: 'Ciclismo', corrida: 'Corrida' };
  const prot = Math.round(w * 1.8);
  const carbLow = Math.round(w * 5);
  const carbHigh = Math.round(w * 8);
  const fat = Math.round(w * 1);
  const kcalLow = Math.round(prot * 4 + carbLow * 4 + fat * 9);
  const kcalHigh = Math.round(prot * 4 + carbHigh * 4 + fat * 9);
  const waterMl = Math.round(w * 35);
  return `PLANO NUTRICIONAL PERSONALIZADO (${modLabel[mod] ?? mod}) — base: ${w} kg

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

export function generateFallbackPlan(profile: any, races: any[], daysAvail: string[], startDate?: string | Date | null, weeks?: number | string | null) {
  const workouts: any[] = [];
  // Dia de início escolhido pelo atleta (opcional). Se inválido/ausente, começa hoje.
  const parsedStart = startDate ? new Date(startDate) : null;
  const now = parsedStart && !isNaN(parsedStart.getTime()) ? parsedStart : new Date();
  // Número de semanas escolhido pelo atleta (mínimo 6, máximo 24). Quando definido, tem prioridade sobre a data da prova.
  const reqWeeks = (weeks != null && Number(weeks) >= 6) ? Math.min(Math.round(Number(weeks)), 24) : null;
  const endDate = reqWeeks
    ? new Date(now.getTime() + reqWeeks * 7 * 24 * 60 * 60 * 1000)
    : (races?.length > 0 ? new Date(races[0].date) : new Date(now.getTime() + 12 * 7 * 24 * 60 * 60 * 1000));
  const totalWeeks = reqWeeks ?? Math.max(4, Math.ceil((endDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const level = profile?.level ?? 'intermediario';
  // Duração base POR MODALIDADE (min): o ciclismo é a sessão mais longa e a natação a mais curta,
  // refletindo a distribuição clássica do triatlo (~nado 20%, bike 45%, corrida 35%). Determinístico.
  const modBaseDur: Record<string, number> = level === 'iniciante'
    ? { natacao: 25, ciclismo: 40, corrida: 30 }
    : level === 'avancado'
      ? { natacao: 50, ciclismo: 80, corrida: 55 }
      : { natacao: 35, ciclismo: 55, corrida: 40 };
  if (profile?.swimLevel === 'basico') modBaseDur.natacao = Math.round(modBaseDur.natacao * 0.8);
  const minDur: Record<string, number> = { natacao: 20, ciclismo: 30, corrida: 20, forca: 20 };
  // Lesões de joelho (condropatia/patelofemoral/menisco): limita o volume de IMPACTO da corrida
  // e troca a força por um protocolo seguro para a articulação patelofemoral (evidência clínica).
  const injuryText = `${profile?.limitations || ''} ${profile?.currentInjuries || ''} ${profile?.injuryHistory || ''}`.toLowerCase();
  const hasKnee = ['joelho', 'patel', 'condropat', 'condromalac', 'menisc'].some((k) => injuryText.includes(k));
  const runCapMin = hasKnee ? 50 : 999;
  const runLongCapMin = hasKnee ? 60 : 999;
  // Teto de VOLUME semanal a partir das horas disponíveis do atleta (respeita a regra dos 10%):
  // a 1ª semana parte do volume atual e progride até o teto; recuperação/polimento reduzem.
  const capMin = Number(profile?.weeklyHours) > 0 ? Number(profile.weeklyHours) * 60 : null;
  const curMin = Number(profile?.currentWeeklyVol) > 0 ? Number(profile.currentWeeklyVol) * 60 : null;
  const canSwim = profile?.canSwim !== false;
  const dayMap: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
  const numToDay: Record<number, string> = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
  // Garante dias padrão quando o atleta ainda não definiu disponibilidade (evita plano vazio)
  const availNums = ((daysAvail?.length ? daysAvail : ['seg', 'qua', 'sex'])).map((d: string) => dayMap[d] ?? 1).sort();
  const bikeEnv: Record<string, string> = (() => { try { return JSON.parse(profile?.bikeEnvByDay || '{}') ?? {}; } catch { return {}; } })();
  const modality = profile?.modality ?? 'triatlo';
  // Respeita a modalidade escolhida: planos de esporte unico NAO misturam outras modalidades
  const modalities = modality === 'natacao' ? ['natacao']
    : modality === 'ciclismo' ? ['ciclismo']
    : modality === 'corrida' ? ['corrida']
    : (canSwim ? ['natacao', 'ciclismo', 'corrida'] : ['ciclismo', 'corrida', 'ciclismo']);
  const zones = ['Z2', 'Z2', 'Z3', 'Z2', 'Z4', 'Z2'];
  const phases = ['base', 'construcao', 'pico', 'polimento'];

  const titles: Record<string, Record<string, string>> = {
    natacao: { Z2: 'Natação Base Aeróbica', Z3: 'Natação Progressiva', Z4: 'Natação Intervalado' },
    ciclismo: { Z2: 'Pedal Longo Z2', Z3: 'Pedal Progressivo', Z4: 'Intervalado de Potência' },
    corrida: { Z2: 'Corrida Leve Z2', Z3: 'Corrida Progressiva', Z4: 'Intervalado de Limiar', Z5: 'Intervalado VO₂máx', long: 'Longão (Corrida Longa)' },
  };
  // ===== Periodização específica da CORRIDA por distância-alvo + teste de 3 km =====
  // A distância da prova define a ênfase de zonas; o Longão entra toda semana (fora da recuperação).
  const raceDist: string | null = (races?.[0]?.distance) ?? (modality === 'corrida' ? '10k' : null);
  const runZones = runZonesForRace(raceDist);
  let runIdx = 0;
  const pickZone = (mod: string, fallbackIdx: number): { zone: string; isLong: boolean } => {
    if (mod === 'corrida') {
      const raw = runZones[runIdx % runZones.length];
      runIdx++;
      if (raw === 'Z2long') return { zone: 'Z2', isLong: true };
      return { zone: raw, isLong: false };
    }
    return { zone: zones[fallbackIdx % zones.length], isLong: false };
  };
  // Rampa de adaptação + recuperação + polimento (periodização 80/20, regra dos 10%):
  // a 1ª semana é 100% aeróbica (sem Z4/Z5) e a 2ª vai no máximo até Z3, introduzindo intensidade aos poucos.
  const adjustForPhase = (zone: string, isRecovery: boolean, phase: string, w: number): string => {
    if (w === 0 && (zone === 'Z3' || zone === 'Z4' || zone === 'Z5')) return 'Z2';
    if (w === 1 && (zone === 'Z4' || zone === 'Z5')) return 'Z3';
    if (isRecovery && (zone === 'Z4' || zone === 'Z5')) return 'Z2';
    if (phase === 'polimento' && zone === 'Z5') return 'Z4';
    if (hasKnee && zone === 'Z5') return 'Z4'; // menos impacto para o joelho
    return zone;
  };
  // ===== Referências de limiar do atleta (prescrição precisa, estilo dos melhores treinadores do mundo) =====
  const cssSecThresh = paceToSec(profile?.testCSSPace || profile?.swimPace);
  const ftpVal = Number(profile?.ftp || profile?.testFTPEstimated || 0) || null;
  const swimOffsets: Record<string, [number, number]> = { Z1: [15, 25], Z2: [6, 10], Z3: [1, 5], Z4: [-4, 0], Z5: [-8, -5] };
  const swimPaceStr = (zone: string): string | null => {
    if (!cssSecThresh) return null;
    const [o1, o2] = swimOffsets[zone] ?? [6, 10];
    const a = cssSecThresh + o1, b = cssSecThresh + o2;
    return `${secToPace(Math.min(a, b))}–${secToPace(Math.max(a, b))}/100m`;
  };
  const bikeWatts = (lo: number, hi: number): string => ftpVal ? ` (${Math.round(ftpVal * lo)}–${Math.round(ftpVal * hi)} W)` : '';

  const makeDesc = (mod: string, zone: string, dur: number, dayNum: number, isLong = false): string => {
    // ===== CORRIDA: prescrição em DUAS opções (FC e DISTÂNCIA/KM, com a distância total sempre) =====
    if (mod === 'corrida') return buildRunDescription(profile, zone, dur, dayNum, { isLong });

    let env = '';
    if (mod === 'ciclismo') {
      const e = bikeEnv[numToDay[dayNum]] ?? (profile?.hasTrainer ? 'rolo' : 'rua');
      env = e === 'rolo' ? ' Cenário: INDOOR no ROLO — mantenha potência/cadência alvo constante (modo ERG se disponível).' : ' Cenário: na RUA — atenção ao terreno/trânsito, controle por potência ou FC.';
    }

    const descriptions: Record<string, Record<string, string>> = {
      natacao: {
        Z2: `Aquecimento 200m crawl leve. Principal: ${Math.round(dur * 0.7)}min crawl contínuo em Z2${swimPaceStr('Z2') ? ` (alvo ${swimPaceStr('Z2')})` : ''}. Desaquecimento 100m.`,
        Z3: `Aquecimento 300m. Principal: 4x200m progressivo (Z2→Z3)${swimPaceStr('Z3') ? ` no pace ${swimPaceStr('Z3')}` : ''} com 30s descanso. 4x50m técnica. Desaquecimento 100m.`,
        Z4: `Aquecimento 300m variado. Principal: 8x100m no CSS (Z4)${cssSecThresh ? ` ~${secToPace(cssSecThresh)}/100m` : ''} com 15s de descanso. 4x50m técnica. Desaquecimento 100m.`,
      },
      ciclismo: {
        Z2: `Aquecer 10min progressivo. Principal: ${Math.round(dur * 0.7)}min contínuo em Z2 (56–75%FTP${bikeWatts(0.56, 0.75)}), cadência 85–95rpm. Desaquecer 10min @50%FTP.`,
        Z3: `Aquecer 15min até 65%FTP. Principal: ${Math.round(dur * 0.6)}min alternando 10min Z2 / 5min Z3 (76–90%FTP${bikeWatts(0.76, 0.90)}). Desaquecer 10min.`,
        Z4: `Aquecer 15min progressivo até 65%FTP. Principal: 4x8min @95–100%FTP${bikeWatts(0.95, 1.00)} (Z4, blocos ERG estilo Zwift/MyWhoosh) com 4min @55%FTP de recuperação. Desaquecer 10min @50%FTP.`,
      },
    };
    return (descriptions?.[mod]?.[zone] ?? `Treino de ${mod} em ${zone} por ${dur} minutos.`) + env;
  };
  const dateFor = (w: number, dayNum: number): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + w * 7 + ((dayNum - d.getDay() + 7) % 7));
    return d;
  };
  // Descrição de FORÇA: protocolo seguro p/ joelho quando há condropatia/patelofemoral; padrão caso contrário.
  const forcaDesc = (fd: number): string => hasKnee
    ? `Mobilidade dinâmica (10min): tornozelo, quadril, coluna torácica, ombros. Principal (${fd}min) — PROTOCOLO SEGURO PARA JOELHO (condropatia/patelofemoral), mantendo a dor ≤3/10: ênfase em quadril, glúteos e cadeia posterior. Agachamento PARCIAL até ~60° 3x10, levantamento terra romeno 3x8, elevação pélvica (hip thrust) 3x12, abdução de quadril com miniband 3x15, wall sit isométrico 3x30–40s, prancha 3x45s. EVITE agachamento profundo (>90°), afundo/avanço e cadeira extensora. Alongue quadríceps e banda iliotibial 5min.`
    : `Mobilidade dinâmica (10min): tornozelo, quadril, coluna torácica, ombros. Principal (${fd}min): agachamento 3x8-10, levantamento terra 3x8, afundo unilateral 3x10/perna, prancha 3x45s, elevação pélvica 3x12. Finalize com alongamento e liberação miofascial 5min. Foco em técnica e estabilidade do core.`;
  const forcaDurFor = (phase: string, isRecovery: boolean): number =>
    Math.round((level === 'iniciante' ? 25 : level === 'avancado' ? 45 : 35) * (phase === 'polimento' ? 0.6 : isRecovery ? 0.7 : 1));
  // Alvo de minutos da semana (teto de horas do atleta + rampa de 10% + cortes de recuperação/polimento).
  const weeklyTarget = (w: number, phase: string, isRecovery: boolean): number | null => {
    if (!capMin) return null;
    const startMin = curMin ? Math.min(curMin, capMin) : Math.round(capMin * 0.7);
    const rampWeeks = Math.max(1, Math.round(totalWeeks * 0.7));
    let t = startMin + (capMin - startMin) * Math.min(1, w / rampWeeks);
    if (isRecovery) t *= 0.6;
    if (phase === 'polimento') t = Math.min(t, capMin * 0.5);
    return t;
  };

  // Distribuição semanal fixa definida pelo atleta (dia da semana → modalidades)
  const schedule: Record<string, string[]> = (() => { try { return JSON.parse(profile?.daySchedule || '{}') ?? {}; } catch { return {}; } })();
  const allowedMods = new Set(modalities);
  const schedulePairs: { dayNum: number; mod: string }[] = [];
  for (const [dk, mods] of Object.entries(schedule)) {
    const dayNum = dayMap[dk];
    if (dayNum === undefined || !Array.isArray(mods)) continue;
    for (const m of mods as string[]) {
      if (m === 'forca' || allowedMods.has(m)) schedulePairs.push({ dayNum, mod: m });
    }
  }
  schedulePairs.sort((a, b) => a.dayNum - b.dayNum);
  const useSchedule = schedulePairs.length > 0;

  for (let w = 0; w < Math.min(totalWeeks, 24); w++) {
    const phaseIdx = Math.min(3, Math.floor((w / totalWeeks) * 4));
    const phase = phases[phaseIdx];
    const isRecovery = w % 4 === 3;
    const weekMult = isRecovery ? 0.6 : (phase === 'polimento' ? 0.5 : 1 + (w / totalWeeks) * 0.5);

    // 1) Pares (dia, modalidade) da semana — da distribuição fixa do atleta ou do fallback.
    const pairs: { dayNum: number; mod: string }[] = [];
    if (useSchedule) {
      for (const p of schedulePairs) pairs.push(p);
    } else {
      availNums.forEach((dayNum: number, i: number) => pairs.push({ dayNum, mod: modalities[i % modalities.length] }));
      if (!isRecovery) {
        const usedDays = new Set(availNums);
        let forcaDayNum = [2, 4, 1, 5, 6, 0, 3].find((n) => !usedDays.has(n));
        if (forcaDayNum === undefined) forcaDayNum = availNums[availNums.length - 1] ?? 4;
        pairs.push({ dayNum: forcaDayNum, mod: 'forca' });
      }
    }

    // 2) Decide zona/isLong/duração bruta de cada sessão (apenas dentro do calendário do plano).
    type Item = { dayNum: number; mod: string; zone: string; isLong: boolean; durRaw: number };
    const items: Item[] = [];
    let qi = 0;
    for (const { dayNum, mod } of pairs) {
      if (dateFor(w, dayNum) > endDate) continue;
      if (mod === 'forca') { items.push({ dayNum, mod, zone: 'Z2', isLong: false, durRaw: forcaDurFor(phase, isRecovery) }); continue; }
      const picked = pickZone(mod, w + qi); qi++;
      const isLong = picked.isLong && !isRecovery;
      const zone = adjustForPhase(picked.zone, isRecovery, phase, w);
      const durRaw = Math.round((modBaseDur[mod] ?? 45) * weekMult * (isLong ? 1.5 : 1));
      items.push({ dayNum, mod, zone, isLong, durRaw });
    }

    // 3) Escala a semana ao teto de volume do atleta (regra dos 10%), quando definido.
    const rawTotal = items.reduce((s, it) => s + it.durRaw, 0);
    const target = weeklyTarget(w, phase, isRecovery);
    const factor = (target && rawTotal > 0) ? Math.max(0.5, Math.min(1.25, target / rawTotal)) : 1;

    // 4) Gera os treinos com a duração final (descrição sempre coerente com a duração).
    for (const it of items) {
      let dur = Math.max(minDur[it.mod] ?? 20, Math.round(it.durRaw * factor));
      if (it.mod === 'corrida') dur = Math.min(dur, it.isLong ? runLongCapMin : runCapMin);
      const d = dateFor(w, it.dayNum);
      if (it.mod === 'forca') {
        workouts.push({
          date: d.toISOString(), modality: 'forca',
          title: phase === 'base' ? 'Força & Mobilidade - Adaptação' : 'Força & Mobilidade',
          description: forcaDesc(dur), duration: dur, targetZone: 'Z2',
          tssEstimate: Math.round(dur * 0.6), phase, weekNumber: w + 1,
        });
        continue;
      }
      const title = it.isLong ? (titles?.[it.mod]?.long ?? titles?.[it.mod]?.[it.zone] ?? `${it.mod} longo`) : (titles?.[it.mod]?.[it.zone] ?? `${it.mod} ${it.zone}`);
      const tssMult = it.zone === 'Z5' ? 1.3 : it.zone === 'Z4' ? 1.2 : it.zone === 'Z3' ? 0.9 : (it.isLong ? 0.8 : 0.7);
      workouts.push({
        date: d.toISOString(), modality: it.mod, title,
        description: makeDesc(it.mod, it.zone, dur, it.dayNum, it.isLong),
        duration: dur, targetZone: it.zone, tssEstimate: Math.round(dur * tssMult),
        phase, weekNumber: w + 1,
      });
    }
  }
  return workouts;
}

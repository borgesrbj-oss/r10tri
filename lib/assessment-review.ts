/** Campos e etapas compartilhados entre os avisos do servidor e a triagem. */
const groups: [number, Record<string, string>][] = [
  [0, {modality:'Modalidade',runStructure:'Prescrição da corrida: km ou zona'}],
  [1, {level:'Experiência',trainingYears:'Anos de treino',previousPlanExp:'Experiência com planos',raceHistory:'Histórico de provas',recentRaceDistanceKm:'Distância da prova de referência',recentRaceTimeSeconds:'Tempo da prova de referência',recentRaceTime:'Tempo da prova de referência',recentRaceDate:'Data da prova de referência'}],
  [2, {canSwim:'Sabe nadar',swimLevel:'Nível de natação',bikeLevel:'Nível de ciclismo',runLevel:'Nível de corrida',weakestSport:'Modalidade com mais dificuldade',strongestSport:'Modalidade mais forte'}],
  [3, {testCSS400:'Teste CSS de 400 m',testCSS200:'Teste CSS de 200 m',testCSSPace:'CSS calculado',testFTP20min:'Teste FTP de 20 minutos',testFTPEstimated:'FTP estimado',testFTPHR:'FC no teste de FTP',testRun30min:'Distância no teste de 30 minutos',testRunPace:'Pace no teste de corrida',testRunHR:'FC no teste de corrida',testRun3km:'Teste de 3 km'}],
  [4, {birthDate:'Data de nascimento',currentWeight:'Peso atual',targetWeight:'Peso desejado',ftp:'FTP',vo2max:'VO₂ máximo',swimPace:'Ritmo de natação',runPace:'Ritmo de corrida',maxHeartRate:'FC máxima',restingHeartRate:'FC de repouso',thresholdHeartRate:'FC de limiar',runThresholdPace:'Pace limiar de corrida',swimCssPace:'CSS de natação'}],
  [5, {raceDate:'Data completa da maratona',trainingGoal:'Foco do treino',goalType:'Objetivo',goalTime:'Tempo objetivo'}],
  [6, {injuryHistory:'Histórico de lesões',currentInjuries:'Lesões atuais',medicalConditions:'Condições médicas',sleepHours:'Horas de sono',stressLevel:'Estresse',dietaryNotes:'Observações alimentares'}],
  [7, {weeklyHours:'Limite semanal de horário (opcional)',currentWeeklyVol:'Volume semanal atual',availableDays:'Dias disponíveis',dailyMinutes:'Limite diário de minutos',heightCm:'Altura',inactivityWeeks:'Semanas sem treinar',strengthAvailable:'Disponibilidade para força',workSchedule:'Rotina de trabalho',travelFrequency:'Viagens',hasPoolAccess:'Acesso à piscina',poolSize:'Tamanho da piscina',hasTrainer:'Rolo de treino',hasPowerMeter:'Medidor de potência',hasHRM:'Monitor cardíaco',bikeType:'Bicicleta',limitations:'Limitações',planningPreferences:'Preferências de treino'}],
];
export type AssessmentIssue = {field:string;label:string;step:number;message:string};
export function assessmentIssue(field:string,message:string): AssessmentIssue | null {
  const root=field.split('.')[0];
  const group=groups.find(([,fields])=>Object.prototype.hasOwnProperty.call(fields,root));
  if(!group)return null;
  const nested:Record<string,string>={'planningPreferences.recentLongRunMinutes':'Duração do longão recente','planningPreferences.recentLongRunKm':'Distância do longão recente','planningPreferences.recentMinutes.corrida':'Volume semanal recente de corrida'};
  return {field,label:(nested[field]??group[1][root])+(root==='dailyMinutes'&&field.includes('.')?' — '+field.split('.')[1]:''),step:group[0],message};
}
/** Só dados explicitamente identificados como triagem podem abrir seus campos. */
export function assessmentIssues(details:unknown): AssessmentIssue[] {
  if(!Array.isArray(details))return [];
  return details.flatMap(item=>{
    if(!item||typeof item.field!=='string'||typeof item.message!=='string')return [];
    const issue=assessmentIssue(item.field,item.message);
    return issue?[issue]:[];
  });
}

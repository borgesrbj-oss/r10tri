import type {TrainingProfile} from '../../lib/training-types';
const base:TrainingProfile={birthDate:'1990-01-01',currentWeight:70,level:'intermediario',modality:'corrida',weeklyHours:6,currentWeeklyVol:4,availableDays:['seg','qua','sex','sab'],runThresholdPace:'05:00',canSwim:true,hasPoolAccess:true,hasPowerMeter:true,ftp:200,swimCssPace:'02:00'};
export const auditStart='2026-11-16';
export const auditProfiles:{name:string;profile:TrainingProfile;raceWeeks:number;goal:string}[]=[
 {name:'Sedentário iniciante',profile:{...base,level:'iniciante',currentWeeklyVol:0,weeklyHours:2,trainingGoal:'iniciacao'},raceWeeks:12,goal:'iniciacao'},
 {name:'Primeiros 5 km',profile:{...base,level:'iniciante',currentWeeklyVol:1,weeklyHours:3,trainingGoal:'5k'},raceWeeks:8,goal:'5k'},
 {name:'Intermediário 10 km',profile:{...base,trainingGoal:'10k'},raceWeeks:12,goal:'10k'},
 {name:'Meia maratona',profile:{...base,currentWeeklyVol:6,weeklyHours:8,trainingGoal:'21k'},raceWeeks:16,goal:'21k'},
 {name:'Maratonista experiente',profile:{...base,level:'avancado',currentWeeklyVol:10,weeklyHours:12,trainingGoal:'42k',availableDays:['seg','ter','qua','qui','sex','sab']},raceWeeks:20,goal:'42k'},
 {name:'Ciclista iniciante',profile:{...base,modality:'ciclismo',level:'iniciante',hasPowerMeter:false,hasTrainer:false,ftp:null,currentWeeklyVol:1,weeklyHours:3,trainingGoal:'base'},raceWeeks:12,goal:'base'},
 {name:'Nadador pouco experiente',profile:{...base,modality:'natacao',level:'iniciante',swimLevel:'basico',swimCssPace:null,currentWeeklyVol:1,weeklyHours:2,trainingGoal:'tecnica'},raceWeeks:12,goal:'tecnica'},
 {name:'Triatleta iniciante',profile:{...base,modality:'triatlo',level:'iniciante',swimLevel:'basico',currentWeeklyVol:3,weeklyHours:5,trainingGoal:'sprint'},raceWeeks:12,goal:'sprint'},
 {name:'Triatleta longa distância',profile:{...base,modality:'triatlo',level:'avancado',currentWeeklyVol:10,weeklyHours:14,trainingGoal:'ironman',availableDays:['seg','ter','qua','qui','sex','sab']},raceWeeks:28,goal:'ironman'},
 {name:'Histórico de lesão no joelho',profile:{...base,injuryHistory:'Lesão anterior de joelho; retorno já orientado',trainingGoal:'10k'},raceWeeks:12,goal:'10k'},
 {name:'Disponibilidade limitada',profile:{...base,weeklyHours:.5,currentWeeklyVol:.5,availableDays:['seg'],dailyMinutes:{seg:15},strengthAvailable:false},raceWeeks:12,goal:'base'},
 {name:'Objetivo incompatível com prazo',profile:{...base,level:'iniciante',weeklyHours:2,currentWeeklyVol:1,trainingGoal:'42k'},raceWeeks:3,goal:'42k'},
];

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TrainingZonesSummary } from '../components/training-zones-summary';
import { targetForZone } from '../lib/training-zones';
import type { TrainingProfile,TrainingZone } from '../lib/training-types';
test('resumo visual usa exatamente os alvos do motor e não confunde pace desejado com limiar',()=>{
  const profile:TrainingProfile={modality:'corrida',runStructure:'zona',hasHRM:true,thresholdHeartRate:170,maxHeartRate:190};
  const html=renderToStaticMarkup(React.createElement(TrainingZonesSummary,{profile}));
  for(const zone of ['Z1','Z2','Z3','Z4','Z5'] as TrainingZone[])assert.ok(html.includes(targetForZone(profile,'corrida',zone).text));
  const missing=renderToStaticMarkup(React.createElement(TrainingZonesSummary,{profile:{modality:'corrida',runPace:'04:00'}}));
  assert.ok(missing.includes('Percepção'));assert.ok(!missing.includes('4:00/km'));
});
test('FTP sem equipamento mantém percepção também no resumo visual',()=>{
  const html=renderToStaticMarkup(React.createElement(TrainingZonesSummary,{profile:{modality:'ciclismo',ftp:200,hasPowerMeter:false,hasTrainer:false}}));
  assert.ok(html.includes('Percepção'));assert.ok(!html.includes('150 W'));
});

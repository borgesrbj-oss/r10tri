import assert from 'node:assert/strict';
import test from 'node:test';
import { SWIM_MEDIA, SWIM_MEDIA_CHECKED_ON, swimMediaForWorkout, swimMediaLicenseUrl } from '../lib/swim-media-catalog';
import { buildWorkoutStructure, readWorkoutStructure } from '../lib/training-structure';

test('catálogo de natação identifica cada vídeo, fonte, autoria e licença', () => {
  assert.ok(SWIM_MEDIA.length >= 10);
  assert.match(SWIM_MEDIA_CHECKED_ON, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Set(SWIM_MEDIA.map(reference => reference.id)).size, SWIM_MEDIA.length);
  assert.equal(new Set(SWIM_MEDIA.map(reference => reference.mediaUrl)).size, SWIM_MEDIA.length);
  for (const reference of SWIM_MEDIA) {
    assert.match(reference.pageUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(reference.mediaUrl, /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/.*\.webm$/);
    assert.match(swimMediaLicenseUrl(reference), /^https:\/\/creativecommons\.org\/licenses\//);
    assert.equal(decodeURIComponent(reference.mediaUrl.split('/').at(-1)!).replace(/_/g, ' '), reference.fileTitle);
    assert.ok(reference.credit && reference.observation && reference.title);
  }
});

test('referências entram apenas na sessão de técnica correspondente, inclusive em legado', () => {
  const technique = buildWorkoutStructure({ swimCssPace: '1:50' }, 'natacao', 'base', 30, 0, 'Z4', 'Z2', 'tecnica');
  const persisted = readWorkoutStructure(JSON.parse(JSON.stringify(technique)))!;
  const steady = buildWorkoutStructure({ swimCssPace: '1:50' }, 'natacao', 'base', 30);
  const running = buildWorkoutStructure({ runThresholdPace: '5:00' }, 'corrida', 'base', 30);
  assert.equal(persisted.swimTechnique, 'crawlAlignment');
  for (const current of [persisted, { ...technique, swimTechnique: undefined }]) {
    const videos = swimMediaForWorkout(current);
    assert.equal(videos.length, 2);
    assert.ok(videos.every(reference => reference.topic === 'crawlAlignment'));
  }
  assert.deepEqual(swimMediaForWorkout(steady), []);
  assert.deepEqual(swimMediaForWorkout(running), []);
});

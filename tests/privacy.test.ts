import assert from 'node:assert/strict';
import test from 'node:test';
import { publicProfile } from '../lib/profile-public';
import { configuredAppOrigin, mobileLinkAllowed, requiredAuthSecret, trustedRole } from '../lib/auth-policy';
import { seedConfiguration } from '../lib/seed-config';

test('perfil público remove a chave e conserva os campos do atleta', () => {
  const profile = { id: 'atleta-1', nickname: 'Atleta', intervalsIcuApiKey: 'valor-sintetico-de-teste' };
  const safe = publicProfile(profile);
  assert.deepEqual(safe, { id: 'atleta-1', nickname: 'Atleta', hasIntervalsKey: true });
  assert.equal(JSON.stringify(safe).includes('valor-sintetico-de-teste'), false);
  assert.equal(profile.intervalsIcuApiKey, 'valor-sintetico-de-teste');
  assert.equal(publicProfile(null), null);
  assert.equal(publicProfile({ intervalsIcuApiKey: '  ' })?.hasIntervalsKey, false);
});

test('permissão de coach exige papel persistido e não lista de e-mails', () => {
  assert.equal(trustedRole('coach'), 'coach');
  for (const role of ['admin', 'COACH', '', null, undefined]) assert.equal(trustedRole(role), 'atleta');
});

test('origem para encaminhar credenciais exige configuração em produção', () => {
  assert.throws(() => configuredAppOrigin({ NODE_ENV: 'production' }));
  assert.equal(configuredAppOrigin({ NODE_ENV: 'development', PORT: '3100' }), 'http://localhost:3100');
  assert.equal(configuredAppOrigin({ NEXTAUTH_URL: 'https://app.example/' }), 'https://app.example');
  for (const origin of ['ftp://app.example', 'https://usuario:senha@app.example', 'https://app.example/api', 'https://app.example/?x=1']) {
    assert.throws(() => configuredAppOrigin({ NEXTAUTH_URL: origin }));
  }
});

test('assinatura de link nunca usa segredo vazio', () => {
  assert.throws(() => requiredAuthSecret({}));
  assert.equal(requiredAuthSecret({ AUTH_SECRET: 'segredo-sintetico' }), 'segredo-sintetico');
  assert.equal(requiredAuthSecret({ AUTH_SECRET: 'primario-sintetico', NEXTAUTH_SECRET: 'legado-sintetico' }), 'primario-sintetico');
});

test('destinos mobile impedem esquemas genéricos e domínios não autorizados', () => {
  const env = { NODE_ENV: 'production', NEXTAUTH_URL: 'https://app.example', MOBILE_DEEP_LINK_SCHEMES: 'r10tri' };
  assert.equal(mobileLinkAllowed('r10tri://login', env), true);
  assert.equal(mobileLinkAllowed('https://app.example/login', env), true);
  for (const target of ['abacusai123://login', 'exp://localhost', 'https://outro.app.example/login', 'https://app.example.evil.example/login', 'javascript:alert(1)', 'https://usuario:senha@app.example/login']) {
    assert.equal(mobileLinkAllowed(target, env), false);
  }
  assert.equal(mobileLinkAllowed('exp://localhost', { NODE_ENV: 'development' }), true);
  assert.equal(mobileLinkAllowed('https://preview.example/callback', { NODE_ENV: 'development', MOBILE_PREVIEW_ORIGINS: 'https://preview.example' }), true);
});

test('seed exige identidade, senha forte e papel explicitamente configurados', () => {
  assert.throws(() => seedConfiguration({}));
  assert.throws(() => seedConfiguration({ SEED_EMAIL: 'usuario@example.com', SEED_PASSWORD: 'muito-curta', SEED_ROLE: 'coach' }));
  assert.throws(() => seedConfiguration({ SEED_EMAIL: 'usuario@example.com', SEED_PASSWORD: 'Senha-sintetica-12345' }));
  assert.throws(() => seedConfiguration({ SEED_EMAIL: 'usuario@example.com', SEED_PASSWORD: 'á'.repeat(40), SEED_ROLE: 'coach' }));
  const configured = seedConfiguration({ SEED_EMAIL: ' Usuario@Example.com ', SEED_PASSWORD: 'Senha-sintetica-12345', SEED_ROLE: 'coach' });
  assert.equal(configured.email, 'usuario@example.com');
  assert.equal(configured.role, 'coach');
});

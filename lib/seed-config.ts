export function seedConfiguration(env: Readonly<Record<string, string | undefined>> = process.env) {
  const email = env.SEED_EMAIL?.trim().toLowerCase();
  const password = env.SEED_PASSWORD;
  const role = env.SEED_ROLE;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Configure SEED_EMAIL com um e-mail válido.');
  if (!password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Configure SEED_PASSWORD com no mínimo 12 caracteres e no máximo 72 bytes.');
  if (role !== 'coach' && role !== 'atleta') throw new Error('Configure SEED_ROLE explicitamente como coach ou atleta.');
  return { email, password, role, name: env.SEED_NAME?.trim() || 'Usuário inicial' };
}

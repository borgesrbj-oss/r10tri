export function seedConfiguration(env: Readonly<Record<string, string | undefined>> = process.env) {
  const email = env.SEED_EMAIL?.trim().toLowerCase();
  const password = env.SEED_PASSWORD;
  const role = env.SEED_ROLE;
  const username = env.SEED_USERNAME?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Configure SEED_EMAIL com um e-mail válido.');
  if (!password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Configure SEED_PASSWORD com no mínimo 12 caracteres e no máximo 72 bytes.');
  if (role !== 'coach' && role !== 'atleta') throw new Error('Configure SEED_ROLE explicitamente como coach ou atleta.');
  if (username && !/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('SEED_USERNAME deve ter de 3 a 32 letras, números, pontos, traços ou sublinhados.');
  return { email, password, role, name: env.SEED_NAME?.trim() || 'Usuário inicial', ...(username ? {username} : {}) };
}

import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';
import { seedConfiguration } from '../lib/seed-config';

async function main() {
  const { email, password, role, name, username } = seedConfiguration();
  const existing = await prisma.user.findFirst({ where: { OR: [{ email: {equals:email,mode:'insensitive'} }, ...(username ? [{username:{equals:username,mode:'insensitive' as const}}] : [])] }, select: { id: true } });
  if (existing) throw new Error('O usuário já existe. Nenhuma senha ou permissão foi alterada.');
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, username, name, role, password: hashedPassword } });
  console.log('Usuário inicial criado com sucesso.');
}

main().catch(() => {
  console.error('Não foi possível criar o usuário inicial. Verifique SEED_EMAIL, SEED_PASSWORD, SEED_ROLE e a conexão; usuários existentes não são alterados.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());

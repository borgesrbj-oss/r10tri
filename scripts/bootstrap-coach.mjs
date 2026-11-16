import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Ativado somente por configuração privada do operador. Não contém uma conta padrão.
const email = process.env.BOOTSTRAP_COACH_EMAIL?.trim().toLowerCase();
const username = process.env.BOOTSTRAP_COACH_USERNAME?.trim().toLowerCase();
const hash = process.env.BOOTSTRAP_COACH_PASSWORD_HASH;
if (!email && !username && !hash) {
  console.log('Criação inicial de coach não solicitada.');
  process.exit(0);
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !username || !/^[a-z0-9._-]{3,32}$/.test(username) || !hash || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash) || bcrypt.getRounds(hash) < 12) {
  console.error('Configuração privada da conta inicial inválida. Nenhum usuário foi alterado.');
  process.exit(1);
}
const prisma = new PrismaClient({log:[]});
try {
  const users = await prisma.user.findMany({where:{OR:[{email:{equals:email,mode:'insensitive'}},{username:{equals:username,mode:'insensitive'}}]},take:3});
  if (users.length) {
    if (users.length === 1 && users[0].email.toLowerCase() === email && users[0].username?.toLowerCase() === username && users[0].role === 'coach') console.log('Conta inicial já existente; senha e permissões preservadas.');
    else throw new Error('Identificador já utilizado.');
  } else {
    await prisma.user.create({data:{email,username,password:hash,role:'coach',name:process.env.BOOTSTRAP_COACH_NAME?.trim() || 'Coach'}});
    console.log('Conta inicial de coach criada com hash fornecido pelo operador.');
  }
} catch {
  console.error('Não foi possível preparar a conta inicial. Verifique configuração e possíveis conflitos; dados existentes foram preservados.');
  process.exitCode=1;
} finally {await prisma.$disconnect();}

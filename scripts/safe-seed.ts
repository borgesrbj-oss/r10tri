import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const seedFile = path.resolve(process.cwd(), 'scripts/seed.ts');
try {
  const content = fs.readFileSync(seedFile, 'utf8');
  if (/prisma\.\w+\.delete(?:Many)?\s*\(/.test(content)) {
    throw new Error('O seed contém exclusões de dados.');
  }
} catch {
  console.error('Seed interrompido: não foi possível validar o arquivo ou há exclusões de dados.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--require', 'dotenv/config', seedFile], { stdio: 'inherit' });
if (result.error) {
  console.error('Não foi possível iniciar o seed.');
  process.exit(1);
}
process.exit(result.status ?? 1);

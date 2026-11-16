import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

// Inclui arquivos novos não ignorados; exclusões aprovadas deixam de existir antes do commit.
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))].filter(file => existsSync(file));
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /(?:postgres(?:ql)?|mysql):\/\/[^\s<>:'"${}]+:[^\s<>@'"${}]+@/i,
];
let failures = 0;
for (const file of files) {
  const localEnvironment = /(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example');
  if (localEnvironment || /\.(pem|key|p12|pfx)$/i.test(file)) {
    console.error(`Arquivo de credenciais indevido: ${file}`);
    failures++;
    continue;
  }
  if (/\.(png|jpe?g|webp|ico|woff2?|zip)$/i.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  if (patterns.some(pattern => pattern.test(source))) {
    console.error(`Possível segredo encontrado em: ${file}`);
    failures++;
  }
}
if (failures) process.exitCode = 1;
else console.log(`Verificação concluída: ${files.length} arquivos rastreados, nenhum padrão de credencial encontrado.`);

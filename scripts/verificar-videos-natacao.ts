import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { SWIM_MEDIA, swimMediaLicenseUrl } from '../lib/swim-media-catalog';

const run = promisify(execFile);
const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
const output = process.platform === 'win32' ? 'NUL' : '/dev/null';
const userAgent = 'Gotri/1.0 (Plano de treino e auditoria manual de links Creative Commons; https://github.com/borgesrbj-oss/r10tri)';
const hostnameFor = {
  page: 'commons.wikimedia.org',
  media: 'upload.wikimedia.org',
  license: 'creativecommons.org',
} as const;

async function checkUrl(rawUrl: string, kind: keyof typeof hostnameFor): Promise<string> {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || url.hostname !== hostnameFor[kind] || url.username || url.password || url.port) {
    throw new Error('Origem fora do catálogo editorial.');
  }
  const request = async (options: string[]) => {
    const { stdout } = await run(curl, [
      '--silent', '--show-error', '--proto', '=https', '--max-time', '12', '--user-agent', userAgent,
      '--output', output, '--write-out', '%{http_code} %{content_type}', ...options, '--', url.href,
    ]);
    const [code, ...pieces] = stdout.trim().split(' ');
    return { status: Number(code), mimeType: pieces.join(' ') };
  };
  let result = await request(kind === 'license' ? [] : ['--head']);
  if (kind === 'media' && [405, 501].includes(result.status)) result = await request(['--range', '0-15']);
  const prefix = kind === 'media' ? 'video/webm' : 'text/html';
  if (result.status < 200 || result.status >= 300 || !result.mimeType.startsWith(prefix)) {
    throw new Error(`HTTP ${result.status} · ${result.mimeType || 'tipo desconhecido'}`);
  }
  return `${result.status} ${result.mimeType}`;
}

async function main() {
  const checks = SWIM_MEDIA.flatMap(reference => [
    { id: reference.id, url: reference.pageUrl, kind: 'page' as const },
    { id: reference.id, url: reference.mediaUrl, kind: 'media' as const },
  ]);
  const licenseUrls = [...new Set(SWIM_MEDIA.map(swimMediaLicenseUrl))];
  let passed = 0;
  for (const check of [
    ...checks,
    ...licenseUrls.map(url => ({ id: 'licença', url, kind: 'license' as const })),
  ]) {
    try {
      console.log(`${check.id} · ${check.kind} · ${await checkUrl(check.url, check.kind)}`);
      passed++;
    } catch (error) {
      console.error(`${check.id} · ${check.kind} · ${error instanceof Error ? error.message : 'Falha de conexão'}`);
      process.exitCode = 1;
    }
  }
  console.log(`${passed}/${checks.length + licenseUrls.length} endereços válidos. A conferência de conteúdo e autoria é manual.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const FALLBACKS = [
  'A disciplina de hoje é a vitória de amanhã. Nade, pedale, corra.',
  'Cada treino é um degrau. Confie no processo e evolua.',
  'O corpo alcança o que a mente acredita. Vá com tudo hoje!',
  'Constância vence intensidade. Apareça e dê o seu melhor.',
  'Não conte os dias, faça os dias contarem. Bora treinar!',
  'A dor do treino passa, o orgulho da conquista fica.',
  'Devagar é suave, suave é rápido. Mantenha o ritmo.',
  'Seu único concorrente é quem você foi ontem. Supere-se.',
];

function dayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

let cache: { key: string; phrase: string } | null = null;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const key = new Date().toISOString().slice(0, 10);
  if (cache && cache.key === key) {
    return NextResponse.json({ phrase: cache.phrase });
  }

  const fallback = FALLBACKS[dayIndex() % FALLBACKS.length];
  const apiKey = process.env.ABACUSAI_API_KEY;

  if (!apiKey) {
    cache = { key, phrase: fallback };
    return NextResponse.json({ phrase: fallback });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        temperature: 0.9,
        max_tokens: 120,
        messages: [
          { role: 'system', content: 'Você é um coach de triatlo motivador. Gere UMA frase motivacional curta (máx 140 caracteres) em português do Brasil para um atleta de triatlo (natação, ciclismo, corrida). Seja original, inspirador e direto. Responda apenas com a frase, sem aspas.' },
          { role: 'user', content: `Frase motivacional do dia ${key}.` },
        ],
      }),
    });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      const phrase = (data?.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '');
      if (phrase) {
        cache = { key, phrase };
        return NextResponse.json({ phrase });
      }
    }
  } catch {}

  cache = { key, phrase: fallback };
  return NextResponse.json({ phrase: fallback });
}

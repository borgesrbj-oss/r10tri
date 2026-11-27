import { createHash } from 'node:crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { calendarDay } from '@/lib/calendar-day';

const options = { headers: { 'Cache-Control': 'no-store' } };

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: 'Não autorizado.' }, { ...options, status: 401 });

  const body = await request.json().catch(() => null);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const date = typeof body?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? calendarDay(body.date) : null;
  if (!date || body.date > today) return Response.json({ error: 'Escolha um dia válido até hoje.' }, { ...options, status: 422 });

  const id = 'descanso-' + createHash('sha256').update(JSON.stringify([userId, body.date])).digest('hex');
  await prisma.workout.upsert({
    where: { id, userId },
    update: {},
    create: {
      id, userId, date, duration: 0, modality: 'descanso', completed: true,
      title: 'Descanso de bike e corrida confirmado',
      description: 'Dia sem pedal ou corrida, confirmado pelo atleta para o cálculo de carga realizada.',
    },
  });
  return Response.json({ ok: true }, options);
}

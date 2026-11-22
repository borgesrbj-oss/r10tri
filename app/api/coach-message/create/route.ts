import { auth } from '@/auth';
import { coachMessage } from '@/lib/coach-service';
import { CoachError, coachErrorResponse } from '@/lib/coach-access';
import { z } from 'zod';
export async function POST(req: Request) {
  try {
    const s = await auth();
    if (!s?.user?.id) throw new CoachError('Não autorizado', 401);
    const b = await req.json();
    return Response.json(
      await coachMessage(s.user, { athleteId: b.userId, message: b.message }),
    );
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        { error: 'Informe uma orientação de até 4.000 caracteres.' },
        { status: 422 },
      );
    return coachErrorResponse(e);
  }
}

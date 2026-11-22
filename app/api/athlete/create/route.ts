import { auth } from '@/auth';
import { inviteAthlete } from '@/lib/coach-service';
import { coachErrorResponse, CoachError } from '@/lib/coach-access';
import { z } from 'zod';
export async function POST(req: Request) {
  try {
    const s = await auth();
    if (!s?.user?.id) throw new CoachError('Não autorizado', 401);
    return Response.json(await inviteAthlete(s.user, await req.json()));
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        { error: 'Confira nome e e-mail.' },
        { status: 422 },
      );
    return coachErrorResponse(e);
  }
}

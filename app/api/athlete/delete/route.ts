import { auth } from '@/auth';
import { endLink } from '@/lib/coach-service';
import { coachErrorResponse, CoachError } from '@/lib/coach-access';
export async function POST(req: Request) {
  try {
    const s = await auth();
    if (!s?.user?.id) throw new CoachError('Não autorizado', 401);
    const b = await req.json();
    return Response.json(await endLink(s.user, { athleteId: b.id }));
  } catch (e) {
    return coachErrorResponse(e);
  }
}

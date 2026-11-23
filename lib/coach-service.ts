import { assessmentIssue } from './assessment-review';
import { buildWaLink } from './wa';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from './db';
import { activeLink, CoachError, type Actor } from './coach-access';
import {
  compileSession,
  draftPreview,
  sessionSchema,
  type DraftChange,
  type DraftPayload,
} from './coach-editor';
import { assessmentData, assessmentReadiness } from './assessment-validation';
import { publicProfile } from './profile-public';
import { calendarDay, generateStructuredPlan } from './training-structure';
import { editWorkoutStructure } from './workout-edit';
import { describeStructure } from './training-structure';
import { newInvitation, invitationUrl } from './invitations';
import { configuredAppOrigin } from './auth-policy';
import { retargetBike } from './workout-reassessment';
import { trainingFeedback } from './training-feedback';

const json = (v: unknown) =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
const activePlans = { OR: [{ planId: null }, { plan: { status: 'active' } }] };
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
const serial = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 20000,
};
const identity = z.string().min(1).max(128);
function coach(actor: Actor) {
  if (actor.role !== 'coach')
    throw new CoachError('Área exclusiva do coach autorizado.');
}
async function audit(
  tx: Prisma.TransactionClient,
  linkId: string,
  actorId: string,
  action: string,
  details: unknown,
) {
  await tx.coachAudit.create({
    data: { linkId, actorId, action, details: json(details) },
  });
}
function future(date: string) {
  if (!calendarDay(date) || date < today())
    throw new CoachError('Edite somente sessões de hoje ou futuras.', 422);
}
async function editable(
  tx: Prisma.TransactionClient,
  athleteId: string,
  id: string,
) {
  const w = await tx.workout.findFirst({
    where: { id, userId: athleteId, ...activePlans },
  });
  if (!w) throw new CoachError('Treino não encontrado.', 404);
  if (w.completed || w.date.toISOString().slice(0, 10) < today())
    throw new CoachError(
      'O histórico realizado ou passado deve ser preservado.',
      409,
    );
  return w;
}
async function loadDraft(
  tx: Prisma.TransactionClient,
  actor: Actor,
  athleteId: string,
  id: string,
  revision: number,
) {
  const link = await activeLink(tx, actor, athleteId, true);
  const draft = await tx.coachDraft.findFirst({
    where: { id, linkId: link.id, status: 'draft', revision },
  });
  if (!draft)
    throw new CoachError(
      'Rascunho alterado, publicado ou inacessível. Atualize a página.',
      409,
    );
  return { link, draft, payload: draft.payload as unknown as DraftPayload };
}
async function saveDraft(
  tx: Prisma.TransactionClient,
  actor: Actor,
  athleteId: string,
  payload: DraftPayload,
  instructions: string,
  id?: string,
  revision?: number,
) {
  const link = await activeLink(tx, actor, athleteId, true);
  if (payload.changes.length > 500)
    throw new CoachError('Revise até 500 alterações por publicação.', 422);
  if (id) {
    await loadDraft(tx, actor, athleteId, id, revision!);
    return tx.coachDraft.update({
      where: { id },
      data: {
        payload: json(payload),
        instructions,
        revision: { increment: 1 },
      },
    });
  }
  return tx.coachDraft.create({
    data: { linkId: link.id, payload: json(payload), instructions },
  });
}
async function state(tx: Prisma.TransactionClient, athleteId: string) {
  const [profile, workouts] = await Promise.all([
    tx.athleteProfile.findUnique({ where: { userId: athleteId } }),
    tx.workout.findMany({
      where: { userId: athleteId, ...activePlans },
      orderBy: [{date:'asc'},{partOrder:'asc'}],
      include: { log: true },
    }),
  ]);
  return { profile, workouts };
}

export async function inviteAthlete(actor: Actor, input: unknown) {
  coach(actor);
  const b = z
    .object({
      email: z.email().max(254),
      name: z.string().trim().min(1).max(120),
      whatsapp: z.string().max(30).optional(),
    })
    .parse(input);
  const email = b.email.trim().toLowerCase();
  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, role: true, password: true },
    });
    if (existing?.role === 'coach' || existing?.id === actor.id)
      throw new CoachError(
        'Não é possível vincular essa conta como atleta.',
        409,
      );
    const athlete =
      existing ??
      (await tx.user.create({ data: { email, name: b.name, role: 'atleta' } }));
    const previous = await tx.coachAthlete.findUnique({
      where: {
        coachId_athleteId: { coachId: actor.id, athleteId: athlete.id },
      },
    });
    if (previous?.status === 'active') {
      if (existing?.password)
        throw new CoachError('Este atleta já tem vínculo ativo com você.', 409);
      const invitation = newInvitation(email);
      await tx.verificationToken.deleteMany({
        where: { identifier: invitation.record.identifier },
      });
      await tx.verificationToken.create({ data: invitation.record });
      await audit(tx, previous.id, actor.id, 'primeiro_acesso_renovado', {});
      return {
        ok: true,
        id: athlete.id,
        invitationUrl: invitationUrl(
          configuredAppOrigin(),
          email,
          invitation.token,
        ),
        message:
          'Convite de primeiro acesso renovado. Os links anteriores foram invalidados.',
      };
    }
    if (previous?.status === 'pending')
      return {
        ok: true,
        pending: true,
        message: 'Convite pendente. O atleta pode aceitar na própria área.',
      };
    const link = await tx.coachAthlete.upsert({
      where: {
        coachId_athleteId: { coachId: actor.id, athleteId: athlete.id },
      },
      create: {
        coachId: actor.id,
        athleteId: athlete.id,
        status: existing ? 'pending' : 'active',
      },
      update: {
        status: 'pending',
        respondedAt: null,
        revision: { increment: 1 },
      },
    });
    await audit(
      tx,
      link.id,
      actor.id,
      existing ? 'convite_enviado' : 'atleta_cadastrado',
      { name: b.name },
    );
    let url: string | undefined;
    if (!existing) {
      const invitation = newInvitation(email);
      await tx.verificationToken.create({ data: invitation.record });
      url = invitationUrl(configuredAppOrigin(), email, invitation.token);
      await tx.athleteProfile.create({
        data: { userId: athlete.id, availableDays: [], whatsapp: b.whatsapp },
      });
    }
    return {
      ok: true,
      id: athlete.id,
      pending: Boolean(existing),
      invitationUrl: url,
      message: existing
        ? 'Convite disponível na área do atleta. O acesso só será liberado após o aceite.'
        : 'Novo atleta cadastrado. Compartilhe o link de primeiro acesso de forma privada.',
    };
  }, serial);
}

export async function respondInvitation(actor: Actor, input: unknown) {
  if (actor.role !== 'atleta')
    throw new CoachError('Somente o atleta pode responder.');
  const b = z.object({ id: identity, accept: z.boolean() }).parse(input);
  return prisma.$transaction(async (tx) => {
    const changed = await tx.coachAthlete.updateMany({
      where: { id: b.id, athleteId: actor.id, status: 'pending' },
      data: {
        status: b.accept ? 'active' : 'rejected',
        respondedAt: new Date(),
        revision: { increment: 1 },
      },
    });
    if (changed.count !== 1)
      throw new CoachError('Convite não encontrado ou já respondido.', 409);
    await audit(
      tx,
      b.id,
      actor.id,
      b.accept ? 'convite_aceito' : 'convite_recusado',
      {},
    );
    return { ok: true };
  }, serial);
}
export async function endLink(actor: Actor, input: unknown) {
  const b = z.object({ athleteId: identity }).parse(input);
  return prisma.$transaction(async (tx) => {
    const link = await activeLink(tx, actor, b.athleteId, true);
    await tx.coachAthlete.update({
      where: { id: link.id },
      data: { status: 'ended', respondedAt: new Date() },
    });
    await audit(tx, link.id, actor.id, 'vinculo_encerrado', {
      historyPreserved: true,
    });
    return { ok: true };
  }, serial);
}
export async function coachProfile(actor: Actor, input: unknown) {
  const b = z
    .object({ athleteId: identity, profile: z.record(z.string(), z.unknown()) })
    .parse(input);
  return prisma.$transaction(async (tx) => {
    const link = await activeLink(tx, actor, b.athleteId, true);
    const previous = await tx.athleteProfile.findUnique({
      where: { userId: b.athleteId },
    });
    const parsed = assessmentData(b.profile, previous);
    if (!parsed.ok)
      throw new CoachError(
        'Confira os campos: ' +
          parsed.errors.map((e) => e.field + ' — ' + e.message).join('; '),
        422,
        parsed.errors,
      );
    const profile = await tx.athleteProfile.upsert({
      where: { userId: b.athleteId },
      create: { userId: b.athleteId, availableDays: [], ...parsed.data },
      update: parsed.data,
    });
    await audit(tx, link.id, actor.id, 'dados_esportivos_atualizados', {
      before: publicProfile(previous),
      after: publicProfile(profile),
    });
    return {
      ok: true,
      profile: publicProfile(profile),
      message:
        'Dados salvos. Revise os rascunhos e os treinos publicados antes de aplicar novos alvos.',
    };
  }, serial);
}

const envelope = z
  .object({
    athleteId: identity,
    draftId: identity.optional(),
    revision: z.number().int().positive().optional(),
    instructions: z.string().max(10000).default(''),
  })
  .refine(
    (v) => !v.draftId || Boolean(v.revision),
    'Informe a revisão atual do rascunho.',
  );
export async function upsertSession(actor: Actor, input: unknown) {
  const b = envelope
    .and(
      z.object({
        session: sessionSchema,
        changeKey: identity.optional(),
        duplicate: z.boolean().default(false),
      }),
    )
    .parse(input);
  future(b.session.date);
  return prisma.$transaction(async (tx) => {
    await activeLink(tx, actor, b.athleteId, true);
    const { profile } = await state(tx, b.athleteId);
    let payload: DraftPayload = {
      baseProfileAt: profile?.updatedAt.toISOString() ?? null,
      changes: [],
    };
    if (b.draftId)
      payload = (
        await loadDraft(tx, actor, b.athleteId, b.draftId, b.revision!)
      ).payload;
    let original = null;
    const changedDraft = b.changeKey
      ? payload.changes.find((c) => c.key === b.changeKey)
      : undefined;
    if (b.changeKey && !changedDraft)
      throw new CoachError('Alteração não encontrada no rascunho.', 404);
    if (changedDraft?.id && b.session.id !== changedDraft.id)
      throw new CoachError(
        'O vínculo com a sessão original deve ser preservado.',
        422,
      );
    if (b.session.id) {
      original = b.duplicate
        ? await tx.workout.findFirst({
            where: { id: b.session.id, userId: b.athleteId },
          })
        : await editable(tx, b.athleteId, b.session.id);
      if (!original) throw new CoachError('Sessão não encontrada.', 404);
    }
    let compiled: DraftChange[];
    try {
      compiled = compileSession(b.session, profile);
    } catch (e) {
      throw new CoachError((e as Error).message, 422);
    }
    if (original && !b.duplicate && compiled.length !== 1)
      throw new CoachError(
        'Crie o brick como nova sessão e cancele explicitamente as sessões substituídas.',
        422,
      );
    if (original && !b.duplicate) {
      const pending=payload.changes.find(c=>c.id===original.id);
      if(pending?.baseUpdatedAt!==undefined && pending.baseUpdatedAt!==original.updatedAt.toISOString())
        throw new CoachError('A sessão publicada mudou. Retire a alteração pendente e reabra a versão atual antes de editar.',409);
      compiled[0].id = original.id;
      compiled[0].brickGroupId=original.brickGroupId;compiled[0].partOrder=original.partOrder;
      compiled[0].baseUpdatedAt = original.updatedAt.toISOString();
      payload.changes = payload.changes.filter((c) => c.id !== original.id);
    }
    if (b.changeKey) {
      payload.changes = payload.changes.filter((c) => c.key !== b.changeKey);
    }
    payload.changes.push(...compiled);
    return saveDraft(
      tx,
      actor,
      b.athleteId,
      payload,
      b.instructions,
      b.draftId,
      b.revision,
    );
  }, serial);
}

export async function draftOperation(actor: Actor, input: unknown) {
  const b = envelope
    .and(
      z.object({
        operation: z.enum([
          'cancel',
          'shorten',
          'move',
          'substitute',
          'discardChange',
        ]),
        ids: z.array(identity).min(1).max(500),
        date: z.string().optional(),
        minutes: z.number().int().min(4).max(1440).optional(),
        modality: z
          .enum(['corrida', 'ciclismo', 'natacao', 'forca'])
          .optional(),
        shiftDays: z.number().int().min(-90).max(90).optional(),
        factor: z.number().min(0.1).max(2).optional(),
      }),
    )
    .parse(input);
  return prisma.$transaction(async (tx) => {
    await activeLink(tx, actor, b.athleteId, true);
    const { profile } = await state(tx, b.athleteId);
    let payload: DraftPayload = {
      baseProfileAt: profile?.updatedAt.toISOString() ?? null,
      changes: [],
    };
    if (b.draftId)
      payload = (
        await loadDraft(tx, actor, b.athleteId, b.draftId, b.revision!)
      ).payload;
    for (const id of b.ids) {
      if (b.operation === 'discardChange') {
        payload.changes = payload.changes.filter((c) => c.key !== id);
        continue;
      }
      const w = await editable(tx, b.athleteId, id);
      const previous = payload.changes.find((c) => c.id === id);
      let change: DraftChange = previous ?? {
        key: randomUUID(),
        id: w.id,
        brickGroupId:w.brickGroupId,partOrder:w.partOrder,
        baseUpdatedAt: w.updatedAt.toISOString(),
        date: w.date.toISOString().slice(0, 10),
        title: w.title,
        description: w.description,
        modality: w.modality,
        duration: w.duration,
        targetZone: w.targetZone,
        phase: w.phase ?? 'base',
        structure: w.structure,
        paused: w.paused,
      };
      if (b.operation === 'cancel') change.paused = true;
      if (b.operation === 'move') {
        if (!b.date && b.shiftDays === undefined)
          throw new CoachError('Informe data ou deslocamento.', 422);
        change.date =
          b.date ??
          new Date(
            new Date(change.date + 'T12:00:00Z').getTime() +
              b.shiftDays! * 86400000,
          )
            .toISOString()
            .slice(0, 10);
        future(change.date);
      }
      if (b.operation === 'shorten' || b.operation === 'substitute') {
        const minutes =
          b.minutes ??
          Math.max(4, Math.floor(change.duration * (b.factor ?? 0.8)));
        if (b.operation === 'shorten' && minutes >= change.duration)
          throw new CoachError('Encurtar exige duração menor.', 422);
        if (b.operation === 'substitute' && !b.modality)
          throw new CoachError('Informe modalidade.', 422);
        try {
          const structure = editWorkoutStructure(
            change.structure,
            minutes,
            (b.modality ?? change.modality) as any,
            null,
            profile,
          );
          change = {
            ...change,
            duration: minutes,
            modality: b.modality ?? change.modality,
            structure,
            description:
              describeStructure(structure) + '\n\n' + change.description,
            spec: undefined,
            title: b.modality
              ? 'Sessão substituída · ' + b.modality
              : change.title,
          };
        } catch {
          throw new CoachError(
            'Sessão sem blocos válidos. Abra o editor para estruturar.',
            422,
          );
        }
      }
      payload.changes = payload.changes.filter((c) => c.id !== id);
      payload.changes.push(change);
    }
    return saveDraft(
      tx,
      actor,
      b.athleteId,
      payload,
      b.instructions,
      b.draftId,
      b.revision,
    );
  }, serial);
}

export async function generateCoachDraft(actor: Actor, input: unknown) {
  const b = envelope
    .and(
      z.object({
        startDate: z.string(),
        weeks: z.number().int().min(1).max(12),
      }),
    )
    .parse(input);
  future(b.startDate);
  return prisma.$transaction(async (tx) => {
    await activeLink(tx, actor, b.athleteId, true);
    const { profile, workouts } = await state(tx, b.athleteId);
    const ready = assessmentReadiness(profile);
    if (!ready.complete)
      throw new CoachError(
        'Complete a triagem: ' + ready.missing.join(', '),
        422,
        ready.issues,
      );
    const races = await tx.targetRace.findMany({
      where: { userId: b.athleteId },
      orderBy: { date: 'asc' },
    });
    const since = new Date(Date.now() - 7 * 86400000);
    const logs = await tx.workoutLog.findMany({
      where: { userId: b.athleteId, completedAt: { gte: since } },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });
    const generated = generateStructuredPlan(
      profile,
      races,
      profile!.availableDays,
      b.startDate,
      b.weeks,
      trainingFeedback(
        logs,
        workouts.filter((w) => !w.paused),
      ),
    );
    const end = new Date(
      new Date(b.startDate + 'T12:00:00Z').getTime() + b.weeks * 7 * 86400000,
    )
      .toISOString()
      .slice(0, 10);
    const replacements = workouts.filter(
      (w) =>
        !w.completed &&
        w.date.toISOString().slice(0, 10) >= b.startDate &&
        w.date.toISOString().slice(0, 10) < end,
    );
    const changes: DraftChange[] = replacements.map((w) => ({
      key: randomUUID(),
      id: w.id,
      brickGroupId:w.brickGroupId,partOrder:w.partOrder,
      baseUpdatedAt: w.updatedAt.toISOString(),
      date: w.date.toISOString().slice(0, 10),
      title: w.title,
      description: w.description,
      modality: w.modality,
      duration: w.duration,
      targetZone: w.targetZone,
      phase: w.phase ?? 'base',
      structure: w.structure,
      paused: true,
    }));
    for (const w of generated.workouts)
      changes.push({ ...w, date:new Date(w.date).toISOString().slice(0,10),key: randomUUID(), paused: false });
    if (!generated.workouts.length)
      throw new CoachError('Sem sessões viáveis para esta disponibilidade.', 422, ['weeklyHours','availableDays',...Object.keys(profile?.dailyMinutes && typeof profile.dailyMinutes==='object'?profile.dailyMinutes:{}).map(day=>'dailyMinutes.'+day)].map(field=>assessmentIssue(field,'Revise a disponibilidade: os limites atuais não permitem encaixar sessões.')!));
    return saveDraft(
      tx,
      actor,
      b.athleteId,
      { baseProfileAt: profile?.updatedAt.toISOString() ?? null, changes },
      b.instructions,
    );
  }, serial);
}

export async function publishDraft(actor: Actor, input: unknown) {
  const b = z
    .object({
      athleteId: identity,
      draftId: identity,
      revision: z.number().int().positive(),
      acknowledge: z.literal(true),
      instructions: z.string().max(10000),
    })
    .parse(input);
  return prisma.$transaction(async (tx) => {
    const { link, draft, payload } = await loadDraft(
      tx,
      actor,
      b.athleteId,
      b.draftId,
      b.revision,
    );
    const { profile, workouts } = await state(tx, b.athleteId);
    if (payload.baseProfileAt !== (profile?.updatedAt.toISOString() ?? null))
      throw new CoachError(
        'Triagem ou disponibilidade mudou. Atualize os alvos e revise a proposta antes de publicar.',
        409,
      );
    if (!payload.changes.length)
      throw new CoachError('Rascunho sem alterações.', 422);
    const snapshots = [];
    for (const c of payload.changes) {
      future(c.date);
      if (c.id) {
        const original = await editable(tx, b.athleteId, c.id);
        if (original.updatedAt.toISOString() !== c.baseUpdatedAt)
          throw new CoachError(
            'Uma sessão mudou desde o rascunho. Reabra o treino e revise o conflito.',
            409,
          );
        snapshots.push({ key: c.key, before: original, after: c });
      } else snapshots.push({ key: c.key, before: null, after: c });
    }
    const review = draftPreview(workouts, payload, profile);
    const publication = await tx.coachPublication.create({
      data: {
        linkId: link.id,
        draftId: draft.id,
        authorName: actor.name ?? 'Coach',
        instructions: b.instructions,
        changes: json({ sessions: snapshots, review }),
      },
    });
    let plan = await tx.trainingPlan.findFirst({
      where: { userId: b.athleteId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    if (!plan)
      plan = await tx.trainingPlan.create({
        data: {
          userId: b.athleteId,
          name: 'Periodização do coach',
          generatedBy: 'coach',
          startDate: new Date(payload.changes[0].date),
          endDate: new Date(payload.changes[payload.changes.length - 1].date),
        },
      });
    for (const c of payload.changes) {
      const data = {
        date: new Date(c.date + 'T12:00:00Z'),
        title: c.title,
        description: c.description,
        modality: c.modality,
        duration: c.duration,
        targetZone: c.targetZone,
        phase: c.phase,
        structure: json(c.structure),
        paused: c.paused,
        coachManaged: true,
        brickGroupId:c.brickGroupId??null,partOrder:c.partOrder??0,
        coachPublicationId: publication.id,
        tssEstimate: null,
      };
      if (c.id) {
        const result = await tx.workout.updateMany({
          where: {
            id: c.id,
            userId: b.athleteId,
            completed: false,
            updatedAt: new Date(c.baseUpdatedAt!),
          },
          data,
        });
        if (result.count !== 1)
          throw new CoachError(
            'Treino concluído ou editado durante a publicação.',
            409,
          );
      } else
        await tx.workout.create({
          data: { ...data, userId: b.athleteId, planId: plan.id },
        });
    }
    const bounds = await tx.workout.aggregate({
      where: { planId: plan.id },
      _min: { date: true },
      _max: { date: true },
    });
    await tx.trainingPlan.update({
      where: { id: plan.id },
      data: {
        startDate: bounds._min.date ?? plan.startDate,
        endDate: bounds._max.date ?? plan.endDate,
        summary: json({
          ...(plan.summary &&
          typeof plan.summary === 'object' &&
          !Array.isArray(plan.summary)
            ? plan.summary
            : {}),
          coachPublicationId: publication.id,
        }),
      },
    });
    await tx.coachDraft.update({
      where: { id: draft.id },
      data: {
        status: 'published',
        instructions: b.instructions,
        revision: { increment: 1 },
      },
    });
    await audit(tx, link.id, actor.id, 'periodizacao_publicada', {
      publicationId: publication.id,
      sessions: payload.changes.length,
    });
    await tx.coachMessage.create({
      data: {
        userId: b.athleteId,
        coachId: actor.id,
        message: `Nova publicação de ${actor.name ?? 'seu coach'}: ${payload.changes.length} alteração(ões). ${b.instructions}`,
      },
    });
    return { ok: true, publicationId: publication.id, review };
  }, serial);
}

export async function rebaseDraft(actor: Actor, input: unknown) {
  const b = z
    .object({
      athleteId: identity,
      draftId: identity,
      revision: z.number().int().positive(),
    })
    .parse(input);
  return prisma.$transaction(async (tx) => {
    const { draft, payload } = await loadDraft(
      tx,
      actor,
      b.athleteId,
      b.draftId,
      b.revision,
    );
    const { profile } = await state(tx, b.athleteId);
    for (const c of payload.changes) {
      if (c.id) {
        const original = await editable(tx, b.athleteId, c.id);
        if (original.updatedAt.toISOString() !== c.baseUpdatedAt)
          throw new CoachError(
            'Há conflito de sessão. Remova a alteração pendente e reabra a versão publicada antes de editar.',
            409,
          );
      }
      if (c.spec) {
        const compiled = compileSession(c.spec, profile);
        if (compiled.length === 1) {
          c.structure = compiled[0].structure;
          c.description = compiled[0].description;
        }
      } else if (c.modality === 'ciclismo') {
        const updated = retargetBike(c.structure, profile ?? {});
        if (updated) {
          c.structure = updated;
          c.description = describeStructure(updated);
        }
      }
    }
    payload.baseProfileAt = profile?.updatedAt.toISOString() ?? null;
    return tx.coachDraft.update({
      where: { id: draft.id },
      data: { payload: json(payload), revision: { increment: 1 } },
    });
  }, serial);
}

export async function coachAthleteData(actor: Actor, athleteId: string) {
  coach(actor);
  return prisma.$transaction(async (tx) => {
    const link = await activeLink(tx, actor, athleteId);
    const user = await tx.user.findUniqueOrThrow({
      where: { id: athleteId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    const { profile, workouts } = await state(tx, athleteId);
    const [races, drafts, publications, audits, history] = await Promise.all([
      tx.targetRace.findMany({
        where: { userId: athleteId },
        orderBy: { date: 'asc' },
      }),
      tx.coachDraft.findMany({
        where: { linkId: link.id, status: 'draft' },
        orderBy: { updatedAt: 'desc' },
      }),
      tx.coachPublication.findMany({
        where: { linkId: link.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      tx.coachAudit.findMany({
        where: { linkId: link.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      tx.workout.findMany({
        where: { userId: athleteId, completed: true },
        include: { log: true },
        orderBy: { date: 'desc' },
        take: 100,
      }),
    ]);
    return {
      athlete: user,
      profile: publicProfile(profile),
      races,
      workouts,
      history,
      drafts: drafts.map((d) => ({
        ...d,
        review: draftPreview(
          workouts,
          d.payload as unknown as DraftPayload,
          profile,
        ),
        profileConflict:
          (d.payload as unknown as DraftPayload).baseProfileAt !==
          (profile?.updatedAt.toISOString() ?? null),
      })),
      publications,
      audits,
    };
  });
}

export async function coachList(actor: Actor) {
  coach(actor);
  const links = await prisma.coachAthlete.findMany({
    where: { coachId: actor.id, status: { in: ['active', 'pending'] } },
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
          email: true,
          trainingPlans: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              workouts: {
                where: { date: { gte: new Date(today()) }, paused: false },
                orderBy: { date: 'asc' },
                take: 1,
                select: { phase: true },
              },
            },
          },
          targetRaces: {
            where: { date: { gte: new Date(today()) } },
            orderBy: { date: 'asc' },
            take: 1,
          },
          workouts: {
            where: {
              ...activePlans,
              date: { lte: new Date(today() + 'T23:59:59Z') },
            },
            orderBy: { date: 'desc' },
            take: 5,
            include: { log: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return links.map((l) => ({
    id: l.id,
    status: l.status,
    athlete: l.athlete,
    ...(l.status === 'pending'
      ? {
          athlete: {
            id: l.athlete.id,
            name: 'Convite pendente',
            email: l.athlete.email,
          },
        }
      : {}),
  }));
}

export async function coachRace(actor: Actor, input: unknown) {
  const b = z
    .object({
      athleteId: identity,
      id: identity.optional(),
      name: z.string().trim().min(1).max(200),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine((v) => Boolean(calendarDay(v))),
      distance: z.string().trim().min(1).max(100),
      priority: z.enum(['A', 'B', 'C']),
      notes: z.string().max(2000).default(''),
    })
    .parse(input);
  return prisma.$transaction(async (tx) => {
    const link = await activeLink(tx, actor, b.athleteId, true);
    const { athleteId, id, ...values } = b;
    let race;
    if (id) {
      const old = await tx.targetRace.findFirst({
        where: { id, userId: athleteId },
      });
      if (!old) throw new CoachError('Prova não encontrada.', 404);
      race = await tx.targetRace.update({
        where: { id, userId: athleteId },
        data: { ...values, date: new Date(b.date + 'T12:00:00Z') },
      });
    } else
      race = await tx.targetRace.create({
        data: {
          ...values,
          userId: athleteId,
          date: new Date(b.date + 'T12:00:00Z'),
        },
      });
    await audit(tx, link.id, actor.id, 'prova_atualizada', { race });
    return { ok: true };
  }, serial);
}

export async function coachMessage(actor: Actor, input: unknown) {
  const b = z
    .object({
      athleteId: identity,
      message: z.string().trim().min(1).max(4000),
    })
    .parse(input);
  return prisma.$transaction(async (tx) => {
    const link = await activeLink(tx, actor, b.athleteId, true);
    await tx.coachMessage.create({
      data: { userId: b.athleteId, coachId: actor.id, message: b.message },
    });
    await audit(tx, link.id, actor.id, 'orientacao_enviada', {
      message: b.message,
    });
    const profile = await tx.athleteProfile.findUnique({
      where: { userId: b.athleteId },
      select: { whatsapp: true },
    });
    return {
      ok: true,
      message: 'Orientação enviada dentro do app.',
      waLink: buildWaLink(profile?.whatsapp, b.message),
    };
  }, serial);
}

export async function saveDraftNotes(actor:Actor,input:unknown){const b=z.object({athleteId:identity,draftId:identity,revision:z.number().int().positive(),instructions:z.string().max(10000)}).parse(input);return prisma.$transaction(async tx=>{const {draft}=await loadDraft(tx,actor,b.athleteId,b.draftId,b.revision);return tx.coachDraft.update({where:{id:draft.id},data:{instructions:b.instructions,revision:{increment:1}}});},serial);}

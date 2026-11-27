'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Bike, CalendarDays, Clock3, Dumbbell, ShieldCheck, Timer, Waves } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatTrainingDuration, WorkoutStructure } from '@/components/workout-structure';
import { workoutPrescription } from '@/lib/training-prescription';
import type { TrainingFeedback } from '@/lib/training-feedback';
import { sessionPurpose, type WeeklyTrainingOverview } from '@/lib/weekly-training-overview';

const sportIcons = { natacao: Waves, ciclismo: Bike, corrida: Timer, forca: Dumbbell, descanso: Clock3 };
const phases: Record<string, string> = {
  base: 'Base', build: 'Construção', construcao: 'Construção', peak: 'Pico',
  pico: 'Pico', polimento: 'Polimento', race: 'Prova', transition: 'Transição',
};
const calendarFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC',
});

type Session = {
  id: string;
  date: string;
  title: string;
  modality: string;
  duration: number;
  phase: string | null;
  completed: boolean;
  description: string;
  structure: unknown;
};

function calendarLink(date: string, view: 'dia' | 'semana', id?: string) {
  return '/calendario?' + new URLSearchParams({ data: date.slice(0, 10), visao: view }).toString()
    + (id ? '#treino-' + encodeURIComponent(id) : '');
}

function SessionCard({ session }: { session: Session }) {
  const purpose = sessionPurpose(session.description);
  const Icon = sportIcons[session.modality as keyof typeof sportIcons] ?? Clock3;
  return (
    <article className="rounded-lg border bg-muted/20 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1">
          <h3 className="break-words font-semibold leading-snug">{session.title}</h3>
          <p className="text-sm text-muted-foreground">
            <span>{workoutPrescription(session)}</span>
            {session.phase && phases[session.phase] && <span> · {phases[session.phase]}</span>}
            {session.completed && <span> · Concluído</span>}
          </p>
        </div>
      </div>
      {purpose && <p className="mt-3 text-sm leading-relaxed">{purpose}</p>}
      <details className="mt-2">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-primary">Ver blocos e descansos</summary>
        <WorkoutStructure value={session.structure} description={session.description} />
      </details>
      <Link href={calendarLink(session.date, 'dia', session.id)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">
        Abrir este treino <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}

function WeekCard({ week, today }: { week: WeeklyTrainingOverview; today: string }) {
  const rows = week.sports.filter(sport => sport.key !== 'forca' && sport.key !== 'descanso'
    || sport.plannedMinutes > 0 || sport.recordedMinutes !== null || sport.missingDuration > 0);
  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div>
            <h2 className="font-display text-2xl font-semibold">Esta semana</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatTrainingDuration(week.minutes * 60)} planejados</p>
          </div>
          <p className="text-sm text-muted-foreground">{week.completed}/{week.total} sessões concluídas</p>
        </div>
        {week.total > 0 && <progress className="block h-2 w-full accent-primary" value={week.completed} max={week.total} aria-label="Sessões concluídas nesta semana" />}
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">Volume planejado e registrado por modalidade</caption>
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="w-1/3 pb-2 text-left font-medium">Modalidade</th>
              <th scope="col" className="pb-2 text-right font-medium">Planejado</th>
              <th scope="col" className="pb-2 text-right font-medium">Realizado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(sport => {
              const Icon = sportIcons[sport.key];
              return (
                <tr key={sport.key} className="border-b">
                  <th scope="row" className="py-3 pr-1 text-left font-medium">
                    <span className="flex items-center gap-1.5"><Icon aria-hidden="true" className="hidden h-4 w-4 text-primary min-[400px]:block" />{sport.label}</span>
                  </th>
                  <td className="py-3 text-right tabular-nums">{formatTrainingDuration(sport.plannedMinutes * 60)}</td>
                  <td className="py-3 pl-1 text-right tabular-nums">
                    {sport.recordedMinutes !== null
                      ? formatTrainingDuration(sport.recordedMinutes * 60)
                      : !sport.missingDuration && <span className="text-xs text-muted-foreground">Sem registro</span>}
                    {sport.missingDuration > 0 && <span className="block text-xs text-muted-foreground">{sport.missingDuration} {sport.missingDuration === 1 ? 'sessão' : 'sessões'} sem duração</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground">O realizado soma as durações informadas nos treinos agendados para esta semana.</p>
        <Link href={calendarLink(today, 'semana')} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Abrir calendário da semana <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function TrainingOverview({ today, todayWorkouts, next, week }: {
  today: string;
  todayWorkouts: Session[];
  next: Session | null;
  week: WeeklyTrainingOverview;
}) {
  const [feedback, setFeedback] = useState<TrainingFeedback | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/training-feedback', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error();
      setFeedback(await response.json());
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, []);

  return (
    <section className="training-overview grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]" aria-label="Agenda e resumo semanal">
      <Card className="next-session">
        <CardContent className="space-y-4 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Hoje</h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{calendarFormat.format(new Date(today + 'T12:00:00Z'))}</p>
            </div>
            <CalendarDays aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" />
          </div>
          {todayWorkouts.length
            ? todayWorkouts.map(session => <SessionCard session={session} key={session.id} />)
            : <p className="text-sm text-muted-foreground">Sem sessões agendadas para hoje.</p>}
          {next && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground">Próxima sessão · {calendarFormat.format(new Date(next.date))}</p>
              <SessionCard session={next} />
            </div>
          )}
          {!todayWorkouts.length && !next && <Link className="inline-flex min-h-11 items-center font-semibold text-primary" href="/plano">Abrir plano e triagem <ArrowUpRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link>}
        </CardContent>
      </Card>
      <div className="space-y-4">
        <WeekCard week={week} today={today} />
        <Card>
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Recuperação</h2>
            <p className="mt-2 text-sm leading-relaxed">{feedback?.reasons[0] ?? (failed ? 'Não foi possível consultar seus check-ins.' : 'Consultando os check-ins recentes…')}</p>
            <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary" href={calendarLink(today, 'dia')}>Registrar esforço, sono e dor →</Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

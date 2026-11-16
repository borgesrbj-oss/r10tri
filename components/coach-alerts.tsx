'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CoachAlertReport } from '@/lib/coach-alerts';

type Report = CoachAlertReport & { limited: boolean; totalAthletes: number };
type State = { phase: 'loading' } | { phase: 'error'; message: string } | { phase: 'ready'; report: Report };
class AlertFetchError extends Error {}

export function CoachAlerts() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/coach-alerts', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new AlertFetchError(response.status === 401 ? 'Sua sessão expirou. Entre novamente para consultar os alertas.' : response.status === 403 ? 'Este painel está disponível apenas para treinadores.' : 'Não foi possível carregar os alertas. Tente novamente.');
        const report = await response.json();
        if (!report?.summary || !Array.isArray(report.athletes)) throw new AlertFetchError('A resposta dos alertas não pôde ser carregada.');
        if (!controller.signal.aborted) setState({ phase: 'ready', report });
      })
      .catch(error => { if (!controller.signal.aborted) setState({ phase: 'error', message: error instanceof AlertFetchError ? error.message : 'Não foi possível conectar ao aplicativo. Confira sua conexão.' }); });
    return () => controller.abort();
  }, [revision]);

  function refresh() { setState({ phase: 'loading' }); setRevision(value => value + 1); }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg"><AlertCircle className="h-5 w-5 text-primary" /> Atenção aos atletas</CardTitle>
          <Button variant="outline" size="sm" onClick={refresh} disabled={state.phase === 'loading'}><RefreshCw className="mr-1.5 h-4 w-4" /> Atualizar</Button>
        </div>
        <CardDescription>Sinais para revisão do coach, não avaliação médica. O coach decide os ajustes com o atleta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.phase === 'loading' && <p role="status" className="text-sm text-muted-foreground">Conferindo triagens, registros e planejamento…</p>}
        {state.phase === 'error' && <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{state.message}</p><Button variant="outline" size="sm" onClick={refresh}>Tentar novamente</Button></div>}
        {state.phase === 'ready' && (
          <>
            <div className="flex flex-wrap gap-2 text-sm" aria-label="Resumo dos alertas">
              <Badge variant="secondary">{state.report.summary.athletesReviewed} atletas revisados</Badge>
              <Badge variant="outline">{state.report.summary.athletesWithAlerts} pedem atenção</Badge>
              <Badge variant="outline">{state.report.summary.checkinsForReview} check-ins para conversar</Badge>
            </div>
            {state.report.athletes.length === 0 ? <p role="status" className="rounded-md bg-muted/50 p-4 text-sm">Nenhum sinal para revisão nos dados disponíveis. Acompanhe os próximos registros dos atletas.</p> : (
              <ul className="space-y-3">
                {(expanded ? state.report.athletes : state.report.athletes.slice(0, 8)).map(athlete => (
                  <li key={athlete.id} className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium">{athlete.name}</h3>
                      <Link href={`/atletas/${encodeURIComponent(athlete.id)}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">Revisar atleta <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {athlete.alerts.map(alert => <li key={alert.kind}><p className="font-medium">{alert.title}</p><p className="text-muted-foreground">{alert.detail}</p></li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
            {state.report.athletes.length > 8 && <Button variant="outline" size="sm" onClick={() => setExpanded(value => !value)}>{expanded ? 'Mostrar menos' : `Mostrar todos (${state.report.athletes.length})`}</Button>}
            <p className="text-xs text-muted-foreground">A semana vai de segunda a domingo. O volume e os atrasos consideram planos ativos e treinos avulsos, pelo dia de calendário de São Paulo.</p>
            {state.report.limited && <p className="text-sm text-muted-foreground">Painel limitado a {state.report.summary.athletesReviewed} de {state.report.totalAthletes} atletas. <Link href="/atletas" className="text-primary hover:underline">Abrir gestão de atletas</Link></p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

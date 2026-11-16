'use client';

import { useState } from 'react';
import { useCurrentTime } from '@/hooks/use-browser-state';
import { formatRaceTime, predictRaceTime } from '@/lib/race-prediction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function RacePrediction({ profile }: { profile: { modality?: string | null; recentRaceDistanceKm?: unknown; recentRaceTimeSeconds?: unknown; recentRaceDate?: string | Date | null } | null }) {
  const [target, setTarget] = useState('');
  const now = useCurrentTime();
  const prediction = now === null ? null : predictRaceTime({ ...profile, targetDistanceKm: target }, new Date(now));
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-lg">Estimativa para prova de corrida</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Utiliza apenas o resultado de corrida registrado na triagem. Não prevê etapas após natação/ciclismo nem o tempo total do triatlo.</p>
        <div className="space-y-2">
          <Label htmlFor="race-prediction-distance">Distância alvo</Label>
          <select id="race-prediction-distance" value={target} onChange={event => setTarget(event.target.value)} className="min-h-11 w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">Escolha uma distância</option>
            <option value="5">5 km</option><option value="10">10 km</option><option value="15">15 km</option><option value="21.0975">Meia maratona — 21,0975 km</option><option value="42.195">Maratona — 42,195 km</option>
          </select>
        </div>
        <div aria-live="polite" className="space-y-2">
          {!prediction ? <p className="text-sm text-muted-foreground">Preparando a data de referência…</p> : !prediction.available ? <p className="text-sm text-muted-foreground">{prediction.reason}</p> : <>
            <p className="text-2xl font-semibold tabular-nums">{formatRaceTime(prediction.seconds)} <span className="text-sm font-normal text-muted-foreground">— pace aproximado {formatRaceTime(prediction.paceSecondsPerKm)}/km</span></p>
            <p className="text-xs text-muted-foreground">Resultado de referência registrado há {prediction.resultAgeDays} dias. O limite de 180 dias é uma regra de atualização do app.</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{prediction.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
          </>}
        </div>
        <p className="text-xs text-muted-foreground">Método: T₂ = T₁ × (D₂/D₁)^1,06. <a className="text-primary underline" href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0157257" target="_blank" rel="noopener noreferrer">Referência e limitações do modelo</a>.</p>
      </CardContent>
    </Card>
  );
}

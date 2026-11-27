import { formatRaceTime } from '@/lib/race-prediction';
import type { TriathlonRaceTarget } from '@/lib/triathlon-race';

const showTime = (seconds: number | null) => seconds == null ? '—' : formatRaceTime(seconds);

export function TriathlonRaceTargetSummary({ target }: { target: TriathlonRaceTarget }) {
  return (
    <section className="space-y-2 text-sm" aria-label="Metas por segmento">
      <h3 className="font-semibold">{target.status === 'ready' ? 'Metas por segmento' : 'Metas por segmento pendentes'}</h3>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 [font-variant-numeric:tabular-nums]">
        {target.segments.map(segment => (
          <div key={segment.key} className="contents">
            <dt>{segment.label}</dt>
            <dd className="text-right" title={segment.reference ?? undefined}>
              {showTime(segment.seconds)}
              {segment.intensityTarget && <span className="block text-xs text-muted-foreground">{segment.intensityTarget}</span>}
            </dd>
          </div>
        ))}
        <div className="contents"><dt>Meta informada</dt><dd className="text-right">{showTime(target.goalSeconds)}</dd></div>
        {target.status === 'ready'
          ? <div className="contents"><dt>Soma dos segmentos</dt><dd className="text-right font-semibold">{showTime(target.totalSeconds)}</dd></div>
          : target.subtotalSeconds > 0 && <div className="contents"><dt>Subtotal calculado</dt><dd className="text-right">{showTime(target.subtotalSeconds)}</dd></div>}
      </dl>
      {target.status === 'ready' && <p className="text-xs text-muted-foreground">Diferença de {(target.differenceFraction * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% em relação à meta informada.</p>}
      {target.rangeSource && <p className="break-words text-xs text-muted-foreground">Referência das faixas · {target.rangeSource}</p>}
      {target.issues.length > 0 && (
        <details><summary className="cursor-pointer text-primary">Revisar {target.issues.length} pendência(s)</summary>
          <ul className="mt-1 list-disc space-y-1 pl-5">{target.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>
        </details>
      )}
    </section>
  );
}

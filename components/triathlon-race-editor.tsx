'use client';

import { Input } from '@/components/ui/input';
import { formatRaceTime, parseRaceTime } from '@/lib/race-prediction';
import {
  TRIATHLON_FORMATS, TRIATHLON_SEGMENTS, TRIATHLON_DISTANCE_FIELDS,
  type CoachRaceTargetsInput, type RaceTargetsConfig, type TriathlonFormat, type TriathlonSegment,
} from '@/lib/triathlon-race';

const segments = Object.entries(TRIATHLON_SEGMENTS) as [TriathlonSegment, string][];
const sports = Object.keys(TRIATHLON_DISTANCE_FIELDS) as (keyof typeof TRIATHLON_DISTANCE_FIELDS)[];
const time = (value?: number) => value == null ? '' : formatRaceTime(value);
const decimal = (value?: number) => value == null ? '' : String(value);
const referenceLabel: Record<TriathlonSegment, string> = {
  natacao: 'Ritmo por 100 m (m:ss)', t1: 'Tempo de transição (m:ss)',
  ciclismo: 'Velocidade (km/h)', t2: 'Tempo de transição (m:ss)', corrida: 'Ritmo após o pedal por km (m:ss)',
};

type SegmentDraft = { min: string; max: string; reference: string; source: string };
export type TriathlonRaceDraft = {
  goal: string;
  rangeSource: string;
  distances: Record<keyof typeof TRIATHLON_DISTANCE_FIELDS, string>;
  segments: Record<TriathlonSegment, SegmentDraft>;
  bikeWatts: string;
  confirmed: boolean;
};

export function raceTargetDraft(saved?: RaceTargetsConfig, currentLevel?: string): TriathlonRaceDraft {
  const fields = Object.fromEntries(segments.map(([key]) => [key, {
    min: time(saved?.ranges?.[key]?.minSeconds),
    max: time(saved?.ranges?.[key]?.maxSeconds),
    reference: key === 'ciclismo' ? decimal(saved?.references?.[key]?.value) : time(saved?.references?.[key]?.value),
    source: saved?.references?.[key]?.source ?? '',
  }])) as TriathlonRaceDraft['segments'];
  return {
    goal: time(saved?.goalSeconds), rangeSource: saved?.rangeSource ?? '', segments: fields,
    confirmed: currentLevel != null && saved?.reviewedLevel === currentLevel,
    distances: {
      natacao: decimal(saved?.distancesMeters?.swimMeters),
      ciclismo: decimal(saved?.distancesMeters?.bikeMeters),
      corrida: decimal(saved?.distancesMeters?.runMeters),
    },
    bikeWatts: decimal(saved?.references?.ciclismo?.watts),
  };
}

function parseTime(value: string, field: string) {
  if (!value.trim()) return undefined;
  const result = parseRaceTime(value);
  if (result === null) throw Error(`${field}. Use o formato m:ss ou h:mm:ss.`);
  return result;
}

export function raceTargetPayload(draft: TriathlonRaceDraft): CoachRaceTargetsInput {
  const optionalNumber = (value: string) => value.trim() ? Number(value) : undefined;
  return {
    goalSeconds: parseTime(draft.goal, 'Confira o tempo-alvo total'),
    rangeSource: draft.rangeSource.trim() || undefined,
    confirmed: draft.confirmed,
    distancesMeters: Object.fromEntries(sports.map(sport => [TRIATHLON_DISTANCE_FIELDS[sport], optionalNumber(draft.distances[sport])])),
    ranges: Object.fromEntries(segments.map(([key, label]) => [key, {
      minSeconds: parseTime(draft.segments[key].min, `Confira o limite mínimo de ${label}`),
      maxSeconds: parseTime(draft.segments[key].max, `Confira o limite máximo de ${label}`),
    }])),
    references: Object.fromEntries(segments.map(([key, label]) => [key, {
      value: key === 'ciclismo' ? optionalNumber(draft.segments[key].reference) : parseTime(draft.segments[key].reference, `Confira a referência de ${label}`),
      source: draft.segments[key].source.trim() || undefined,
      ...(key === 'ciclismo' ? { watts: optionalNumber(draft.bikeWatts) } : {}),
    }])),
  };
}

export function TriathlonRaceEditor({ format, value, onChange }: {
  format: TriathlonFormat;
  value: TriathlonRaceDraft;
  onChange: (value: TriathlonRaceDraft) => void;
}) {
  const defaults = TRIATHLON_FORMATS[format];
  const segmentChange = (key: TriathlonSegment, field: keyof SegmentDraft, text: string) => {
    onChange({ ...value, confirmed: false, segments: {
      ...value.segments, [key]: { ...value.segments[key], [field]: text },
    } });
  };
  return (
    <fieldset className="space-y-3 rounded-xl border p-3 sm:col-span-2">
      <legend className="px-1 font-semibold">Metas por segmento · {defaults.label}</legend>
      <p className="text-sm text-muted-foreground">Use faixas da prova e referências comparáveis do atleta. Campos incompletos deixam a meta pendente.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">Meta total (h:mm:ss)
          <Input value={value.goal} onChange={e => onChange({ ...value, goal: e.target.value })} placeholder="2:50:00" />
        </label>
        <label className="space-y-1">Fonte das faixas de tempo
          <Input value={value.rangeSource} onChange={e => onChange({ ...value, confirmed: false, rangeSource: e.target.value })} maxLength={600} placeholder="Resultados oficiais e categoria" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {sports.map(sport => <label className="space-y-1" key={sport}>{TRIATHLON_SEGMENTS[sport]} (m)
          <Input type="number" min={1} max={1000000} placeholder={String(defaults[TRIATHLON_DISTANCE_FIELDS[sport]])}
            value={value.distances[sport]} onChange={e => onChange({ ...value, confirmed: false, distances: { ...value.distances, [sport]: e.target.value } })} />
        </label>)}
      </div>
      {segments.map(([key, label]) => <fieldset key={key} className="grid gap-2 rounded-lg border p-2 text-sm sm:grid-cols-2">
        <legend className="px-1 font-medium">{label}</legend>
        <label className="space-y-1">Tempo mínimo (m:ss ou h:mm:ss)
          <Input value={value.segments[key].min} onChange={e => segmentChange(key, 'min', e.target.value)} />
        </label>
        <label className="space-y-1">Tempo máximo (m:ss ou h:mm:ss)
          <Input value={value.segments[key].max} onChange={e => segmentChange(key, 'max', e.target.value)} />
        </label>
        <label className="space-y-1">{referenceLabel[key]}
          <Input type={key === 'ciclismo' ? 'number' : 'text'} step={key === 'ciclismo' ? 'any' : undefined}
            value={value.segments[key].reference} onChange={e => segmentChange(key, 'reference', e.target.value)} />
        </label>
        <label className="space-y-1">Origem da referência
          <Input value={value.segments[key].source} onChange={e => segmentChange(key, 'source', e.target.value)} maxLength={600} placeholder="Prova, simulado ou sessão comparável" />
        </label>
        {key === 'ciclismo' && <label className="space-y-1">Potência-alvo opcional (W)
          <Input type="number" min={1} max={1500} value={value.bikeWatts} onChange={e => onChange({ ...value, confirmed: false, bikeWatts: e.target.value })} />
        </label>}
      </fieldset>)}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={value.confirmed} onChange={e => onChange({ ...value, confirmed: e.target.checked })} />
        Conferi as referências para a prova e o nível atual do atleta.
      </label>
    </fieldset>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const input =
  'w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-base';
const button = 'rounded-lg border px-4 py-2 min-h-11 disabled:opacity-50';
const primary = button + ' bg-primary text-primary-foreground';
const days = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const block = (kind = 'principal', seconds = 1200) => ({
  kind,
  label: kind === 'principal' ? 'Bloco de trabalho' : kind,
  seconds,
  repeat: 1,
  recoverySeconds: 0,
  zone: 'Z2',
  passive: false,
  notes: '',
});
const initial = () => ({
  date: new Date().toISOString().slice(0, 10),
  title: 'Sessão orientada',
  modality: 'corrida',
  phase: 'base',
  notes: '',
  blocks: [block('aquecimento', 300), block(), block('desaquecimento', 300)],
  transitionSeconds: 120,
  runBlocks: [block('principal', 600)],
});
const percent = (value: number | null) =>
  value == null ? 'Desconhecido' : Math.round(value * 100) + '%';
function Blocks({
  value,
  onChange,
  ftp,
  power,
}: {
  value: any[];
  onChange: (v: any[]) => void;
  ftp: number;
  power: boolean;
}) {
  function set(index: number, key: string, v: any) {
    onChange(value.map((b, i) => (i === index ? { ...b, [key]: v } : b)));
  }
  return (
    <div className="space-y-3">
      {value.map((b, i) => (
        <fieldset
          key={i}
          className="rounded-xl border bg-background/40 p-3 space-y-3"
        >
          <legend className="px-1 text-sm font-semibold">Bloco {i + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              Etapa
              <select
                className={input}
                value={b.kind}
                onChange={(e) => set(i, 'kind', e.target.value)}
              >
                {[
                  ['aquecimento', 'Aquecimento'],
                  ['principal', 'Trabalho'],
                  ['recuperacao', 'Recuperação'],
                  ['desaquecimento', 'Desaquecimento'],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descrição
              <input
                className={input}
                value={b.label}
                onChange={(e) => set(i, 'label', e.target.value)}
              />
            </label>
            <label>
              Duração por repetição (segundos)
              <input
                className={input}
                type="number"
                min={1}
                value={b.seconds}
                onChange={(e) => set(i, 'seconds', Number(e.target.value))}
              />
            </label>
            <label>
              Repetições
              <input
                className={input}
                type="number"
                min={1}
                max={30}
                value={b.repeat}
                onChange={(e) => set(i, 'repeat', Number(e.target.value))}
              />
            </label>
            <label>
              Recuperação entre repetições (s)
              <input
                className={input}
                type="number"
                min={0}
                value={b.recoverySeconds}
                onChange={(e) =>
                  set(i, 'recoverySeconds', Number(e.target.value))
                }
              />
            </label>
            <label>
              Distância auxiliar por repetição (m)
              <input
                className={input}
                type="number"
                min={1}
                value={b.distanceMeters ?? ''}
                onChange={(e) =>
                  set(
                    i,
                    'distanceMeters',
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </label>
            <label>
              Zona
              <select
                className={input}
                value={b.zone}
                onChange={(e) => set(i, 'zone', e.target.value)}
              >
                {['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={b.passive}
                onChange={(e) => set(i, 'passive', e.target.checked)}
              />
              Repouso passivo
            </label>
            {power && (
              <>
                <label>
                  FTP mínimo (%) — opcional
                  <input
                    className={input}
                    type="number"
                    step="0.1"
                    value={b.ftpLow ?? ''}
                    onChange={(e) =>
                      set(
                        i,
                        'ftpLow',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </label>
                <label>
                  FTP máximo (%) — opcional
                  <input
                    className={input}
                    type="number"
                    step="0.1"
                    value={b.ftpHigh ?? ''}
                    onChange={(e) =>
                      set(
                        i,
                        'ftpHigh',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </label>
                <p className="text-sm self-end">
                  {b.ftpLow && b.ftpHigh && ftp
                    ? `${Math.round((ftp * b.ftpLow) / 100)}–${Math.round((ftp * b.ftpHigh) / 100)} W com FTP ${ftp} W`
                    : 'Por zona: alvos calculados no servidor. Sem FTP/equipamento, use PSE.'}
                </p>
              </>
            )}
          </div>
          <label className="block">
            Observações do bloco
            <textarea
              className={input}
              rows={2}
              value={b.notes}
              onChange={(e) => set(i, 'notes', e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              disabled={i === 0}
              onClick={() => {
                const n = [...value];
                [n[i - 1], n[i]] = [n[i], n[i - 1]];
                onChange(n);
              }}
            >
              Subir bloco
            </button>
            <button
              type="button"
              className={button}
              disabled={value.length === 1}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              Remover bloco do rascunho
            </button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        className={button}
        onClick={() => onChange([...value, block()])}
      >
        Adicionar bloco
      </button>
    </div>
  );
}
export function CoachAthleteEditor({ data }: { data: any }) {
  const router = useRouter();
  const [view, setView] = useState('calendario'),
    [spec, setSpec] = useState<any>(initial),
    [duplicate, setDuplicate] = useState(false),
    [changeKey, setChangeKey] = useState(''),
    [draftId, setDraftId] = useState(data.drafts[0]?.id || ''),
    [instructions, setInstructions] = useState(
      data.drafts[0]?.instructions || '',
    ),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false),
    [waLink, setWaLink] = useState(''),
    [busy, setBusy] = useState(false),
    [ack, setAck] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [from, setFrom] = useState(new Date().toISOString().slice(0, 10)),
    [to, setTo] = useState(() =>
      new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
    ),
    [shift, setShift] = useState(1),
    [profile, setProfile] = useState<any>(data.profile || {}),
    [race, setRace] = useState<any>({
      name: '',
      date: '',
      distance: '',
      priority: 'A',
      notes: '',
    });
  const draft = data.drafts.find((d: any) => d.id === draftId);
  const envelope = {
    athleteId: data.athlete.id,
    ...(draft ? { draftId: draft.id, revision: draft.revision } : {}),
    instructions,
  };
  async function send(action: string, body: any) {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      const r = await fetch('/api/coach/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok)
        throw Error(
          [
            d.error,
            ...(d.details || []).map((e: any) => e.field + ' — ' + e.message),
          ].join('\n'),
        );
      if (d.id && ['session', 'batch', 'generate', 'rebase','notes'].includes(action)) {
        setDraftId(d.id);
        setView('revisao');
      }
      if (d.waLink) setWaLink(d.waLink);
      if (action === 'publish') {
        setDraftId('');
        setAck(false);
        setInstructions('');
      }
      setMessage(
        d.message ||
          (action === 'publish'
            ? 'Publicado no calendário do atleta.'
            : 'Salvo. Confira a revisão antes de publicar.'),
      );
      router.refresh();
      return true;
    } catch (e) {
      setFailed(true);
      setMessage((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function edit(w: any, copy = false) {
    setChangeKey(w.key || '');
    if (w.spec) {
      setSpec({
        ...w.spec,
        id: w.id,
        date: copy ? from : String(w.date).slice(0, 10),
        title: copy ? 'Cópia · ' + w.title : w.title,
      });
      setDuplicate(copy);
      setView('editor');
      return;
    }
    const s = w.structure;
    setSpec({
      id: w.id,
      date: copy ? from : String(w.date).slice(0, 10),
      title: copy ? 'Cópia · ' + w.title : w.title,
      modality: w.modality === 'descanso' ? 'corrida' : w.modality,
      phase: ['base', 'build', 'peak', 'race', 'transition'].includes(w.phase)
        ? w.phase
        : 'base',
      notes: w.description || '',
      blocks:
        s?.steps?.map((b: any) => ({
          kind: b.kind,
          label: b.label,
          seconds: b.durationSeconds,
          repeat: 1,
          recoverySeconds: 0,
          zone: b.zone || 'Z1',
          passive: b.rest === 'passivo',
          distanceMeters: b.distanceMeters,
          ...(String(b.target?.source).startsWith('Faixa percentual') &&
          String(b.target?.text).match(/^(\d+(?:\.\d+)?)–(\d+(?:\.\d+)?)%/)
            ? {
                ftpLow: Number(
                  String(b.target.text).match(
                    /^(\d+(?:\.\d+)?)–(\d+(?:\.\d+)?)%/,
                  )![1],
                ),
                ftpHigh: Number(
                  String(b.target.text).match(
                    /^(\d+(?:\.\d+)?)–(\d+(?:\.\d+)?)%/,
                  )![2],
                ),
              }
            : {}),
          notes: '',
        })) || initial().blocks,
      transitionSeconds: 120,
      runBlocks: [block('principal', 600)],
    });
    setDuplicate(copy);
    setView('editor');
  }
  const visible = data.workouts.filter(
    (w: any) =>
      String(w.date).slice(0, 10) >= from && String(w.date).slice(0, 10) <= to,
  );
  const editable = (w: any) =>
    !w.completed &&
    String(w.date).slice(0, 10) >= new Date().toISOString().slice(0, 10);
  const numericFields = [
    ['currentWeight', 'Peso (kg)'],
    ['heightCm', 'Altura (cm)'],
    ['weeklyHours', 'Horas disponíveis/semana'],
    ['currentWeeklyVol', 'Horas recentes/semana'],
    ['ftp', 'FTP (W)'],
    ['maxHeartRate', 'FC máxima'],
    ['restingHeartRate', 'FC repouso'],
    ['thresholdHeartRate', 'FC limiar'],
    ['sleepHours', 'Sono (horas)'],
  ];
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link className="text-primary underline" href="/coach">
          Voltar ao painel do coach
        </Link>
        <h1 className="text-3xl font-semibold">
          {data.athlete.name || 'Atleta'}
        </h1>
        <p className="break-all text-muted-foreground">
          {data.athlete.email} · vínculo ativo
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className={view === 'calendario' ? primary : button}
            onClick={() => setView('calendario')}
          >
            Abrir calendário
          </button>
          <button
            className={view === 'editor' ? primary : button}
            onClick={() => {
              setSpec(initial());
              setDuplicate(false);
              setChangeKey('');
              setView('editor');
            }}
          >
            Criar treino
          </button>
          <button
            className={view === 'revisao' ? primary : button}
            onClick={() => setView('revisao')}
          >
            Revisar alterações ({data.drafts.length})
          </button>
          <button className={button} onClick={() => setView('perfil')}>
            Cadastro e triagem
          </button>
          <button className={button} onClick={() => setView('historico')}>
            Histórico e publicações
          </button>
        </div>
      </header>
      {message && (
        <p
          role={failed ? 'alert' : 'status'}
          className={
            'whitespace-pre-wrap rounded-xl border p-4 ' +
            (failed
              ? 'border-destructive text-destructive'
              : 'border-primary text-primary')
          }
        >
          {message}
        </p>
      )}
      {view === 'perfil' && (
        <section className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Dados esportivos e disponibilidade
          </h2>
          <p className="text-sm text-muted-foreground">
            Alterações são registradas com autor e data. Treinos publicados
            exigem revisão explícita para receber novos alvos.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send('profile', { athleteId: data.athlete.id, profile });
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {numericFields.map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    className={input}
                    type="number"
                    step="any"
                    value={profile[key] ?? ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        [key]: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </label>
              ))}
              {[
                ['birthDate', 'Nascimento', 'date'],
                ['runThresholdPace', 'Pace limiar corrida (mm:ss/km)', 'text'],
                ['swimCssPace', 'CSS (mm:ss/100m)', 'text'],
                ['goalTime', 'Tempo objetivo', 'text'],
              ].map(([key, label, type]) => (
                <label key={key}>
                  {label}
                  <input
                    className={input}
                    type={type}
                    value={String(profile[key] || '').slice(
                      0,
                      type === 'date' ? 10 : undefined,
                    )}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label>
                Modalidade
                <select
                  className={input}
                  value={profile.modality || 'triatlo'}
                  onChange={(e) =>
                    setProfile({ ...profile, modality: e.target.value })
                  }
                >
                  {['triatlo', 'corrida', 'ciclismo', 'natacao'].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label>
                Nível
                <select
                  className={input}
                  value={profile.level || 'intermediario'}
                  onChange={(e) =>
                    setProfile({ ...profile, level: e.target.value })
                  }
                >
                  {['iniciante', 'intermediario', 'avancado'].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['limitations', 'Limitações'],
                ['injuryHistory', 'Histórico de lesões'],
                ['currentInjuries', 'Dor/lesões atuais'],
                ['raceHistory', 'Histórico e objetivos'],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <textarea
                    className={input}
                    rows={3}
                    value={profile[key] || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <fieldset>
              <legend className="mb-2">
                Dias disponíveis e limite diário de minutos
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {days.map((day) => (
                  <label key={day} className="rounded-lg border p-3">
                    <span className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={profile.availableDays?.includes(day) || false}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            availableDays: e.target.checked
                              ? [...(profile.availableDays || []), day]
                              : (profile.availableDays || []).filter(
                                  (v: string) => v !== day,
                                ),
                          })
                        }
                      />
                      {day}
                    </span>
                    <input
                      aria-label={'Minutos em ' + day}
                      className={input + ' mt-2'}
                      type="number"
                      min={0}
                      max={480}
                      value={profile.dailyMinutes?.[day] ?? ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          dailyMinutes: {
                            ...profile.dailyMinutes,
                            [day]: e.target.value
                              ? Number(e.target.value)
                              : null,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend>Preferências para o planejamento</legend>
              <label>
                Máximo de minutos por sessão
                <input
                  className={input}
                  type="number"
                  min={10}
                  max={480}
                  value={profile.planningPreferences?.maxSessionMinutes ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      planningPreferences: {
                        ...profile.planningPreferences,
                        maxSessionMinutes: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </label>
              <div className="flex flex-wrap gap-3">
                {days.map((day) => (
                  <label key={day} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={
                        profile.planningPreferences?.doubleDays?.includes(
                          day,
                        ) || false
                      }
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          planningPreferences: {
                            ...profile.planningPreferences,
                            doubleDays: e.target.checked
                              ? [
                                  ...(profile.planningPreferences?.doubleDays ||
                                    []),
                                  day,
                                ]
                              : (
                                  profile.planningPreferences?.doubleDays || []
                                ).filter((v: string) => v !== day),
                          },
                        })
                      }
                    />
                    Duas sessões: {day}
                  </label>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['corrida', 'ciclismo', 'natacao'].map((m) => (
                  <label key={m}>
                    Volume recente de {m} (min/semana)
                    <input
                      className={input}
                      type="number"
                      min={0}
                      value={
                        profile.planningPreferences?.recentMinutes?.[m] ?? ''
                      }
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          planningPreferences: {
                            ...profile.planningPreferences,
                            recentMinutes: {
                              ...profile.planningPreferences?.recentMinutes,
                              [m]: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-4">
              {[
                ['hasPowerMeter', 'Medidor de potência'],
                ['hasTrainer', 'Rolo compatível'],
                ['hasPoolAccess', 'Piscina disponível'],
                ['canSwim', 'Sabe nadar'],
                ['strengthAvailable', 'Pode treinar força'],
              ].map(([key, label]) => (
                <label className="flex gap-2" key={key}>
                  <input
                    type="checkbox"
                    checked={Boolean(profile[key])}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <button className={primary} disabled={busy}>
              Salvar dados esportivos
            </button>
          </form>
          <h3 className="font-semibold">Provas e objetivos cadastrados</h3>
          <ul>
            {data.races.map((r: any) => (
              <li key={r.id}>
                {r.name} · {String(r.date).slice(0, 10)} · {r.distance} ·
                prioridade {r.priority || 'não informada'}
              </li>
            ))}
          </ul>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              send('race', { athleteId: data.athlete.id, ...race });
            }}
          >
            <label>
              Editar prova existente
              <select
                className={input}
                value={race.id || ''}
                onChange={(e) => {
                  const r = data.races.find(
                    (r: any) => r.id === e.target.value,
                  );
                  setRace(
                    r
                      ? {
                          id: r.id,
                          name: r.name,
                          date: String(r.date).slice(0, 10),
                          distance: r.distance,
                          priority: r.priority || 'A',
                          notes: r.notes || '',
                        }
                      : {
                          name: '',
                          date: '',
                          distance: '',
                          priority: 'A',
                          notes: '',
                        },
                  );
                }}
              >
                <option value="">Nova prova</option>
                {data.races.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome da prova
              <input
                className={input}
                required
                value={race.name}
                onChange={(e) => setRace({ ...race, name: e.target.value })}
              />
            </label>
            <label>
              Data da prova
              <input
                className={input}
                required
                type="date"
                value={race.date}
                onChange={(e) => setRace({ ...race, date: e.target.value })}
              />
            </label>
            <label>
              Distância
              <input
                className={input}
                required
                placeholder="Ex.: 70.3, sprint, 21k"
                value={race.distance}
                onChange={(e) => setRace({ ...race, distance: e.target.value })}
              />
            </label>
            <label>
              Prioridade
              <select
                className={input}
                value={race.priority}
                onChange={(e) => setRace({ ...race, priority: e.target.value })}
              >
                {['A', 'B', 'C'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button className={primary} disabled={busy}>
              Salvar prova e objetivo
            </button>
          </form>
          <p className="text-sm">
            Zonas de potência: Coggan, Z1 40–55%, Z2 56–75%, Z3 76–90%, Z4
            91–105%, Z5 106–120% do FTP. Alvos de corrida/natação dependem dos
            limiares acima; sem limiar, PSE.
          </p>
        </section>
      )}
      {view === 'editor' && (
        <section className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            {spec.id
              ? duplicate
                ? 'Duplicar sessão'
                : 'Editar sessão publicada'
              : 'Nova sessão'}{' '}
            · rascunho
          </h2>
          <p className="text-sm text-muted-foreground">
            O atleta só verá os ajustes após a publicação. Para prescrição por
            distância, informe também a duração prevista para calcular o volume.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              send('session', {
                ...envelope,
                session: spec,
                duplicate,
                ...(changeKey ? { changeKey } : {}),
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                Título
                <input
                  className={input}
                  required
                  value={spec.title}
                  onChange={(e) => setSpec({ ...spec, title: e.target.value })}
                />
              </label>
              <label>
                Data
                <input
                  className={input}
                  required
                  type="date"
                  value={spec.date}
                  onChange={(e) => setSpec({ ...spec, date: e.target.value })}
                />
              </label>
              <label>
                Modalidade
                <select
                  className={input}
                  value={spec.modality}
                  onChange={(e) =>
                    setSpec({ ...spec, modality: e.target.value })
                  }
                >
                  {[
                    ['corrida', 'Corrida'],
                    ['ciclismo', 'Ciclismo'],
                    ['natacao', 'Natação'],
                    ['forca', 'Força'],
                    ['brick', 'Brick: bike + transição + corrida'],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fase
                <select
                  className={input}
                  value={spec.phase}
                  onChange={(e) => setSpec({ ...spec, phase: e.target.value })}
                >
                  {['base', 'build', 'peak', 'race', 'transition'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
            {spec.modality === 'brick' && (
              <h3 className="font-semibold">1. Bike</h3>
            )}
            <Blocks
              value={spec.blocks}
              onChange={(blocks) => setSpec({ ...spec, blocks })}
              ftp={profile.ftp || profile.testFTPEstimated || 0}
              power={['brick', 'ciclismo'].includes(spec.modality)}
            />
            {spec.modality === 'brick' && (
              <>
                <label className="block">
                  2. Transição (segundos)
                  <input
                    className={input}
                    type="number"
                    min={60}
                    max={1800}
                    value={spec.transitionSeconds}
                    onChange={(e) =>
                      setSpec({
                        ...spec,
                        transitionSeconds: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <h3 className="font-semibold">3. Corrida</h3>
                <Blocks
                  value={spec.runBlocks}
                  onChange={(runBlocks) => setSpec({ ...spec, runBlocks })}
                  ftp={0}
                  power={false}
                />
              </>
            )}
            <label className="block">
              Observações da sessão
              <textarea
                className={input}
                rows={3}
                value={spec.notes}
                onChange={(e) => setSpec({ ...spec, notes: e.target.value })}
              />
            </label>
            <button className={primary} disabled={busy}>
              Salvar em rascunho e conferir impacto
            </button>
          </form>
        </section>
      )}
      {view === 'calendario' && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Calendário publicado</h2>
          <div className="flex flex-wrap gap-3">
            <label>
              De
              <input
                className={input}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              Até
              <input
                className={input}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <button
              className={button}
              onClick={() => {
                setTo(
                  new Date(
                    new Date(from + 'T12:00:00Z').getTime() + 6 * 86400000,
                  )
                    .toISOString()
                    .slice(0, 10),
                );
              }}
            >
              Ver semana
            </button>
            <button
              className={button}
              onClick={() =>
                setSelected(visible.filter(editable).map((w: any) => w.id))
              }
            >
              Selecionar período para ajuste
            </button>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p>
              {selected.length} sessões selecionadas · ajustes vão para rascunho
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label>
                Deslocar dias
                <input
                  className={input + ' max-w-28'}
                  type="number"
                  min={-90}
                  max={90}
                  value={shift}
                  onChange={(e) => setShift(Number(e.target.value))}
                />
              </label>
              <button
                className={button}
                disabled={busy || !selected.length}
                onClick={() =>
                  send('batch', {
                    ...envelope,
                    operation: 'move',
                    ids: selected,
                    shiftDays: shift,
                  })
                }
              >
                Mover período
              </button>
              <button
                className={button}
                disabled={busy || !selected.length}
                onClick={() =>
                  send('batch', {
                    ...envelope,
                    operation: 'shorten',
                    ids: selected,
                    factor: 0.8,
                  })
                }
              >
                Reduzir duração em 20%
              </button>
              <button
                className={button}
                disabled={busy || !selected.length}
                onClick={() =>
                  send('batch', {
                    ...envelope,
                    operation: 'cancel',
                    ids: selected,
                  })
                }
              >
                Propor cancelamento
              </button>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {visible.map((w: any) => (
              <article
                key={w.id}
                className="rounded-xl border bg-card p-4 space-y-2"
              >
                <p className="text-sm text-primary">
                  {String(w.date).slice(0, 10)} ·{' '}
                  {w.completed
                    ? 'Realizado'
                    : w.paused
                      ? 'Cancelado/pausado'
                      : w.coachManaged
                        ? 'Publicado pelo coach'
                        : 'Planejado'}
                </p>
                <h3 className="font-semibold">{w.title}</h3>
                <p>
                  {w.duration} min · {w.modality} ·{' '}
                  {w.phase || 'fase não informada'} ·{' '}
                  {w.targetZone || 'sem zona'}
                </p>
                {w.log && (
                  <p className="text-sm">
                    Realizado: {w.log.actualDuration ?? '—'} min · PSE{' '}
                    {w.log.rpe ?? '—'} · fadiga {w.log.fatigueScore ?? '—'} ·
                    dor {w.log.painScore ?? '—'} · sono{' '}
                    {w.log.sleepHours ?? '—'} h
                  </p>
                )}
                {!w.completed &&
                  !w.paused &&
                  String(w.date).slice(0, 10) <
                    new Date().toISOString().slice(0, 10) && (
                    <p className="text-amber-300">
                      Sessão não concluída / perdida
                    </p>
                  )}
                <details>
                  <summary>Blocos e orientações</summary>
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {w.description}
                  </pre>
                </details>
                {editable(w) && (
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(w.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, w.id]
                              : selected.filter((id) => id !== w.id),
                          )
                        }
                      />
                      Selecionar
                    </label>
                    <button className={button} onClick={() => edit(w)}>
                      Editar / substituir / encurtar
                    </button>
                    <button className={button} onClick={() => edit(w, true)}>
                      Duplicar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
          {visible.length === 0 && <p>Nenhuma sessão neste período.</p>}
          <details className="rounded-xl border p-4">
            <summary>
              Gerar proposta de semana ou bloco a partir da triagem
            </summary>
            <p className="my-2 text-sm">
              Preserva o calendário atual. Propõe cancelar sessões futuras no
              período e adicionar a nova sugestão, inclusive quando ajustadas
              pelo coach. Revise cada conflito antes de publicar.
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 4, 12].map((weeks) => (
                <button
                  key={weeks}
                  className={button}
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        'Gerar proposta de ' +
                          weeks +
                          ' semana(s)? Uma nova proposta será criada; rascunhos anteriores e calendário publicado continuam preservados.',
                      )
                    )
                      send('generate', { ...envelope, startDate: from, weeks });
                  }}
                >
                  Propor {weeks} semana(s)
                </button>
              ))}
            </div>
          </details>
        </section>
      )}
      {view === 'revisao' && (
        <section className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Revisar alterações antes de publicar
          </h2>
          <label>
            Rascunho
            <select
              className={input}
              value={draftId}
              onChange={(e) => {
                setDraftId(e.target.value);
                setInstructions(
                  data.drafts.find((d: any) => d.id === e.target.value)
                    ?.instructions || '',
                );
                setAck(false);
              }}
            >
              <option value="">Selecione</option>
              {data.drafts.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {new Date(d.updatedAt).toLocaleString('pt-BR')} · revisão{' '}
                  {d.revision}
                </option>
              ))}
            </select>
          </label>
          {draft ? (
            <>
              <p className="text-amber-300">
                Rascunho privado · {draft.payload.changes.length} alterações · o
                atleta continua vendo a última publicação.
              </p>
              {draft.profileConflict && (
                <p role="alert" className="text-destructive">
                  Triagem/disponibilidade mudou. Atualize os alvos e revise
                  novamente.
                </p>
              )}
              <button
                disabled={busy}
                className={button}
                onClick={() =>
                  send('rebase', {
                    athleteId: data.athlete.id,
                    draftId: draft.id,
                    revision: draft.revision,
                  })
                }
              >
                Atualizar alvos após mudança de perfil
              </button>
              {draft.review.map((w: any) => (
                <article
                  className="rounded-lg border p-4 space-y-2"
                  key={w.start}
                >
                  <h3 className="font-semibold">Semana de {w.start}</h3>
                  <p>
                    Volume: {w.before.minutes} → {w.after.minutes} min
                  </p>
                  <p>
                    Baixa intensidade:{' '}
                    {percent(
                      w.before.nonLowFraction == null
                        ? null
                        : 1 - w.before.nonLowFraction,
                    )}{' '}
                    →{' '}
                    {percent(
                      w.after.nonLowFraction == null
                        ? null
                        : 1 - w.after.nonLowFraction,
                    )}{' '}
                    · moderada/alta: {percent(w.after.nonLowFraction)}
                  </p>
                  <p className="text-sm">
                    Baixa {Math.round(w.after.lowSeconds / 60)} min · moderada{' '}
                    {Math.round(w.after.moderateSeconds / 60)} min · alta{' '}
                    {Math.round(w.after.highSeconds / 60)} min · sem estrutura{' '}
                    {w.after.unknownMinutes} min · repouso/transição {Math.round(w.after.restSeconds/60)} min · força {Math.round(w.after.strengthSeconds/60)} min. Distribuição planejada, com
                    aproximação Z1–2/Z3/Z4–5; não representa intensidade
                    realizada.
                  </p>
                  <ul className="list-disc pl-5 text-amber-300">
                    {w.warnings.map((v: string) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </article>
              ))}
              <ul className="space-y-3">
                {draft.payload.changes.map((c: any) => (
                  <li key={c.key} className="rounded-lg border p-3">
                    <button
                      className={button}
                      disabled={busy || c.paused}
                      onClick={() => edit(c)}
                    >
                      Editar esta proposta
                    </button>
                    <p className="font-medium">
                      {c.title} · {c.date} · {c.duration} min ·{' '}
                      {c.paused
                        ? 'Proposta de cancelamento'
                        : c.id
                          ? 'Ajuste'
                          : 'Nova sessão'}
                    </p>
                    <details>
                      <summary>Conferir os blocos</summary>
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {c.description}
                      </pre>
                    </details>
                    <button
                      className={button + ' mt-2'}
                      disabled={busy}
                      onClick={() =>
                        send('batch', {
                          ...envelope,
                          operation: 'discardChange',
                          ids: [c.key],
                        })
                      }
                    >
                      Retirar alteração do rascunho
                    </button>
                  </li>
                ))}
              </ul>
              <label className="block">
                Orientações ao atleta
                <textarea
                  className={input}
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </label>
              <button className={button} disabled={busy} onClick={()=>send('notes',{athleteId:data.athlete.id,draftId:draft.id,revision:draft.revision,instructions})}>Salvar orientações no rascunho</button>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                Revisei os blocos, o volume e os conflitos. Autorizo esta
                publicação.
              </label>
              <button
                className={primary}
                disabled={
                  busy ||
                  !ack ||
                  draft.profileConflict ||
                  !draft.payload.changes.length
                }
                onClick={() =>
                  send('publish', {
                    athleteId: data.athlete.id,
                    draftId: draft.id,
                    revision: draft.revision,
                    acknowledge: ack,
                    instructions,
                  })
                }
              >
                Publicar no calendário do atleta
              </button>
            </>
          ) : (
            <p>Crie, edite ou gere uma sessão para começar uma proposta.</p>
          )}
        </section>
      )}
      {view === 'historico' && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Histórico preservado</h2>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={button}
            >
              Abrir orientação no WhatsApp
            </a>
          )}
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const message = String(new FormData(f).get('message') || '');
              if (
                await send('message', { athleteId: data.athlete.id, message })
              )
                f.reset();
            }}
          >
            <label>
              Enviar orientação ao atleta
              <textarea
                className={input}
                required
                maxLength={4000}
                name="message"
                rows={3}
              />
            </label>
            <button className={button} disabled={busy}>
              Enviar dentro do app
            </button>
          </form>
          {data.publications.map((p: any) => (
            <article className="rounded-xl border bg-card p-4" key={p.id}>
              <h3>
                Publicado por {p.authorName} ·{' '}
                {new Date(p.createdAt).toLocaleString('pt-BR')}
              </h3>
              <p className="whitespace-pre-wrap">{p.instructions}</p>
              <ul>
                {p.changes.sessions.map((c: any) => (
                  <li key={c.key}>
                    {c.after.title} · {c.before ? 'Ajustado' : 'Novo'} ·{' '}
                    {c.after.date}
                  </li>
                ))}
              </ul>
            </article>
          ))}
          <h3 className="font-semibold">
            Últimas sessões realizadas (até 100)
          </h3>
          {data.history.map((w: any) => (
            <p key={w.id}>
              {String(w.date).slice(0, 10)} · {w.title} · previsto {w.duration}{' '}
              min · realizado {w.log?.actualDuration ?? '—'} min · PSE{' '}
              {w.log?.rpe ?? '—'} · fadiga {w.log?.fatigueScore ?? '—'} · dor{' '}
              {w.log?.painScore ?? '—'}{' '}
              <button className={button} onClick={() => edit(w, true)}>
                Duplicar como sessão futura
              </button>
            </p>
          ))}
          <h3 className="font-semibold">Auditoria recente</h3>
          {data.audits.map((a: any) => (
            <details key={a.id} className="rounded border p-3">
              <summary>
                {a.action.replaceAll('_', ' ')} ·{' '}
                {new Date(a.createdAt).toLocaleString('pt-BR')} · autor{' '}
                {a.actorId === data.athlete.id ? 'Atleta' : 'Coach'}
              </summary>
              <pre className="whitespace-pre-wrap break-all text-xs">
                {JSON.stringify(a.details, null, 2)}
              </pre>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}

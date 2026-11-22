'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CoachAlerts } from './coach-alerts';
export function CoachHub({ links }: { links: any[] }) {
  const router = useRouter(),
    [query, setQuery] = useState(''),
    [message, setMessage] = useState(''),
    [url, setUrl] = useState(''),
    [busy, setBusy] = useState(false);
  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setUrl('');
    try {
      const r = await fetch('/api/coach/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMessage(d.message);
      setUrl(d.invitationUrl || '');
      form.reset();
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function end(athleteId: string) {
    if (
      !confirm(
        'Encerrar o vínculo? Você perderá o acesso; conta e histórico do atleta serão preservados.',
      )
    )
      return;
    const r = await fetch('/api/coach/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId }),
    });
    const d = await r.json();
    setMessage(r.ok ? 'Vínculo encerrado; histórico preservado.' : d.error);
    router.refresh();
  }
  const shown = links.filter((l) =>
    (l.athlete.name + ' ' + l.athlete.email)
      .toLocaleLowerCase('pt-BR')
      .includes(query.toLocaleLowerCase('pt-BR')),
  );
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow text-primary">ÁREA EXCLUSIVA</p>
        <h1 className="text-3xl font-semibold">Painel do Coach</h1>
        <p className="text-muted-foreground">
          {links.filter((l) => l.status === 'active').length} atletas com
          vínculo ativo · propostas separadas do calendário publicado.
        </p>
      </header>
      <CoachAlerts />
      <section id="convite" className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-xl font-semibold">Cadastrar ou convidar atleta</h2>
        <form
          onSubmit={invite}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label>
            Nome
            <input
              className="mt-1 w-full rounded-lg border bg-background p-3"
              name="name"
              required
              maxLength={120}
            />
          </label>
          <label>
            E-mail
            <input
              className="mt-1 w-full rounded-lg border bg-background p-3"
              name="email"
              type="email"
              required
            />
          </label>
          <label>
            WhatsApp (opcional)
            <input
              className="mt-1 w-full rounded-lg border bg-background p-3"
              name="whatsapp"
              type="tel"
            />
          </label>
          <button
            disabled={busy}
            className="self-end min-h-12 rounded-lg bg-primary px-4 py-3 text-primary-foreground"
          >
            {busy ? 'Salvando…' : 'Cadastrar / convidar'}
          </button>
        </form>
        <p className="text-sm text-muted-foreground">
          Conta existente recebe um convite dentro do app e só libera acesso
          após aceitar. Conta nova recebe link privado para definir senha.
          Nenhuma conta é duplicada.
        </p>
        {url && (
          <label className="block text-sm">
            Link privado de primeiro acesso
            <input
              aria-label="Link de primeiro acesso"
              className="mt-1 w-full rounded border bg-background p-3"
              value={url}
              readOnly
              onFocus={(e) => e.target.select()}
            />
          </label>
        )}
      </section>
      {message && (
        <p role="status" className="rounded border p-3">
          {message}
        </p>
      )}
      <section id="alunos" className="space-y-4">
        <h2 className="text-xl font-semibold">Meus atletas</h2>
        <label className="block">
          Buscar por nome ou e-mail
          <input
            className="mt-1 w-full rounded-lg border bg-card p-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((l) => (
            <article
              key={l.id}
              className="rounded-xl border bg-card p-5 space-y-3"
            >
              <div>
                <h3 className="text-lg font-semibold break-words">
                  {l.athlete.name || 'Atleta'}
                </h3>
                <p className="text-sm text-muted-foreground break-all">
                  {l.athlete.email}
                </p>
              </div>
              {l.status === 'pending' ? (
                <p className="text-amber-300">
                  Convite pendente de aceite. Dados esportivos ainda
                  indisponíveis.
                </p>
              ) : (
                <>
                  <p>
                    Próxima prova:{' '}
                    {l.athlete.targetRaces?.[0]?.name || 'Não informada'}
                  </p>
                  <p>
                    Fase:{' '}
                    {l.athlete.trainingPlans?.[0]?.workouts?.[0]?.phase ||
                      'Sem plano'}
                  </p>
                  <ul className="text-sm text-muted-foreground">
                    {l.athlete.workouts?.slice(0, 3).map((w: any) => (
                      <li key={w.id}>
                        {String(w.date).slice(0, 10)} · {w.title} ·{' '}
                        {w.completed
                          ? 'Realizado'
                          : w.paused
                            ? 'Pausado'
                            : 'Planejado'}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                      href={'/coach/atletas/' + l.athlete.id}
                    >
                      Abrir ficha
                    </Link>
                    <button
                      className="rounded-lg border px-3 py-2"
                      onClick={() => end(l.athlete.id)}
                    >
                      Encerrar vínculo
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
        {shown.length === 0 && (
          <p>
            Nenhum atleta encontrado. Cadastre um novo aluno ou envie um
            convite.
          </p>
        )}
      </section>
    </div>
  );
}

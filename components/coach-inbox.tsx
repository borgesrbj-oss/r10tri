'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export function CoachInbox() {
  const [invites, setInvites] = useState<any[]>([]),
    [publications, setPublications] = useState<any[]>([]),
    [message, setMessage] = useState('');
  const router = useRouter();
  useEffect(() => {
    let active = true;
    Promise.all(
      ['/api/coach/invitations', '/api/coach/publications'].map((url) =>
        fetch(url, { cache: 'no-store' }).then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        }),
      ),
    )
      .then(([i, p]) => {
        if (active) {
          setInvites(i);
          setPublications(p);
        }
      })
      .catch(() => {
        if (active)
          setMessage(
            'Não foi possível consultar os avisos do coach. Atualize a página.',
          );
      });
    return () => {
      active = false;
    };
  }, []);
  async function respond(id: string, accept: boolean) {
    try {
      const r = await fetch('/api/coach/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accept }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setInvites((items) => items.filter((i) => i.id !== id));
      setMessage(
        accept
          ? 'Vínculo aceito. Este coach pode consultar seus dados esportivos e publicar treinos.'
          : 'Convite recusado.',
      );
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  if (!invites.length && !publications.length && !message) return null;
  return (
    <aside
      aria-label="Convites e publicações do coach"
      className="mb-6 space-y-3 rounded-xl border bg-card p-4"
    >
      {invites.map((i) => (
        <div key={i.id} className="space-y-2">
          <p>
            <strong>{i.coach.name || 'Coach'}</strong> convidou você para a
            assessoria. O aceite permite acesso à triagem, histórico e
            planejamento.
          </p>
          <div className="flex gap-3">
            <button
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              onClick={() => respond(i.id, true)}
            >
              Aceitar vínculo
            </button>
            <button
              className="rounded-lg border px-4 py-2"
              onClick={() => respond(i.id, false)}
            >
              Recusar
            </button>
          </div>
        </div>
      ))}
      {publications.length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold text-primary">
            Orientações e alterações publicadas pelo coach (
            {publications.length})
          </summary>
          <div className="max-h-96 overflow-y-auto space-y-4 pt-3">
            {publications.map((p) => (
              <article key={p.id} className="rounded-lg border p-3">
                <h2 className="font-semibold">
                  Publicado por {p.authorName} ·{' '}
                  {new Date(p.createdAt).toLocaleString('pt-BR')}
                </h2>
                <p className="whitespace-pre-wrap">
                  {p.instructions || 'Confira os blocos no calendário.'}
                </p>
                <ul className="mt-2 text-sm space-y-1">
                  {p.changes.sessions.map((c: any) => (
                    <li key={c.key}>
                      {c.after.title} · {c.after.date} ·{' '}
                      {c.after.paused
                        ? 'Cancelado/pausado'
                        : c.before
                          ? 'Ajustado'
                          : 'Novo'}
                      {c.before
                        ? ` · antes: ${c.before.duration} min em ${String(c.before.date).slice(0, 10)}; agora: ${c.after.duration} min`
                        : ''}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </details>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </aside>
  );
}

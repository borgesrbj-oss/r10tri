import { swimMediaLicenseUrl, type SwimMediaReference } from '@/lib/swim-media-catalog';

export function SwimMediaReferences({ references }: { references: readonly SwimMediaReference[] }) {
  if (!references.length) return null;
  return (
    <details className="rounded-lg border bg-muted/20 p-3 text-sm">
      <summary className="cursor-pointer font-medium">Vídeos de técnica de natação</summary>
      <ul className="mt-3 space-y-3">
        {references.map(reference => (
          <li key={reference.id}>
            <a className="font-medium text-primary underline" href={reference.pageUrl} target="_blank" rel="noopener noreferrer">
              {reference.title}
              <span className="sr-only"> — abre o vídeo em nova aba</span>
            </a>
            <p>{reference.observation}</p>
            <p className="text-xs text-muted-foreground">
              {reference.credit} · <a href={swimMediaLicenseUrl(reference)} target="_blank" rel="noopener noreferrer" className="underline">{reference.license}</a>
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

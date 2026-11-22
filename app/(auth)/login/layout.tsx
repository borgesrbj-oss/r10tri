import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Entrar | Gotri - Coach de Triathlon com IA' },
  description:
    'Acesse sua conta Gotri para ver seus planos de treino de natação, ciclismo e corrida, acompanhar sua evolução e exportar treinos para Garmin, Strava e MyWhoosh.',
  alternates: { canonical: '/login' },
  openGraph: {
    title: 'Entrar | Gotri',
    description:
      'Acesse sua conta Gotri e continue sua evolução no triathlon com planos personalizados por IA.',
    url: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

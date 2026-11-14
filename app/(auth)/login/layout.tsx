import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Entrar | R10 TRI - Coach de Triathlon com IA' },
  description:
    'Acesse sua conta R10 TRI para ver seus planos de treino de natação, ciclismo e corrida, acompanhar sua evolução e exportar treinos para Garmin, Strava e MyWhoosh.',
  alternates: { canonical: '/login' },
  openGraph: {
    title: 'Entrar | R10 TRI',
    description:
      'Acesse sua conta R10 TRI e continue sua evolução no triathlon com planos personalizados por IA.',
    url: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

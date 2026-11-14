import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Criar conta | R10 TRI - Planos de Triathlon com IA' },
  description:
    'Crie sua conta gratuita no R10 TRI e receba planos de treino de triathlon personalizados por inteligência artificial para natação, ciclismo e corrida.',
  alternates: { canonical: '/signup' },
  openGraph: {
    title: 'Criar conta | R10 TRI',
    description:
      'Comece agora com planos de triathlon personalizados por IA. Nade. Pedale. Corra. Evolua.',
    url: '/signup',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

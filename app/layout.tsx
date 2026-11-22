import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { SessionProvider } from 'next-auth/react'
import type { Viewport } from 'next'
import { PwaManager } from '@/components/pwa-manager'

export const dynamic = 'force-dynamic';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#101113',
  colorScheme: 'light dark',
}

export const metadata = {
  title: {
    default: 'Gotri - Nade. Pedale. Corra. Evolua.',
    template: '%s | Gotri',
  },
  description:
    'Gotri organiza treinos de corrida, ciclismo e natação a partir da sua rotina, com sessões estruturadas, acompanhamento e exportação de arquivos compatíveis.',
  applicationName: 'Gotri',
  keywords: [
    'triathlon',
    'treino de triathlon',
    'coach de triathlon',
    'plano de natação',
    'plano de ciclismo',
    'plano de corrida',
    'treinamento personalizado',
    'inteligência artificial',
    'Ironman',
    'meia distância',
    'Garmin',
    'Strava',
    'MyWhoosh',
  ],
  authors: [{ name: 'Gotri' }],
  creator: 'Gotri',
  publisher: 'Gotri',
  category: 'sports',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Gotri',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Gotri',
    title: 'Gotri - Nade. Pedale. Corra. Evolua.',
    description:
      'Seu coach pessoal de triathlon com IA. Planos personalizados de natação, ciclismo e corrida, com periodização avançada e acompanhamento de evolução.',
    images: [
      {
        url: '/brand/gotri-laranja.png',
        width: 1902,
        height: 827,
        alt: 'Gotri - Coach de triathlon com inteligência artificial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gotri - Nade. Pedale. Corra. Evolua.',
    description:
      'Seu coach pessoal de triathlon com IA. Planos personalizados de natação, ciclismo e corrida.',
    images: ['/brand/gotri-laranja.png'],
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" storageKey="r10-triatlo-theme" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
            <ChunkLoadErrorHandler />
            <PwaManager />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

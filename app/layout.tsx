import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { SessionProvider } from 'next-auth/react'
import Script from 'next/script'

export const dynamic = 'force-dynamic';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata = {
  title: {
    default: 'R10 TRI - Nade. Pedale. Corra. Evolua.',
    template: '%s | R10 TRI',
  },
  description:
    'R10 TRI é seu coach pessoal de triathlon com inteligência artificial. Planos de treino personalizados de natação, ciclismo e corrida, com periodização avançada, acompanhamento de evolução e exportação para Garmin, Strava e MyWhoosh.',
  applicationName: 'R10 TRI',
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
  authors: [{ name: 'R10 TRI' }],
  creator: 'R10 TRI',
  publisher: 'R10 TRI',
  category: 'sports',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'R10 TRI',
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
    siteName: 'R10 TRI',
    title: 'R10 TRI - Nade. Pedale. Corra. Evolua.',
    description:
      'Seu coach pessoal de triathlon com IA. Planos personalizados de natação, ciclismo e corrida, com periodização avançada e acompanhamento de evolução.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'R10 TRI - Coach de triathlon com inteligência artificial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'R10 TRI - Nade. Pedale. Corra. Evolua.',
    description:
      'Seu coach pessoal de triathlon com IA. Planos personalizados de natação, ciclismo e corrida.',
    images: ['/og-image.png'],
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1A8A7D" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Script src="https://apps.abacus.ai/chatllm/appllm-lib.js" strategy="afterInteractive" />
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
            {children}
            <Toaster />
            <ChunkLoadErrorHandler />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

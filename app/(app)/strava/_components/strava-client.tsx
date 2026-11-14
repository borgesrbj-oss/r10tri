'use client';
import { Timer, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/animate';

export function StravaClient() {

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><Timer className="h-7 w-7 text-primary" /> Integração Strava</h1>
          <p className="text-muted-foreground">Conecte-se ao Strava para importar suas atividades</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Modo Simulação</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                As credenciais do Strava (STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET) ainda não foram configuradas. 
                O app funciona normalmente sem o Strava — quando quiser ativar, configure as variáveis de ambiente nas configurações.
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>Como Conectar ao Strava</CardTitle>
            <CardDescription>Siga os passos abaixo para ativar a integração</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">1</Badge>
                <p className="text-sm">Acesse <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary underline">strava.com/settings/api</a> e crie um aplicativo</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">2</Badge>
                <p className="text-sm">Copie o Client ID e Client Secret do seu aplicativo Strava</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">3</Badge>
                <p className="text-sm">Configure as variáveis de ambiente STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET nas configurações do app</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">4</Badge>
                <p className="text-sm">Recarregue a página e clique em &quot;Conectar ao Strava&quot;</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades com Strava</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">✓ Importar atividades realizadas automaticamente</li>
              <li className="flex items-center gap-2">✓ Correlacionar atividades com treinos da planilha</li>
              <li className="flex items-center gap-2">✓ Visualizar métricas de performance (pace, distância, tempo)</li>
              <li className="flex items-center gap-2">✓ Sincronização automática de dados</li>
            </ul>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

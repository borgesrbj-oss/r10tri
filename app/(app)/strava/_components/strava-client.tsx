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
          <p className="text-muted-foreground">Consulte o estado e os requisitos desta integração.</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Integração ainda não disponível</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Os módulos de autorização e sincronização não estão presentes nesta versão. Apenas preencher credenciais não ativa a conexão. O aplicativo funciona sem Strava; nenhuma atividade é importada por esta tela.
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>O que falta para disponibilizar</CardTitle>
            <CardDescription>Requisitos para uma implementação futura, sem conexão simulada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">1</Badge>
                <p className="text-sm">Acesse <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary underline">strava.com/settings/api</a> e crie um aplicativo</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">2</Badge>
                <p className="text-sm">Validar os módulos de OAuth, retorno autorizado, revogação e sincronização conforme a documentação oficial.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">3</Badge>
                <p className="text-sm">Configurar credenciais somente no painel privado da hospedagem e consentimento por atleta; nunca enviar chaves pelo chat.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0 mt-0.5">4</Badge>
                <p className="text-sm">Testar permissões, limites da API e dados reais autorizados antes de liberar um botão de conexão.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle>Possibilidades após implementação e validação</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Importação de atividades autorizadas e correlação com o calendário.</li>
              <li>Métricas disponíveis conforme escopos e regras do provedor.</li>
              <li>Esses recursos não estão operacionais nesta versão. Use o registro manual e as exportações da planilha.</li>
            </ul>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

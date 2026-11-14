'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Play, CheckCircle2, AlertTriangle, Lightbulb, ExternalLink, ArrowLeft } from 'lucide-react';

/* ─── guide data ─── */
interface Step {
  title: string;
  detail: string;
  tip?: string;
  warning?: string;
}

interface Guide {
  id: string;
  category: 'platform' | 'test' | 'app';
  title: string;
  subtitle: string;
  image: string;
  videoUrl?: string;
  duration: string;
  steps: Step[];
  links?: { label: string; url: string }[];
}

const guides: Guide[] = [
  {
    id: 'instalar-app',
    category: 'app',
    title: 'Instalar o App (APK Android)',
    subtitle: 'Tenha o TriCoach na tela inicial do seu celular',
    image: 'https://cdn.abacus.ai/images/3e041c3a-5467-432b-a18a-7f63ba559332.png',
    duration: '3 min',
    steps: [
      {
        title: '1. Baixe o arquivo APK',
        detail: 'No navegador do seu celular Android, acesse o link de download do TriCoach fornecido. Toque no arquivo .apk para iniciar o download. Aguarde a conclusão (aparece na barra de notificações).',
        tip: 'Use o Chrome ou o navegador padrão do Android. O arquivo fica salvo na pasta Downloads.',
      },
      {
        title: '2. Permita instalação de fontes desconhecidas',
        detail: 'Ao abrir o APK, o Android pode avisar que a instalação de apps de fontes desconhecidas está bloqueada. Toque em "Configurações" e ative "Permitir desta fonte" para o navegador/gerenciador de arquivos.',
        warning: 'Essa permissão é necessária porque o app é instalado fora da Play Store. É seguro — você está instalando diretamente do TriCoach.',
      },
      {
        title: '3. Instale o aplicativo',
        detail: 'Volte e toque em "Instalar". Em poucos segundos o TriCoach será instalado. Toque em "Abrir" ao finalizar, ou localize o ícone na gaveta de apps.',
      },
      {
        title: '4. Faça login e comece',
        detail: 'Abra o app, entre com seu email e senha do TriCoach. Pronto! Você terá acesso ao painel, plano de treino, calendário e tudo mais direto do celular.',
        tip: 'Alternativa sem APK: abra o TriCoach no navegador, toque no menu (⋮) e escolha "Adicionar à tela inicial" para criar um atalho que funciona como app.',
      },
    ],
  },
  {
    id: 'strava',
    category: 'platform',
    title: 'Conectar ao Strava',
    subtitle: 'Sincronize seus treinos automaticamente',
    image: 'https://cdn.abacus.ai/images/d1e291f7-c135-46b9-b93a-4f74334f3665.png',
    videoUrl: 'https://cdn.abacus.ai/videos/bc33af80-e430-404c-83c4-171710e0018b.mp4',
    duration: '5 min',
    steps: [
      {
        title: '1. Crie sua conta no Strava',
        detail: 'Acesse strava.com ou baixe o app (iOS/Android). Cadastre-se com email ou Google. Complete seu perfil com peso e modalidades.',
        tip: 'Use o mesmo email que você usa no TriCoach para facilitar a identificação.',
      },
      {
        title: '2. Configure a privacidade',
        detail: 'Vá em Configurações → Privacidade. Defina quem vê suas atividades. Para sincronizar com apps externos, permita "Acesso de terceiros".',
      },
      {
        title: '3. Conecte ao TriCoach',
        detail: 'No TriCoach, acesse a aba Strava no menu lateral. Clique em "Conectar Strava". Autorize o TriCoach a acessar seus dados de atividades.',
        tip: 'A conexão OAuth é segura — o TriCoach nunca vê sua senha do Strava.',
      },
      {
        title: '4. Sincronize seus dispositivos',
        detail: 'No Strava, vá em Configurações → Conexões. Conecte seu Garmin, Apple Watch, Wahoo ou outro dispositivo. Os treinos sincronizam automaticamente: Dispositivo → Strava → TriCoach.',
        tip: 'A sincronização normalmente leva de 1 a 5 minutos após encerrar o treino no relógio.',
      },
      {
        title: '5. Verifique a sincronização',
        detail: 'Faça um treino curto (pode ser 5 min de caminhada). Aguarde aparecer no Strava. Verifique se apareceu no TriCoach em "Calendário".',
        warning: 'Se não sincronizar em 10 minutos, desconecte e reconecte pelo menu Strava do TriCoach.',
      },
    ],
    links: [
      { label: 'Site oficial do Strava', url: 'https://www.strava.com' },
      { label: 'App iOS', url: 'https://apps.apple.com/app/strava/id426826309' },
      { label: 'App Android', url: 'https://play.google.com/store/apps/details?id=com.strava' },
    ],
  },
  {
    id: 'garmin',
    category: 'platform',
    title: 'Conectar ao Garmin Connect',
    subtitle: 'Envie treinos direto para seu relógio Garmin',
    image: 'https://cdn.abacus.ai/images/be104d38-397c-4af9-8bca-951e1e060345.png',
    videoUrl: 'https://cdn.abacus.ai/videos/49e196e2-7433-48fa-8a62-686b952194f8.mp4',
    duration: '8 min',
    steps: [
      {
        title: '1. Crie sua conta no Garmin Connect',
        detail: 'Acesse connect.garmin.com ou baixe o app Garmin Connect (iOS/Android). Crie sua conta e emparelhe seu dispositivo Garmin seguindo as instruções do app.',
      },
      {
        title: '2. Emparelhe seu relógio',
        detail: 'Abra o Garmin Connect → Dispositivos → Adicionar dispositivo. Ligue Bluetooth no celular. Siga os passos na tela para emparelhar (o relógio exibirá um código).',
        warning: 'Mantenha o relógio próximo ao celular durante todo o emparelhamento. Pode levar até 3 minutos.',
      },
      {
        title: '3. Conecte o Garmin ao Strava',
        detail: 'No Garmin Connect → Configurações → Apps conectados → Strava. Autorize a conexão. Isso faz seus treinos do Garmin irem automaticamente para o Strava e depois para o TriCoach.',
        tip: 'Essa é a maneira mais confiável: Garmin → Strava → TriCoach. Evite conectar diretamente ao TriCoach.',
      },
      {
        title: '4. Envie treinos para o relógio',
        detail: 'Exporte o treino do TriCoach em formato .FIT ou .ZWO. No Garmin Connect web, vá em Treinamento → Treinos → Importar. Sincronize o relógio para receber o treino.',
        tip: 'No formato .FIT, o Garmin mostra cada intervalo com alertas de zona. Para ciclismo indoor, use .ZWO no MyWhoosh.',
      },
      {
        title: '5. Execute o treino no relógio',
        detail: 'No relógio: Menu → Treinamento → Meus Treinos → selecione o treino importado → Iniciar. O relógio vai guiar cada etapa com vibrações e alertas de zona.',
      },
    ],
    links: [
      { label: 'Garmin Connect Web', url: 'https://connect.garmin.com' },
      { label: 'App iOS', url: 'https://apps.apple.com/app/garmin-connect/id583446403' },
      { label: 'App Android', url: 'https://play.google.com/store/apps/details?id=com.garmin.android.apps.connectmobile' },
    ],
  },
  {
    id: 'mywhoosh',
    category: 'platform',
    title: 'Conectar ao MyWhoosh',
    subtitle: 'Treine ciclismo indoor com seus planos',
    image: 'https://cdn.abacus.ai/images/c378edcc-f2a6-49d8-b336-a09e69593126.png',
    videoUrl: 'https://cdn.abacus.ai/videos/81bff6ec-52be-44a9-a2a2-94a5eae9fe7f.mp4',
    duration: '6 min',
    steps: [
      {
        title: '1. Baixe o MyWhoosh',
        detail: 'Acesse mywhoosh.com e baixe o app para Windows, Mac, iOS ou Android. Crie sua conta gratuita. O MyWhoosh é 100% gratuito (diferente do Zwift).',
        tip: 'Para melhor experiência, use no computador com monitor grande. No celular funciona mas a tela é pequena.',
      },
      {
        title: '2. Configure seu rolo/trainer',
        detail: 'Conecte seu smart trainer (ex: Wahoo Kickr, Tacx, Elite) via Bluetooth ou ANT+. No MyWhoosh, vá em Configurações → Dispositivos → Procurar. Selecione seu trainer na lista.',
        warning: 'Se usar ANT+, você precisará de um adaptador USB ANT+ no computador. Bluetooth funciona direto.',
      },
      {
        title: '3. Importe o treino .ZWO',
        detail: 'No TriCoach, exporte o treino de ciclismo em formato .ZWO. No MyWhoosh, vá em Treinos → Treinos Personalizados → Importar ZWO. Selecione o arquivo exportado.',
        tip: 'O formato .ZWO é compatível com MyWhoosh, Zwift e TrainerRoad. Exporte uma vez, use em qualquer plataforma.',
      },
      {
        title: '4. Inicie o treino estruturado',
        detail: 'Selecione o treino importado na lista. Escolha uma rota (apenas visual, não afeta a resistência no modo ERG). Clique em "Pedalar". O MyWhoosh ajustará automaticamente a resistência do trainer conforme cada intervalo.',
      },
      {
        title: '5. Sincronize os resultados',
        detail: 'Ao finalizar, o MyWhoosh pode enviar automaticamente para o Strava. Configure em Configurações → Conexões → Strava. O treino aparecerá no TriCoach via Strava.',
        tip: 'Ative a sincronização automática para não precisar exportar manualmente o arquivo .FIT após cada treino.',
      },
    ],
    links: [
      { label: 'Site MyWhoosh', url: 'https://www.mywhoosh.com' },
      { label: 'Download Windows/Mac', url: 'https://www.mywhoosh.com/download' },
    ],
  },
  {
    id: 'test-css',
    category: 'test',
    title: 'Teste de CSS (Natação)',
    subtitle: 'Critical Swim Speed — descubra suas zonas de nado',
    image: 'https://cdn.abacus.ai/images/580b4e64-d3af-4947-ac26-5c3d16de4d5d.png',
    videoUrl: 'https://cdn.abacus.ai/videos/e464f023-cf38-47c3-9852-6a74cc4c2414.mp4',
    duration: '45 min total',
    steps: [
      {
        title: '1. Preparação (dia anterior)',
        detail: 'Descanse bem na véspera. Evite treinos intensos 48h antes. Hidrate-se. Leve óculos, touca e cronômetro (pode usar relógio Garmin na piscina).',
        tip: 'Faça o teste em piscina de 25m ou 50m. Em piscina de 25m, haverá mais viradas, o que pode afetar levemente o resultado.',
      },
      {
        title: '2. Aquecimento (15 min)',
        detail: '400m nado livre solto (ritmo bem confortável). 4x50m com 15s de descanso (progressivo: cada 50m um pouco mais rápido). 200m nado completo variando estilos. Descanse 2 minutos.',
      },
      {
        title: '3. Teste 1: Nado 400m',
        detail: 'Nade 400m no ritmo mais rápido que conseguir manter de forma constante. NÃO faça sprint — imagine que é uma prova de 400m. Anote o tempo exato (ex: 7:30).',
        warning: 'Erro comum: sair muito rápido nos primeiros 100m e "morrer" no final. Mantenha ritmo constante!',
      },
      {
        title: '4. Recuperação (5-10 min)',
        detail: 'Nade 200m bem solto. Alongue os ombros dentro da água. Beba água. Descanse até se sentir recuperado.',
      },
      {
        title: '5. Teste 2: Nado 200m',
        detail: 'Nade 200m o mais rápido possível com ritmo sustentável. Isso deve ser mais rápido que os 400m. Anote o tempo exato (ex: 3:20).',
      },
      {
        title: '6. Registre no TriCoach',
        detail: 'Vá em Plano → Questionário → Etapa de Natação. Insira os tempos de 400m e 200m. O TriCoach calcula automaticamente seu CSS (pace por 100m) e as zonas de treino.',
        tip: 'CSS = (400m - 200m) / 2 em ritmo por 100m. Ex: se fez 7:30 (450s) nos 400m e 3:20 (200s) nos 200m: CSS = (450-200)/2 = 125s por 100m = 2:05/100m.',
      },
    ],
  },
  {
    id: 'test-ftp',
    category: 'test',
    title: 'Teste de FTP (Ciclismo)',
    subtitle: 'Functional Threshold Power — suas zonas de bike',
    image: 'https://cdn.abacus.ai/images/4a203580-6709-4d8b-96ba-3766ee0269c2.png',
    videoUrl: 'https://cdn.abacus.ai/videos/e222dfd3-6bef-48a8-97da-d97f0ecbf020.mp4',
    duration: '60 min total',
    steps: [
      {
        title: '1. Preparação',
        detail: 'Descanse 48h de treinos intensos. Calibre seu medidor de potência ou smart trainer. Tenha ventilador, toalha e garrafa de água. Carregue seu Garmin/relógio.',
        tip: 'O teste pode ser feito no rolo (trainer) ou na rua. No trainer é mais controlado e repetível.',
      },
      {
        title: '2. Aquecimento (20 min)',
        detail: '10min pedalando leve (Z1, RPE 2-3). 3x1min com cadência alta (100+ rpm) em marcha leve, 1min fácil entre cada. 5min moderado aumentando gradualmente.',
      },
      {
        title: '3. Blow-out: 5 min ALL OUT',
        detail: 'Pedalar 5 minutos no máximo esforço. Isso serve para "esvaziar" suas reservas anaeróbicas. O resultado dos 5min NÃO é usado no cálculo — é apenas preparação.',
        warning: 'Esses 5 minutos vão doer. É esperado. Não pule esta etapa ou seu resultado de 20min será artificialmente alto.',
      },
      {
        title: '4. Recuperação (10 min)',
        detail: 'Pedalar muito leve. Beba água. A frequência cardíaca deve voltar a ficar confortável antes do teste principal.',
      },
      {
        title: '5. TESTE: 20 minutos máximo sustentável',
        detail: 'Pedalar 20 minutos no máximo esforço que você consegue MANTER. O esforço deve ser constante — sem sair correndo e morrer no final. Anote a potência média (watts) dos 20 min.',
        tip: 'Estratégia: comece conservador nos primeiros 5min. Se sentir que pode dar mais, aumente gradualmente a partir do min 10.',
      },
      {
        title: '6. Volta à calma (10 min)',
        detail: 'Pedalar bem leve. Alongar na bike. Deixar a FC voltar ao normal.',
      },
      {
        title: '7. Registre no TriCoach',
        detail: 'Vá em Plano → Questionário → Etapa de Ciclismo. Insira a potência média dos 20min. O TriCoach calcula FTP = potência média × 0.95 e define suas zonas.',
        tip: 'Exemplo: se sua média nos 20min foi 200W, seu FTP estimado = 200 × 0.95 = 190W.',
      },
    ],
  },
  {
    id: 'test-run',
    category: 'test',
    title: 'Teste de Limiar (Corrida)',
    subtitle: 'Descubra seu pace de limiar para treinar corrida',
    image: 'https://cdn.abacus.ai/images/d3df9c9f-261d-4cb1-b376-399b5540c366.png',
    videoUrl: 'https://cdn.abacus.ai/videos/c514ab60-574d-41c0-ba81-e8be613e5675.mp4',
    duration: '40 min total',
    steps: [
      {
        title: '1. Preparação',
        detail: 'Escolha uma pista de atletismo ou percurso plano e medido. Descanse 48h de treinos intensos. Leve relógio GPS ou Garmin. Use tênis de corrida que já está acostumado.',
        tip: 'Pista de atletismo é ideal: superfície plana, distância exata (400m por volta). Se usar rua, escolha trecho plano.',
      },
      {
        title: '2. Aquecimento (15 min)',
        detail: '10min trote bem leve. 4x100m progressivos (cada um mais rápido, último quase em sprint). 3min trote leve.',
      },
      {
        title: '3. TESTE: 3km máximo sustentável',
        detail: 'Corra 3km o mais rápido que conseguir manter ritmo constante. Não é sprint de 100m — é o máximo que você aguenta por ~10-20 minutos. Anote o tempo total.',
        warning: 'Erro comum: sair muito rápido no primeiro km. Mantenha-se controlado! O segundo km deve ter pace similar ao primeiro.',
      },
      {
        title: '4. Volta à calma (10 min)',
        detail: 'Trote bem leve por 5-10min. Alonge panturrilhas, quadríceps e isquiotibiais. Hidrate-se.',
      },
      {
        title: '5. Registre no TriCoach',
        detail: 'Vá em Plano → Questionário → Etapa de Corrida. Insira o tempo total dos 3km. O TriCoach calcula seu pace de limiar e define zonas de treino.',
        tip: 'Exemplo: 3km em 15:00 = pace de 5:00/km. Seu limiar estimado fica em torno de 5:15-5:30/km (ajustado para distância maior).',
      },
    ],
  },
];

/* ─── components ─── */
export function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* timeline line */}
      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border last:hidden" />
      {/* number */}
      <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {index + 1}
      </div>
      <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
      <p className="text-sm text-muted-foreground mb-2">{step.detail}</p>
      {step.tip && (
        <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/10 p-2.5 text-xs mb-2">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>{step.tip}</span>
        </div>
      )}
      {step.warning && (
        <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{step.warning}</span>
        </div>
      )}
    </div>
  );
}

function GuideCard({ guide, onSelect }: { guide: Guide; onSelect: () => void }) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group" onClick={onSelect}>
      <div className="relative aspect-video bg-muted">
        <Image src={guide.image} alt={guide.title} fill className="object-cover" />
        {guide.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-full bg-white/90 p-3">
              <Play className="h-6 w-6 text-primary fill-primary" />
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="secondary" className="text-[10px]">
            {guide.category === 'platform' ? 'Conexão' : guide.category === 'app' ? 'Aplicativo' : 'Teste Físico'}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{guide.duration}</span>
        </div>
        <h3 className="font-semibold text-sm mt-1">{guide.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{guide.subtitle}</p>
      </CardContent>
    </Card>
  );
}

function GuideDetail({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleComplete = (i: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const progress = guide.steps.length > 0 ? Math.round((completedSteps.size / guide.steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar aos guias
      </Button>

      <div className="relative aspect-video max-w-2xl rounded-xl overflow-hidden bg-muted mx-auto">
        {guide.videoUrl ? (
          <video controls className="w-full h-full object-cover" poster={guide.image}>
            <source src={guide.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <Image src={guide.image} alt={guide.title} fill className="object-cover" />
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <Badge variant="secondary">
            {guide.category === 'platform' ? 'Conexão' : guide.category === 'app' ? 'Aplicativo' : 'Teste Físico'}
          </Badge>
          <span className="text-xs text-muted-foreground">{guide.duration}</span>
        </div>
        <h2 className="text-2xl font-bold mt-2">{guide.title}</h2>
        <p className="text-muted-foreground">{guide.subtitle}</p>
      </div>

      {/* progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{completedSteps.size}/{guide.steps.length} etapas</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* steps */}
      <div className="space-y-2">
        {guide.steps.map((step, i) => (
          <Card key={i} className={completedSteps.has(i) ? 'border-primary/30 bg-primary/5' : ''}>
            <div className="flex items-center gap-3 p-4">
              <button
                type="button"
                aria-label={`${completedSteps.has(i) ? 'Desmarcar' : 'Concluir'} ${step.title}`}
                aria-pressed={completedSteps.has(i)}
                onClick={() => toggleComplete(i)}
                className="shrink-0"
              >
                <CheckCircle2 className={`h-5 w-5 transition-colors ${
                  completedSteps.has(i) ? 'text-primary fill-primary/20' : 'text-muted-foreground/40'
                }`} />
              </button>
              <button
                type="button"
                className="flex flex-1 items-center gap-3 text-left"
                aria-expanded={openStep === i}
                onClick={() => setOpenStep(openStep === i ? null : i)}
              >
              <span className={`flex-1 font-medium text-sm ${completedSteps.has(i) ? 'line-through text-muted-foreground' : ''}`}>
                {step.title}
              </span>
              {openStep === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
            {openStep === i && (
              <CardContent className="pt-0 pb-4 px-4 pl-12">
                <p className="text-sm text-muted-foreground mb-3">{step.detail}</p>
                {step.tip && (
                  <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/10 p-2.5 text-xs mb-2">
                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{step.tip}</span>
                  </div>
                )}
                {step.warning && (
                  <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{step.warning}</span>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* links */}
      {guide.links && guide.links.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Links Úteis</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {guide.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {link.label}
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── main ─── */
export function GuiasClient() {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [filter, setFilter] = useState<'all' | 'platform' | 'test' | 'app'>('all');

  const filtered = filter === 'all' ? guides : guides.filter((g) => g.category === filter);

  if (selectedGuide) {
    return (
      <div className="mx-auto max-w-3xl py-6 px-4">
        <GuideDetail guide={selectedGuide} onBack={() => setSelectedGuide(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guias & Tutoriais</h1>
        <p className="text-muted-foreground">Aprenda a conectar seus dispositivos e fazer os testes físicos</p>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          Todos
        </Button>
        <Button variant={filter === 'app' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('app')}>
          Aplicativo
        </Button>
        <Button variant={filter === 'platform' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('platform')}>
          Conexões
        </Button>
        <Button variant={filter === 'test' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('test')}>
          Testes Físicos
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((guide) => (
          <GuideCard key={guide.id} guide={guide} onSelect={() => setSelectedGuide(guide)} />
        ))}
      </div>
    </div>
  );
}

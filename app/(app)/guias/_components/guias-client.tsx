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
  "id": "instalar-app",
  "category": "app",
  "title": "Instalar o app na tela inicial (PWA)",
  "subtitle": "R10 TRI no Android e no iPhone, sem APK",
  "image": "https://cdn.abacus.ai/images/3e041c3a-5467-432b-a18a-7f63ba559332.png",
  "duration": "3 min",
  "steps": [
    {
      "title": "1. Abra o endereço oficial",
      "detail": "Acesse o R10 TRI pelo navegador usando HTTPS. Não há APK oficial distribuído por este projeto."
    },
    {
      "title": "2. Android com Chrome",
      "detail": "No menu do navegador, procure Instalar aplicativo ou Adicionar à tela inicial. O texto depende da versão. Também pode aparecer o botão de instalação no rodapé do app."
    },
    {
      "title": "3. iPhone com Safari",
      "detail": "Abra Compartilhar e procure Adicionar à Tela de Início. Reabra pelo ícone e faça login normalmente. A disponibilidade depende da versão do iOS."
    },
    {
      "title": "4. Confira a conexão",
      "detail": "A instalação mantém a experiência web. Consultar e salvar dados pessoais exige internet; o aviso offline não é uma cópia dos seus dados de saúde."
    }
  ]
},
{
  "id": "strava",
  "category": "platform",
  "title": "Strava: integração pendente",
  "subtitle": "Requisitos e situação real, sem conexão simulada",
  "image": "https://cdn.abacus.ai/images/d1e291f7-c135-46b9-b93a-4f74334f3665.png",
  "duration": "2 min",
  "steps": [
    {
      "title": "1. Situação atual",
      "detail": "O código desta versão não contém os módulos de OAuth e sincronização Strava. Cadastrar uma chave não ativa a função."
    },
    {
      "title": "2. Uso disponível",
      "detail": "Registre suas atividades pelo calendário e utilize as exportações da planilha. Nenhuma atividade do Strava entra automaticamente no R10 TRI."
    },
    {
      "title": "3. Implementação futura",
      "detail": "Depende de aplicação autorizada, consentimento, escopos e módulos revisados. Não envie senha ou segredo do Strava por mensagens."
    }
  ],
  "links": [
    {
      "label": "Documentação oficial de autenticação",
      "url": "https://developers.strava.com/docs/authentication/"
    }
  ]
},
{
  "id": "garmin",
  "category": "platform",
  "title": "Garmin: exportar treino estruturado",
  "subtitle": "Arquivo FIT ou TCX; sem sincronização direta de conta",
  "image": "https://cdn.abacus.ai/images/be104d38-397c-4af9-8bca-951e1e060345.png",
  "duration": "5 min",
  "steps": [
    {
      "title": "1. Confira os blocos",
      "detail": "No plano ou na planilha, revise duração, alvos e modalidade antes de baixar. Treinos legados sem estrutura podem não ter exportação estruturada."
    },
    {
      "title": "2. Baixe FIT ou TCX",
      "detail": "Use as opções oferecidas pela planilha. Arquivo de treino estruturado difere de arquivo de atividade concluída; importar atividades no Connect não garante importar prescrições."
    },
    {
      "title": "3. Consulte o modelo do aparelho",
      "detail": "O método de transferência e os tipos de treino dependem do relógio, firmware e modalidade. Siga o suporte oficial do modelo e valide uma sessão curta antes de usar em prova."
    },
    {
      "title": "4. Sincronização automática",
      "detail": "Não há conexão Garmin direta nesta versão. A API de treino exige acesso autorizado ao programa do fornecedor; uma conexão Garmin–Strava não envia dados a este app."
    }
  ],
  "links": [
    {
      "label": "Garmin Training API",
      "url": "https://developer.garmin.com/gc-developer-program/enterprise/training-api/"
    },
    {
      "label": "Suporte Garmin",
      "url": "https://support.garmin.com/"
    }
  ]
},
{
  "id": "mywhoosh",
  "category": "platform",
  "title": "MyWhoosh: exportar ciclismo indoor",
  "subtitle": "Intercâmbio por arquivo, com compatibilidade a conferir",
  "image": "https://cdn.abacus.ai/images/c378edcc-f2a6-49d8-b336-a09e69593126.png",
  "duration": "5 min",
  "steps": [
    {
      "title": "1. Confira FTP e equipamento",
      "detail": "Alvos de potência exigem FTP e equipamento compatível. Percepção de esforço não é convertida em watts inventados."
    },
    {
      "title": "2. Exporte na planilha",
      "detail": "Baixe o arquivo de ciclismo no formato oferecido. Confira no portal e na documentação atuais do destino quais formatos podem ser importados na sua versão."
    },
    {
      "title": "3. Valide o treino importado",
      "detail": "Compare número de blocos, duração e intensidade antes de iniciar. ZWO, MRC e ERG não têm suporte idêntico em todas as plataformas; não há garantia de intercâmbio universal."
    },
    {
      "title": "4. Registre o resultado",
      "detail": "O R10 TRI não recebe automaticamente atividades do MyWhoosh, Zwift ou Strava. Registre a conclusão e o esforço no calendário."
    }
  ],
  "links": [
    {
      "label": "MyWhoosh Workout Builder",
      "url": "https://workout.mywhoosh.com/"
    },
    {
      "label": "Documentação do construtor",
      "url": "https://www.mywhoosh.com/everything-you-need-to-know-about-the-new-mywhoosh-workout-builder/"
    }
  ]
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
    <Card role="button" tabIndex={0} aria-label={`Abrir guia: ${guide.title}`} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onSelect} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect();}}}>
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
        <h1 className="text-2xl font-bold">Guias & Tutoriais</h1><p className="text-sm text-muted-foreground">Orientações do app revisadas em novembro de 2026. Testes físicos são opcionais e exigem habilidade, ambiente seguro e orientação; iniciantes ou pessoas com dor podem deixar limiares em branco. Vídeos ilustrativos não substituem acompanhamento nem comprovam integrações.</p>
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

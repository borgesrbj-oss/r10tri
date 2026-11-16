export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { buildFit, buildTcx, buildZwo, buildTxt, slugify, WorkoutExportError } from '@/lib/export-builders';
import { paceToSec } from '@/lib/plan-engine';
import { bikeThreshold } from '@/lib/training-zones';
import JSZip from 'jszip';

// Exporta o PLANO COMPLETO (todos os treinos, ou de uma modalidade) em um único .ZIP
// nos formatos nativos: Garmin (.FIT por treino) ou MyWhoosh/Zwift (.ZWO; natação/força em .txt).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const planId = req.nextUrl.searchParams.get('planId');
  const platform = (req.nextUrl.searchParams.get('platform') || 'garmin').toLowerCase();
  const modality = (req.nextUrl.searchParams.get('modality') || 'todos').toLowerCase();
  const mode = (req.nextUrl.searchParams.get('mode') || 'zona').toLowerCase() === 'km' ? 'km' : 'zona';
  // Formato do Garmin: 'fit' (p/ relógio via USB) ou 'tcx' (p/ TrainingPeaks). Exporta UM só por vez.
  const format = (req.nextUrl.searchParams.get('format') || 'fit').toLowerCase() === 'tcx' ? 'tcx' : 'fit';
  if (!planId) return NextResponse.json({ error: 'planId obrigatório' }, { status: 400 });

  const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });

  const isCoach = (session.user as any).role === 'coach';
  if (plan.userId !== session.user.id && !isCoach) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const where: any = { planId };
  if (modality !== 'todos') where.modality = modality;
  const workouts = await prisma.workout.findMany({ where, orderBy: { date: 'asc' } });
  if (workouts.length === 0) return NextResponse.json({ error: 'Nenhum treino para exportar' }, { status: 404 });

  // Pace de limiar do atleta (para converter tempo->distância na corrida quando mode='km').
  const profile = await prisma.athleteProfile.findUnique({ where: { userId: plan.userId } });
  const thresholdPaceSec = paceToSec(profile?.testRunPace || profile?.runPace);

  const zip = new JSZip();
  const used = new Set<string>();
  const uniqueName = (base: string, ext: string) => {
    let name = `${base}.${ext}`;
    let i = 2;
    while (used.has(name)) { name = `${base}_${i}.${ext}`; i++; }
    used.add(name);
    return name;
  };

  try { workouts.forEach((w, idx) => {
    const wk = String(w.weekNumber ?? Math.floor(idx / 5) + 1).padStart(2, '0');
    const ds = w.date ? new Date(w.date).toISOString().slice(0, 10) : null; // prefixo de data p/ agendar no calendário
    const base = `${ds ? ds + '_' : ''}S${wk}_${slugify(w.title)}`;
    if (platform === 'garmin') {
      // Garmin: força/descanso como texto. Demais modalidades geram UM arquivo no formato escolhido
      // (.TCX para TrainingPeaks OU .FIT para o relógio via USB) — nunca os dois juntos.
      if (w.modality === 'forca' || w.modality === 'descanso') {
        zip.file(uniqueName(base, 'txt'), buildTxt(w));
      } else if (format === 'tcx') {
        zip.file(uniqueName(base, 'tcx'), buildTcx(w));
      } else {
        zip.file(uniqueName(base, 'fit'), buildFit(w, { mode, thresholdPaceSec }));
      }
    } else {
      // MyWhoosh / Zwift / Rouvy: .ZWO para ciclismo e corrida; demais como texto.
      if (w.modality === 'ciclismo' || w.modality === 'corrida') {
        zip.file(uniqueName(base, 'zwo'), buildZwo(w, { ftp: bikeThreshold(profile) }));
      } else {
        zip.file(uniqueName(base, 'txt'), buildTxt(w));
      }
    }
  }); } catch (error) {
    return NextResponse.json({error:error instanceof WorkoutExportError ? error.message : 'Não foi possível exportar. Peça ao treinador para revisar a estrutura dos treinos.'},{status:422,headers:{'Cache-Control':'no-store'}});
  }

  // Inclui a planilha completa em texto como referência.
  const readme = [
    `PLANO: ${plan.name}`,
    `Plataforma: ${platform === 'garmin' ? `Garmin (${format === 'tcx' ? '.TCX' : '.FIT'})` : 'MyWhoosh / Zwift (.ZWO)'}`,
    `Modalidade: ${modality === 'todos' ? 'Todas' : modality}`,
    ...(platform === 'garmin' && format === 'fit' ? [`Alvo da corrida: ${mode === 'km' ? 'por distância estimada quando há pace de limiar' : 'blocos e alvos disponíveis no plano'}`] : []),
    `Total de treinos: ${workouts.length}`,
    ...((plan.summary as any)?.requiresCoachReview ? ['REVISÃO NECESSÁRIA: este plano requer avaliação do treinador e não representa liberação para treinar.'] : []),
    '',
    ...(platform === 'garmin'
      ? (format === 'tcx'
          ? [
              'Este ZIP contém arquivos .TCX (um por treino).',
              '',
              'IMPORTANTE: o site do Garmin Connect NÃO importa treinos planejados por arquivo (o menu Exercícios só cria à mão; a página "Importar Dados" é só para atividades concluídas). O .TCX serve para o TrainingPeaks:',
              '   - Em uma conta TrainingPeaks, importe o arquivo .TCX para o calendário.',
              '   - Conecte o TrainingPeaks ao Garmin Connect: o treino é enviado automaticamente ao calendário e ao relógio.',
              '',
              'Prefere colocar direto no relógio por cabo USB? Baixe a versão em .FIT no app.',
            ]
          : [
              'Este ZIP contém arquivos .FIT (um por treino).',
              '',
              'COMO COLOCAR OS TREINOS NO RELÓGIO (cabo USB — RECOMENDADO):',
              '   - Conecte o relógio/ciclocomputador ao computador com o cabo USB (ele aparece como um pen drive).',
              '   - Abra a pasta GARMIN e depois NewFiles (em alguns modelos, a pasta Workouts).',
              '   - Copie os arquivos .FIT para dentro dela.',
              '   - Ejete com segurança e reinicie o aparelho: os treinos aparecem no menu Treino do próprio relógio.',
              '',
              'Observação: o site do Garmin Connect não importa treinos por arquivo. Para usar o TrainingPeaks, baixe a versão em .TCX no app.',
            ])
      : ['Como importar: copie os arquivos .ZWO para a pasta de Workouts (Zwift) ou importe no Workout Builder do MyWhoosh.']),
  ].join('\n');
  zip.file('COMO_IMPORTAR.txt', readme);

  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const fname = `plano_${modality}_${platform}${platform === 'garmin' ? '_' + format + (format === 'fit' ? '_' + mode : '') : ''}.zip`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fname}"`,
      'Cache-Control': 'no-store',
    },
  });
}

import { Activity } from 'lucide-react';
import { Card,CardHeader,CardTitle,CardContent } from '@/components/ui/card';
import { targetForZone } from '@/lib/training-zones';
import type { TrainingProfile,TrainingModality,TrainingZone } from '@/lib/training-types';

const labels:Record<string,string>={corrida:'Corrida',ciclismo:'Ciclismo',natacao:'Natação'};
const zones:TrainingZone[]=['Z1','Z2','Z3','Z4','Z5'];
export function TrainingZonesSummary({profile}:{profile:TrainingProfile|null}) {
  if(!profile)return null;
  const modalities:TrainingModality[]=profile.modality==='triatlo'?['natacao','ciclismo','corrida']:[profile.modality as TrainingModality];
  return <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" />Zonas usadas nas sessões</CardTitle><p className="text-sm text-muted-foreground">Mesma regra do motor de treinos. Sem limiar ou equipamento adequado, a referência é a percepção de esforço. Zonas são faixas operacionais, sem equivalência fisiológica exata.</p></CardHeader><CardContent><div className="grid gap-4 xl:grid-cols-3">{modalities.filter(modality=>labels[modality]).map(modality=><section key={modality} aria-label={`Zonas de ${labels[modality]}`} className="rounded-xl border overflow-hidden"><h3 className="bg-secondary px-4 py-3 font-semibold text-secondary-foreground">{labels[modality]}</h3><dl className="divide-y">{zones.map(zone=>{const target=targetForZone(profile,modality,zone);return <div key={zone} className="flex flex-wrap gap-2 justify-between px-4 py-3 text-sm"><dt className="font-semibold text-primary">{zone}</dt><dd className="max-w-full break-words text-right">{target.text}</dd></div>;})}</dl><p className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">{targetForZone(profile,modality,'Z2').source}</p></section>)}</div><p className="mt-4 text-xs text-muted-foreground">Atualizar uma referência no perfil não reescreve os blocos de um plano antigo. Revise e gere um novo plano quando necessário.</p></CardContent></Card>;
}

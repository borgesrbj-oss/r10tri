'use client';
import { useState, useEffect } from 'react';
import { useCurrentTime } from '@/hooks/use-browser-state';
import { TrendingUp, Scale, Dumbbell, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/animate';
import dynamic from 'next/dynamic';

const WeightChart = dynamic(() => import('./weight-chart'), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando gráfico...</div> });
const LoadChart = dynamic(() => import('./load-chart'), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando gráfico...</div> });

export function EvolucaoClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const now = useCurrentTime();

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando dados...</div>;

  const compliance = data?.compliance ?? { total: 0, done: 0, rate: 0 };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><TrendingUp className="h-7 w-7 text-primary" /> Evolução</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso de treino e saúde</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-3 gap-4">
        <FadeIn delay={0.1}><Card><CardContent className="p-4 text-center">
          <Dumbbell className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold font-mono">{compliance?.done ?? 0}/{compliance?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">Treinos Concluídos</p>
        </CardContent></Card></FadeIn>
        <FadeIn delay={0.15}><Card><CardContent className="p-4 text-center">
          <BarChart3 className="h-6 w-6 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold font-mono">{compliance?.rate ?? 0}%</p>
          <p className="text-xs text-muted-foreground">Aderência</p>
        </CardContent></Card></FadeIn>
        <FadeIn delay={0.2}><Card><CardContent className="p-4 text-center">
          <Scale className="h-6 w-6 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold font-mono">{data?.profile?.currentWeight ? `${data.profile.currentWeight}kg` : '—'}</p>
          <p className="text-xs text-muted-foreground">Peso Atual</p>
        </CardContent></Card></FadeIn>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FadeIn delay={0.25}><Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Evolução de Peso</CardTitle></CardHeader>
          <CardContent><div className="h-64"><WeightChart data={data?.weightLogs ?? []} target={data?.profile?.targetWeight} /></div></CardContent>
        </Card></FadeIn>
        <FadeIn delay={0.3}><Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Carga Semanal (min)</CardTitle></CardHeader>
          <CardContent><div className="h-64"><LoadChart data={data?.weeklyLoad ?? []} /></div></CardContent>
        </Card></FadeIn>
      </div>

      {(data?.races?.length ?? 0) > 0 && (
        <FadeIn delay={0.35}><Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Contagem Regressiva</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.races?.filter((r: any) => now !== null && new Date(r?.date).getTime() > now)?.map((r: any, i: number) => {
                const days = now === null ? null : Math.ceil((new Date(r?.date).getTime() - now) / (1000*60*60*24));
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div><p className="font-medium">{r?.name}</p><p className="text-sm text-muted-foreground">{r?.distance}</p></div>
                    <Badge variant={days !== null && days <= 30 ? 'destructive' : 'secondary'} className="text-lg px-3 py-1 font-mono">{days ?? '—'}d</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card></FadeIn>
      )}
    </div>
  );
}

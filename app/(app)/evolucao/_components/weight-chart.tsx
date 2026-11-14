'use client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

export default function WeightChart({ data, target }: { data: any[]; target?: number | null }) {
  if (!data?.length) return <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados de peso ainda</div>;
  const chartData = (data ?? []).map((d: any) => ({ date: new Date(d?.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), peso: d?.weight }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
        <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" angle={-45} textAnchor="end" height={50} />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="peso" stroke="hsl(174, 62%, 32%)" fill="hsl(174, 62%, 32%, 0.15)" strokeWidth={2} name="Peso (kg)" />
        {target && <ReferenceLine y={target} stroke="hsl(0, 84%, 60%)" strokeDasharray="5 5" label={{ value: `Meta: ${target}kg`, position: 'insideTopRight', style: { fontSize: 10 } }} />}
      </AreaChart>
    </ResponsiveContainer>
  );
}

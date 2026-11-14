'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function LoadChart({ data }: { data: any[] }) {
  if (!data?.length) return <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados de treino ainda</div>;
  const chartData = (data ?? []).map((d: any) => ({ semana: d?.week?.slice(5) ?? '', natacao: d?.natacao ?? 0, ciclismo: d?.ciclismo ?? 0, corrida: d?.corrida ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
        <XAxis dataKey="semana" tickLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="natacao" stackId="a" fill="#60B5FF" name="Natação" />
        <Bar dataKey="ciclismo" stackId="a" fill="#FF9149" name="Ciclismo" />
        <Bar dataKey="corrida" stackId="a" fill="#80D8C3" name="Corrida" />
      </BarChart>
    </ResponsiveContainer>
  );
}

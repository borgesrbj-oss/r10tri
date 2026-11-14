'use client';
import { useState } from 'react';
import { Activity, Dumbbell, Youtube, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/animate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Exercise = {
  id: string;
  name: string;
  group: string;
  description: string;
  setsReps: string;
  youtube: string;
};

const EXERCISES: Exercise[] = [
  // Core / Abdômen
  { id: 'prancha', name: 'Prancha Isométrica', group: 'Core', description: 'Fortalece o core, essencial para postura na bike e na corrida. Mantenha o corpo alinhado, abdômen contraído.', setsReps: '3x 30-60s', youtube: 'prancha isometrica core' },
  { id: 'prancha-lateral', name: 'Prancha Lateral', group: 'Core', description: 'Trabalha os oblíquos e estabilizadores laterais do tronco. Mantenha o quadril elevado.', setsReps: '3x 30s cada lado', youtube: 'prancha lateral obliquos' },
  { id: 'abdominal-bike', name: 'Abdominal Bicicleta', group: 'Core', description: 'Ativa reto abdominal e oblíquos com movimento de pedalada. Controle o movimento.', setsReps: '3x 20 reps', youtube: 'abdominal bicicleta' },
  { id: 'dead-bug', name: 'Dead Bug', group: 'Core', description: 'Estabilização do core com movimento contralateral de braços e pernas. Lombar no chão.', setsReps: '3x 12 cada lado', youtube: 'dead bug exercicio' },
  { id: 'bird-dog', name: 'Bird Dog', group: 'Core', description: 'Equilíbrio e estabilidade lombar estendendo braço e perna opostos. Movimento lento.', setsReps: '3x 12 cada lado', youtube: 'bird dog exercicio' },

  // Pernas / Glúteos
  { id: 'agachamento', name: 'Agachamento Livre', group: 'Pernas', description: 'Base para potência no ciclismo e corrida. Joelhos alinhados aos pés, desça até 90°.', setsReps: '4x 12 reps', youtube: 'agachamento livre tecnica' },
  { id: 'afundo', name: 'Afundo (Lunge)', group: 'Pernas', description: 'Trabalha quadríceps, glúteos e equilíbrio unilateral. Essencial para corrida.', setsReps: '3x 12 cada perna', youtube: 'afundo lunge corrida' },
  { id: 'stiff', name: 'Stiff (Levantamento Terra Romeno)', group: 'Pernas', description: 'Fortalece posteriores de coxa e glúteos. Costas retas, quadril para trás.', setsReps: '3x 12 reps', youtube: 'stiff levantamento terra romeno' },
  { id: 'elevacao-panturrilha', name: 'Elevação de Panturrilha', group: 'Pernas', description: 'Fortalece panturrilhas, importante para a fase de impulsão na corrida.', setsReps: '4x 15-20 reps', youtube: 'elevacao panturrilha' },
  { id: 'ponte-gluteo', name: 'Ponte de Glúteo', group: 'Pernas', description: 'Ativa glúteos e posteriores, melhora a potência do pedal e corrida.', setsReps: '3x 15 reps', youtube: 'ponte de gluteo' },
  { id: 'agachamento-bulgaro', name: 'Agachamento Búlgaro', group: 'Pernas', description: 'Unilateral intenso para quadríceps e glúteos, melhora força e equilíbrio.', setsReps: '3x 10 cada perna', youtube: 'agachamento bulgaro' },
  { id: 'step-up', name: 'Step Up', group: 'Pernas', description: 'Subida em banco simulando impulsão, fortalece pernas de forma funcional.', setsReps: '3x 12 cada perna', youtube: 'step up exercicio' },

  // Superiores / Ombro (natação)
  { id: 'flexao', name: 'Flexão de Braço', group: 'Superiores', description: 'Fortalece peito, ombros e tríceps, útil para a braçada da natação.', setsReps: '3x 12-15 reps', youtube: 'flexao de braco tecnica' },
  { id: 'remada', name: 'Remada Curvada', group: 'Superiores', description: 'Trabalha costas e postura, equilibra a musculatura da braçada.', setsReps: '3x 12 reps', youtube: 'remada curvada halter' },
  { id: 'rotador-externo', name: 'Rotação Externa de Ombro', group: 'Superiores', description: 'Previne lesões no manguito rotador, essencial para nadadores.', setsReps: '3x 15 cada lado', youtube: 'rotacao externa ombro manguito' },
  { id: 'elevacao-lateral', name: 'Elevação Lateral', group: 'Superiores', description: 'Fortalece o deltoide, melhora a estabilidade do ombro na natação.', setsReps: '3x 15 reps', youtube: 'elevacao lateral ombro' },

  // Mobilidade / Alongamento
  { id: 'mob-quadril', name: 'Mobilidade de Quadril', group: 'Mobilidade', description: 'Aumenta amplitude do quadril para pedal e passada mais eficientes.', setsReps: '2x 10 cada lado', youtube: 'mobilidade de quadril triatlo' },
  { id: 'mob-toracica', name: 'Mobilidade Torácica', group: 'Mobilidade', description: 'Melhora rotação da coluna, importante para rolamento na natação.', setsReps: '2x 10 cada lado', youtube: 'mobilidade toracica' },
  { id: 'along-posterior', name: 'Alongamento de Posteriores', group: 'Mobilidade', description: 'Reduz tensão em isquiotibiais, prevenindo lesões na corrida.', setsReps: '3x 30s', youtube: 'alongamento posterior de coxa' },
  { id: 'along-panturrilha', name: 'Alongamento de Panturrilha', group: 'Mobilidade', description: 'Mantém elasticidade da panturrilha e tendão de Aquiles.', setsReps: '3x 30s cada', youtube: 'alongamento panturrilha' },
  { id: 'mob-tornozelo', name: 'Mobilidade de Tornozelo', group: 'Mobilidade', description: 'Melhora o apoio e a amplitude na corrida e transições.', setsReps: '2x 12 cada lado', youtube: 'mobilidade de tornozelo' },
  { id: 'gato-camelo', name: 'Gato-Camelo', group: 'Mobilidade', description: 'Mobiliza a coluna, alivia tensões lombares após longos na bike.', setsReps: '2x 12 reps', youtube: 'gato camelo coluna' },
];

const GROUPS = ['Todos', 'Core', 'Pernas', 'Superiores', 'Mobilidade'];

const GROUP_COLORS: Record<string, string> = {
  Core: 'bg-[#1A8A7D]/15 text-[#2dd4bf] border-[#1A8A7D]/30',
  Pernas: 'bg-[#F97316]/15 text-[#fb923c] border-[#F97316]/30',
  Superiores: 'bg-[#3B82F6]/15 text-[#60a5fa] border-[#3B82F6]/30',
  Mobilidade: 'bg-[#22C55E]/15 text-[#4ade80] border-[#22C55E]/30',
};

export function ExerciciosClient() {
  const [filter, setFilter] = useState('Todos');
  const [selected, setSelected] = useState<Exercise | null>(null);

  const list = filter === 'Todos' ? EXERCISES : EXERCISES.filter((e) => e.group === filter);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" /> Mobilidade & Força
          </h1>
          <p className="text-muted-foreground">Exercícios complementares para prevenir lesões e ganhar performance</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {GROUPS.map((g) => (
            <Button key={g} variant={filter === g ? 'default' : 'outline'} size="sm" onClick={() => setFilter(g)}>
              {g}
            </Button>
          ))}
        </div>
      </FadeIn>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((ex, i) => (
          <FadeIn key={ex.id} delay={0.03 * i}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelected(ex)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{ex.name}</CardTitle>
                  <Dumbbell className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
                <Badge variant="outline" className={GROUP_COLORS[ex.group] ?? ''}>{ex.group}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{ex.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">{ex.setsReps}</span>
                  <span className="text-xs text-muted-foreground">Ver detalhes</span>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o: boolean) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" /> {selected.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Badge variant="outline" className={GROUP_COLORS[selected.group] ?? ''}>{selected.group}</Badge>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
                <div className="rounded-lg bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">Séries & Repetições</p>
                  <p className="text-lg font-bold text-primary">{selected.setsReps}</p>
                </div>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.youtube)}`} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2" style={{ background: 'linear-gradient(90deg, #1A8A7D, #14B8A6)' }}>
                    <Youtube className="h-4 w-4" /> Assistir no YouTube
                  </Button>
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

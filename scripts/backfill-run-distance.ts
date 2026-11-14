// Backfill pontual: recalcula a descrição dos treinos de CORRIDA já gerados
// para incluir SEMPRE a distância a percorrer (tiros + distância total da sessão),
// usando a mesma função buildRunDescription do motor de plano. Determinístico, sem IA.
// Execução: yarn tsx --require dotenv/config scripts/backfill-run-distance.ts
import { prisma } from '../lib/db';
import { buildRunDescription } from '../lib/plan-engine';

async function main() {
  const runs = await prisma.workout.findMany({ where: { modality: 'corrida' } });
  console.log(`Treinos de corrida encontrados: ${runs.length}`);

  // Agrupa por usuário para carregar o perfil (pace/limiar) uma única vez.
  const byUser = new Map<string, typeof runs>();
  for (const w of runs) {
    const arr = byUser.get(w.userId) ?? [];
    arr.push(w);
    byUser.set(w.userId, arr);
  }

  let updated = 0;
  for (const [userId, ws] of byUser) {
    const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
    for (const w of ws) {
      const dayNum = new Date(w.date).getDay();
      const zone = w.targetZone || 'Z2';
      const dur = w.duration || 60;
      const desc = buildRunDescription(profile, zone, dur, dayNum);
      if (desc !== w.description) {
        await prisma.workout.update({ where: { id: w.id }, data: { description: desc } });
        updated++;
      }
    }
  }
  console.log(`Descrições atualizadas: ${updated}`);
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(0); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

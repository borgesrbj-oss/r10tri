'use client';
import { Apple, Target, Utensils, Droplets, Flag, Timer, Sparkles, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animate';
import Link from 'next/link';

type Section = { title: string; lines: string[] };

function parseNutrition(text: string): { intro: string; sections: Section[] } {
  const raw = (text ?? '').replace(/\r/g, '');
  const lines = raw.split('\n');
  let intro = '';
  const sections: Section[] = [];
  let current: Section | null = null;
  const headerRe = /^\s*==\s*(.+?)\s*==\s*$/;
  for (const ln of lines) {
    const m = ln.match(headerRe);
    if (m) {
      current = { title: m[1].trim(), lines: [] };
      sections.push(current);
      continue;
    }
    const clean = ln.replace(/^\s*[•\-*]\s?/, '').trim();
    if (!clean) continue;
    if (current) current.lines.push(clean);
    else intro += (intro ? '\n' : '') + clean;
  }
  return { intro: intro.trim(), sections };
}

function iconFor(title: string): any {
  const t = title.toLowerCase();
  if (t.includes('meta') || t.includes('diári') || t.includes('macro') || t.includes('caloria')) return Target;
  if (t.includes('antes')) return Utensils;
  if (t.includes('durante')) return Droplets;
  if (t.includes('após') || t.includes('apos') || t.includes('depois') || t.includes('recupera')) return Apple;
  if (t.includes('prova') || t.includes('competi')) return Flag;
  if (t.includes('hidrat')) return Droplets;
  return Timer;
}

export function NutricaoClient({ plan }: { plan: any; profile: any }) {
  const nutrition: string = plan?.nutritionPlan ?? '';
  const { intro, sections } = parseNutrition(nutrition);

  const downloadTxt = () => {
    const blob = new Blob([nutrition], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plano_nutricional.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><Apple className="h-7 w-7 text-emerald-500" /> Plano Alimentar</h1>
            <p className="text-muted-foreground">Sua estratégia nutricional personalizada, separada dos treinos para consulta rápida.</p>
          </div>
          {plan?.nutritionPlan && (
            <Button variant="outline" size="sm" onClick={downloadTxt}>
              <Download className="mr-1.5 h-4 w-4" /> Baixar
            </Button>
          )}
        </div>
      </FadeIn>

      {!plan ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Apple className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum plano ativo</p>
          <p className="text-sm">Gere um plano na aba <Link href="/plano" className="text-primary hover:underline">Plano</Link> para receber também seu plano alimentar personalizado.</p>
        </CardContent></Card>
      ) : !plan?.nutritionPlan ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Plano alimentar ainda não disponível</p>
          <p className="text-sm">Gere um novo plano na aba <Link href="/plano" className="text-primary hover:underline">Plano</Link> para incluir a estratégia nutricional.</p>
        </CardContent></Card>
      ) : (
        <>
          {intro && (
            <FadeIn>
              <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <CardContent className="p-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{intro}</p>
                </CardContent>
              </Card>
            </FadeIn>
          )}
          {sections.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((s, i) => {
                const Icon = iconFor(s.title);
                return (
                  <FadeIn key={i} delay={i * 0.04}>
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10"><Icon className="h-4.5 w-4.5 text-emerald-500" /></span>
                          {s.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {s.lines.map((ln, j) => (
                            <li key={j} className="flex gap-2 text-sm leading-relaxed">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                              <span>{ln}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </FadeIn>
                );
              })}
            </div>
          ) : (
            <FadeIn>
              <Card><CardContent className="p-5"><p className="text-sm leading-relaxed whitespace-pre-wrap">{nutrition}</p></CardContent></Card>
            </FadeIn>
          )}
        </>
      )}
    </div>
  );
}

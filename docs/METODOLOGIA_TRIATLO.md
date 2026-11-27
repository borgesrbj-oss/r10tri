# Metodologia do gerador de triatlo

## Entradas e calendário

O plano usa a prova compatível mais prioritária, a data de início, o histórico recente por modalidade, o nível, a recuperação e as referências de intensidade. Em caso de empate de prioridade, a data e o identificador estabilizam a escolha. O atleta pode cadastrar a meta total. Um coach vinculado pode configurar distâncias, faixas, referências de desempenho e confirmar a revisão para o nível atual.

| Formato | Natação | Ciclismo | Corrida | Base | Construção | Polimento |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sprint | 750 m | 20 km | 5 km | 4 semanas | 6 semanas | 2 semanas |
| Olímpico | 1.500 m | 40 km | 10 km | 5 semanas | 7 semanas | 2 semanas |
| 70.3 | 1.900 m | 90 km | 21,1 km | 6 semanas | 8 semanas | 2 semanas |
| Ironman | 3.800 m | 180 km | 42,195 km | 10 semanas | 11 semanas | 3 semanas |

As distâncias são referências e podem mudar por percurso. As semanas compõem ciclos de referência. Prazo insuficiente pede revisão. Uma solicitação que termina antes da prova é um bloco preparatório. Após a competição, a geração automática pode incluir duas semanas de transição separadas da auditoria pré-prova. [World Triathlon](https://triathlon.org/agegroup) · [IRONMAN 70.3](https://www.ironman.com/sites/default/files/2024-10/im_703_monterrey_athlete_guide_english_2024.pdf) · [IRONMAN](https://www.ironman.com/sites/default/files/2025-06/IMFR2025_Athlete%20guide_EN.pdf)

A referência de distribuição é 18% natação, 47% ciclismo, 30% corrida e 5% de reserva para encaixe, força complementar e transições. O histórico, a ênfase por disciplina e as sessões que cabem alteram a divisão. O motor calcula a duração e depois aplica limites de sessão, dia e semana. Se o volume semanal for muito baixo, a agenda automática pode agrupar a prescrição em menos sessões. A agenda explícita é respeitada. Um brick bike → T2 → corrida gera três partes ordenadas e só sai quando todas cabem. O tempo de cada parte é contabilizado uma vez.

Na base e construção, a descarga acontece a cada 3 semanas no sprint e olímpico e a cada 4 semanas no 70.3 e no Ironman. O orçamento de descarga é 65% da semana regular anterior. Calcula-se o efeito a partir do volume que entrou no calendário. No polimento, o orçamento parte de 60%, depois 50% e, quando há uma terceira semana, 40% da última semana regular, com ajuste de minutos inteiros. As semanas de referência terminam na semana da prova. Para provas no meio da semana, o último bloco pré-prova fica parcial.

O teto de +10% sempre compara com a semana imediatamente anterior. Exemplo: 600 → 390 min na descarga e no máximo 429 min no retorno. Recuperações periódicas com essa regra podem deixar a última semana de carga abaixo da primeira. Restrições de horário podem reduzir ainda mais o volume. O relatório expõe esses desvios. Os percentuais de progressão e descarga são regras do produto e exigem revisão por um treinador de triathlon ou profissional de educação física. A redução de volume com preservação de estímulos no polimento segue a literatura de endurance. Lesão atual, condição de saúde ou dor relatada disparam orientação para consulta profissional nos quatro ciclos de prova. [Wang et al.](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0282838) · [Consenso do COI sobre carga](https://bjsm.bmj.com/content/50/17/1030)

## Distribuição por intensidade

O cálculo soma segundos em cada bloco aeróbico ativo já encaixado. Aquecimento, recuperação em movimento e desaquecimento entram na zona prescrita. Força, transição passiva, pausa e prova ficam fora. Tempo ativo sem zona aparece como indeterminado. Os percentuais do ciclo são calculados a partir das somas, incluindo descarga e polimento.

| Janela | Z1–Z2 | Z3 | Z4–Z5 |
| --- | ---: | ---: | ---: |
| Semana regular e ciclo inteiro | 75–85% | <10% | 15–25% |
| Descarga | Restante | <10% | 0–10% |
| Polimento | Restante | <10% | Maior que 0% e até 10% |

As cinco zonas usam FTP, FC de limiar, ritmo de corrida ou CSS quando disponíveis. O app também indica a percepção de esforço quando faltam referências. Z1–Z2, Z3 e Z4–Z5 são grupos operacionais para baixa, intermediária e alta intensidade. A correspondência fisiológica é abaixo de VT1, entre VT1 e VT2 e acima de VT2 quando esses pontos são medidos por modalidade. FTP, CSS e FC de reserva são referências diferentes, e um alvo Z4 pode cruzar o limiar funcional. Por isso o app mantém separada a leitura abaixo, no e acima do limiar. [Seiler e Kjerland](https://pubmed.ncbi.nlm.nih.gov/16430681/) · [Coggan](https://www.trainingpeaks.com/blog/power-training-levels/) · [Friel](https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/)

## Metas de prova e métricas

O tempo do nado é distância em centenas de metros vezes segundos por 100 m. O tempo do pedal é distância em km dividida pela velocidade de referência em km/h. A corrida usa a distância em km vezes segundos por km, preferencialmente de uma corrida comparável após o pedal. T1 e T2 usam referências confirmadas. Os cinco valores são convertidos para segundos e sua soma é o total calculado. A diferença relativa à meta informada precisa ser de até 2%. Cada trecho também deve caber na faixa configurada. Os alvos permanecem pendentes quando faltam dados, a comparação é inviável ou o coach ainda precisa revisar.

| Métrica | Cálculo e dados de entrada |
| --- | --- |
| CSS | `200/(T400−T200)` m/s e `100/CSS` s/100 m. Tempos em segundos. |
| Bike | `IF = NP/FTP`, `TSS = 100 × segundos × NP × IF/(3600 × FTP)`. NP e FTP em watts. |
| Energia da bike | `kJ = potência média × segundos/1000`, `kcal ≈ kJ/(0,24 × 4,184)`. A potência média é independente da NP. |
| Corrida | `IF = vreal/vlimiar`, `rTSS simplificado = 100 × horas × IF²`, `kcal ≈ massa × km`. O rTSS usa velocidade sem correção de inclinação. |
| FC | Priorizar FCmáx medida. Estimativa para adulto `208−0,7×idade`. FC alvo `FCrep+p×(FCmáx−FCrep)`, com a fração de reserva `p` entre zero e um. |
| Carboidrato | `taxa em g/h × horas`, com 60–90 g/h como faixa configurável para sessões prolongadas elegíveis. |
| CTL, ATL e TSB | Cada dia confirma a carga ou registra uma lacuna. `CTL = anterior +(TSS−anterior)/42`, `ATL = anterior +(TSS−anterior)/7`, `TSB = CTL−ATL` no fechamento. Sem série anterior, iniciar em zero. Descanso confirmado vale zero. Sem dados, a lacuna permanece distinta. A série usa corrida e ciclismo com dados válidos. |

Quando há 4 h de treino com NP de 187,5 W e FTP de 250 W, o IF é 0,75 e o TSS é 225. Os 2.700 kJ só correspondem ao caso em que a potência média é também de 187,5 W. O CSS de 420 s nos 400 m e 200 s nos 200 m resulta em 1:50/100 m. Sete dias confirmados com 50 TSS diários a partir de zero resultam em CTL 7,7612, ATL 33,0042 e TSB −25,2430. [Coggan](https://www.trainingpeaks.com/learn/articles/normalized-power-intensity-factor-training-stress/) · [Wakayoshi et al.](https://pubmed.ncbi.nlm.nih.gov/1555562/) · [Tanaka et al.](https://pubmed.ncbi.nlm.nih.gov/11153730/) · [Karvonen et al.](https://pubmed.ncbi.nlm.nih.gov/13470504/) · [Jeukendrup](https://pubmed.ncbi.nlm.nih.gov/24791914/)

## Verificação

Os testes da matriz usam perfis fictícios gerados por semente. Os resultados descrevem a prescrição do software, com histórico e faixas de prova sintéticos. Uma faixa confirmada pelo programa mede a distribuição dos alvos prescritos. A intensidade fisiológica realizada e a prontidão para competir exigem dados e revisão específicos do atleta.

- Testes e cobertura do motor com Node.js 24

  ```sh
  npm test
  node --import tsx --experimental-test-coverage --test-coverage-include=lib/training-structure.ts --test tests/treinos-estruturados.test.ts tests/periodizacao-triatlo.test.ts tests/triathlon-generator.test.ts tests/time-constraints.test.ts
  ```

- Comparação e exemplos em [Validação do gerador](./VALIDACAO_GERADOR_TRIATLO.md)
- Créditos e inspeção editorial em [Validação dos vídeos](./VALIDACAO_VIDEOS_NATACAO.md)

## Arquivos da implementação

| Arquivo | Motivo |
| --- | --- |
| `lib/training-structure.ts` | Integra fases, volume, encaixe, intensidade, métricas e montagem do brick. |
| `lib/training-types.ts` | Estende os contratos de prova, semana, distribuição e treino. |
| `lib/triathlon-periodization.ts` | Concentra regras de fase, descarga, polimento e proporções por modalidade. |
| `lib/polarized-distribution.ts` | Avalia as faixas por segundos ativos e identifica dados indeterminados. |
| `lib/calendar-day.ts` | Compartilha a interpretação das datas de calendário entre seleção e geração. |
| `lib/training-audit.ts` | Preserva a leitura por limiar e usa a referência de FTP do motor. |
| `lib/planning-evidence.ts` | Registra as referências consultadas para intensidade e polimento. |
| `components/planning-audit.tsx` | Expõe metas e cálculo semanal por zonas a partir do calendário exibido. |
| `app/api/plan/generate/route.ts` | Persiste a prova escolhida, a ordem dos bricks e a memória de cálculo. |
| `lib/triathlon-race.ts` | Define formatos, critérios de seleção, faixas e soma dos cinco segmentos. |
| `app/api/races/route.ts` | Valida a edição da meta do atleta e preserva as referências do coach. |
| `app/(app)/provas/page.tsx` | Carrega os dados necessários à conferência das metas na tela de provas. |
| `app/(app)/provas/_components/provas-client.tsx` | Permite informar a meta total e mostra os dados pendentes. |
| `components/triathlon-race-editor.tsx` | Permite ao coach informar distâncias, referências, faixas e revisão por nível. |
| `components/triathlon-race-target.tsx` | Mostra tempos por trecho, soma, diferença e pendências. |
| `components/coach-athlete-editor.tsx` | Expõe ciclos de até 24 semanas e a revisão de metas e conflitos. |
| `lib/coach-service.ts` | Vincula prova e metadados ao rascunho e à publicação, com revalidação de acessos e conflitos. |
| `lib/triathlon-metrics.ts` | Concentra as fórmulas e mantém carga planejada, realizada e ausente distintas. |
| `lib/training-zones.ts` | Usa CSS e referências de intensidade validadas, com origem explícita. |
| `lib/assessment-validation.ts` | Valida testes declarados, valores medidos e configuração de carboidrato. |
| `lib/assessment-review.ts` | Liga pendências de validação aos campos corretos do formulário. |
| `app/(app)/plano/_components/coach-questionnaire.tsx` | Exibe medições e estimativas sem preencher uma com a outra. |
| `app/api/workouts/log/route.ts` | Registra potência média e normalizada e preserva a referência usada na carga realizada. |
| `app/api/workouts/rest/route.ts` | Registra descanso confirmado com autorização, data explícita e repetição segura. |
| `app/(app)/calendario/_components/calendario-client.tsx` | Permite ao atleta confirmar descanso no dia aberto. |
| `app/api/dashboard/route.ts` e `app/(app)/dashboard/page.tsx` | Preservam a contagem de sessões realizadas ao incluir registros de descanso. |
| `app/(app)/evolucao/_components/evolucao-client.tsx` | Mostra CTL, ATL, TSB e lacunas de carga. |
| `app/(app)/planilha/page.tsx` e `app/(app)/planilha/_components/planilha-client.tsx` | Exibem métricas, origem e cobertura dos dados sem converter ausência em zero. |
| `lib/brick-transition.ts` e `lib/coach-editor.ts` | Criam e reconhecem T1/T2 nas estruturas e mantêm leitura dos bricks antigos. |
| `lib/export-builders.ts` | Representa a transição em TXT com validação de modalidade. |
| `app/api/plan/export/route.ts` | Mantém no ZIP a ordem de cada parte. |
| `app/api/plan/push-intervals/route.ts` | Envia a transição como anotação e considera a duração no sequenciamento. |
| `lib/swim-media-catalog.ts` e `components/swim-media-references.tsx` | Guardam e mostram referências de técnica com crédito, licença e origem. |
| `components/workout-structure.tsx` | Liga treinos de técnica ao catálogo e exibe transições independentes. |
| `app/(app)/guias/_components/guias-client.tsx` | Mantém orientação escrita de CSS e lista os vídeos licenciados de técnica. |
| `scripts/verificar-videos-natacao.ts` | Repete a verificação HTTP dos endereços do catálogo. |
| `prisma/schema.prisma` e `prisma/migrations/20261123010000_metricas_e_metas_triatlo/migration.sql` | Acrescentam dados opcionais para metas e métricas sem reescrever o histórico. |
| `tests/triathlon-generator.test.ts` e `tests/fixtures/triathlon-matrix.ts` | Validam 120 perfis, duração, faixas, estrutura, determinismo e casos fora da referência. |
| `tests/metricas-triatlo.test.ts` | Compara as fórmulas a referências numéricas e testa o histórico de carga. |
| `tests/triathlon-race.test.ts` e `tests/profile-races.test.ts` | Testam seleção, metas viáveis e pendentes e controle de edição. |
| `tests/coach-triathlon-draft.test.ts` e `tests/coach-editor.test.ts` | Testam ciclo longo, conflitos de publicação e edição de partes do brick. |
| `tests/exportacoes-estruturadas.test.ts` | Cobre transições em TXT, ZIP e envio simulado para Intervals. |
| `tests/midia-natacao.test.ts` | Confere dados de mídia e relação com o treino. |
| `tests/seguranca.test.mjs` | Cobre persistência de métricas e isolamento do registro de descanso. |

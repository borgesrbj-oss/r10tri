# Metodologia dos treinos estruturados

> Revisão de 23/11/2026: consulte [Memória de cálculo e fontes](MEMORIA_CALCULO_E_FONTES_2026.md) para modo km, dados por esporte, relatório até/acima do limiar e distinção entre referências e regras operacionais.

Este documento descreve o motor determinístico implementado em `lib/training-structure.ts`, seus critérios de entrada e seus limites. Os parâmetros operacionais do aplicativo precisam de acompanhamento do treinador; não representam diagnóstico, liberação clínica ou garantia de resultado.

## Triagem e uso dos dados

A triagem preserva o histórico existente e reúne nascimento, peso, experiência, histórico esportivo, lesões e condições relatadas, sono, disponibilidade, modalidades, equipamentos, objetivo e provas cadastradas. Também aceita FC máxima, de repouso e de limiar, FTP, limiar de corrida, CSS e resultado recente de corrida.

O servidor valida os campos por uma lista explícita. Para gerar um plano, exige nascimento, peso atual, experiência, modalidade, horas semanais positivas e pelo menos um dia disponível. Dados opcionais desconhecidos permanecem ausentes. Dias, peso, FTP, ritmo, FC e prova não são inventados para completar o perfil. A FC de repouso deve ser menor que a máxima; a FC de limiar não pode superar a máxima informada. O motor não calcula FC máxima por `220 − idade`.

Quando há lesão atual, condição relatada, limitação ou menoridade, o plano sinaliza `requiresCoachReview`. Essa indicação exige revisão do contexto antes da execução e não substitui avaliação profissional. Dor, fadiga e sono do check-in geram alertas para o coach; não alteram automaticamente uma prescrição como se fossem um diagnóstico.

## Estrutura persistida

Cada novo treino recebe `Workout.structure`, JSON versionado com modalidade, fase, duração em segundos, avisos e passos. Os passos identificam aquecimento, principal, recuperação e desaquecimento, com duração, zona, recuperação ativa ou passiva e alvo em watts, bpm, segundos por km, segundos por 100 m ou percepção de esforço. Treinos de força têm estrutura e duração próprias, separadas do tempo aeróbico.

O plano salva o resumo em `TrainingPlan.summary`, incluindo objetivo escolhido, avisos e indicação de revisão do coach. A leitura valida a estrutura e recalcula a distribuição a partir dos passos; não confia em percentuais declarados no JSON. Planos antigos sem essa estrutura continuam acessíveis e são apresentados como legados, com informações parciais. Os minutos de uma estrutura devem corresponder à soma de seus passos.

## O que significa 80/20 neste aplicativo

A revisão de Seiler descreve uma distribuição próxima de 80% de sessões de baixa intensidade e 20% de sessões com trabalho intenso em atletas bem treinados. Classificar sessões e medir minutos em zonas são métodos diferentes. O aplicativo adota, por solicitação do produto, uma **meta operacional por tempo aeróbico ativo**, sem atribuir essa equivalência exata ao estudo. [Seiler, 2010](https://pubmed.ncbi.nlm.nih.gov/20861519/).

```text
tempo aeróbico ativo = Z1 + Z2 + Z3 + Z4 + Z5
fração intensa = (Z4 + Z5) / tempo aeróbico ativo
```

O resumo agrupa Z1–Z2 como leve, Z3 como moderado e Z4–Z5 como intenso. Aquecimento, desaquecimento e recuperação ativa entram no tempo da respectiva zona. Pausas passivas e força aparecem separadamente e não aumentam artificialmente o denominador.

Em semanas elegíveis, o motor procura aproximadamente 80% leve e 20% intenso, minimizando Z3. O percentual exibido é o resultado real dos passos. As primeiras duas semanas, recuperação, semana de prova, transição, disponibilidade insuficiente, retorno sem volume atual ou necessidade de revisão podem reduzir a intensidade até zero. O motivo é registrado; não há compensação posterior com intensidade extra. Os intervalos intensos respeitam a capacidade da sessão e pelo menos 48 horas entre os dias escolhidos para qualidade.

Esses agrupamentos de cinco zonas são convenções do aplicativo. Não equivalem automaticamente aos três domínios fisiológicos dos estudos, nem provam que o atleta executou o tempo planejado na intensidade indicada.

## Periodização e orçamento semanal

A organização em Base, Build, Peak, Race e Transition se inspira no aumento de especificidade próximo à prova discutido por Joe Friel. As durações abaixo são regras do aplicativo, não a reprodução integral de um método individualizado. [Friel: periodização](https://joefrieltraining.com/kiss-periodization/).

| Situação | Fase usada pelo motor |
| --- | --- |
| Mais de 70 dias antes da próxima prova válida | Base |
| De 22 a 70 dias antes | Build |
| De 8 a 21 dias antes | Peak |
| De 0 a 7 dias antes | Race |
| Até 14 dias depois | Transition |
| Sem prova válida | Base nas primeiras 6 semanas; depois Build |

O dia real da prova é reservado, sem substituí-lo por treino genérico. O pedido aceita de 1 a 52 semanas. No modo automático, a duração alcança a prova mais duas semanas; sem prova, utiliza 12 semanas. Se o horizonte automático superar 52 semanas, a geração solicita uma duração explícita e não trunca o ciclo silenciosamente.

O total semanal inclui força e respeita horas e dias informados, com disponibilidade de até 40 horas semanais. Há redução na quarta semana de cada ciclo, além das reduções de Peak, Race e Transition. O aumento do orçamento normal é limitado a 5% para iniciantes ou perfis que pedem revisão e a 8% nos demais casos, até a disponibilidade declarada.

O objetivo selecionado influencia a alocação e fica no resumo do plano. `pace`, 5 km, 10 km, supersprint e sprint priorizam blocos Z5 no Build, além do Peak. Objetivos de 15 km, meia maratona, maratona, 70.3 e Ironman dão peso relativo adicional de 1,6 à alocação de corrida/ciclismo no último dia das sessões planejadas, respeitando orçamento e limites de duração. Esse peso não multiplica automaticamente a duração final por 1,6. Os demais objetivos usam blocos sustentados de Z4 no Build; o Peak mantém a escolha de Z5. A escolha de uma distância não comprova prontidão para competir.

Esses limites são decisões conservadoras de produto. Não garantem prevenção de lesões. Um ensaio sobre uma progressão baseada na regra de 10% não demonstrou redução de lesões no grupo estudado; porcentagens isoladas não substituem histórico, sintomas e acompanhamento. [Buist e colaboradores](https://pubmed.ncbi.nlm.nih.gov/17940147/).

## Alvos por modalidade

### Ciclismo

Com FTP informado e equipamento compatível, o alvo é calculado em watts. O motor utiliza as cinco primeiras faixas de potência de Coggan, com piso operacional de 40% na Z1; não prescreve as zonas 6 e 7. A divisão de potência não é uma conversão direta de zonas de FC. [Coggan: níveis de treinamento por potência](https://www.trainingpeaks.com/blog/power-training-levels/).

| Zona | Faixa do FTP usada |
| --- | --- |
| Z1 | 40–55% |
| Z2 | 56–75% |
| Z3 | 76–90% |
| Z4 | 91–105% |
| Z5 | 106–120% |

Sem FTP, ou quando o atleta informa que não tem medidor de potência nem rolo compatível, o treino usa percepção de esforço e explica por que não apresenta watts.

### Corrida

O motor utiliza o limiar em `min:seg/km` informado ou registrado no teste de corrida. As faixas operacionais multiplicam o tempo por km do limiar: Z1 por 1,25–1,40; Z2 por 1,12–1,25; Z3 por 1,04–1,12; Z4 por 0,97–1,03; Z5 por 0,90–0,96. Tempos maiores significam ritmos mais lentos. Esses intervalos são parâmetros do aplicativo e precisam de revisão do treinador.

No modo de corrida por zona, havendo FC de limiar funcional válida e sem indicação de ausência de monitor, o alvo utiliza bpm a partir das faixas FTHR de [Friel, revisão de setembro de 2025](https://joefrieltraining.com/a-quick-guide-to-setting-zones/): Z1 abaixo de 78%; Z2 de 78% a menos de 87%; Z3 de 87% a menos de 94%; Z4 de 94% a menos de 100%; Z5 a partir de 100%. O aplicativo adota piso de 50% na Z1 e teto de 105% na Z5 como políticas próprias, e limita o teto à FC máxima informada. Arredondamentos são feitos em bpm. A resposta da FC demora em intervalos curtos; não se deve perseguir um número à custa de esforço excessivo. Sem os dados necessários, o alvo recorre ao limiar de pace ou à percepção, com aviso.

No modo por distância, o motor estima metros auxiliares a partir do pace válido, mantendo duração e intensidade explícitas. Sem limiar de pace, conserva os blocos por tempo/percepção e informa que não estimou distâncias. Essa estimativa não é uma medição GPS.

O aplicativo **não implementa uma avaliação validada de VDOT**. O VDOT representa condicionamento atual e serve para individualizar ritmos; meta desejada e um teste isolado de 3 km não são tratados automaticamente como esse índice. Sem limiar válido, o treino usa percepção e não inventa pace ou FC. [V.O2: definição de VDOT](https://support.vdoto2.com/v-o2-faq/).

### Natação

O CSS pode ser informado em `min:seg/100 m` ou calculado de tempos válidos de 400 m e 200 m. Com tempos em segundos:

```text
velocidade crítica (m/s) = (400 − 200) / (t400 − t200)
ritmo CSS (s/100 m) = (t400 − t200) / 2
```

O aplicativo recusa pares incoerentes e usa alvos relativos ao CSS: Z1 +12 a +20 s/100 m; Z2 +6 a +12; Z3 +3 a +6; Z4 −1 a +2; Z5 −5 a −2. As faixas são operacionais e não foram apresentadas como tabela científica universal. A orientação de aferir e praticar CSS aparece no material da [Swim Smooth](https://blog.swimsmooth.com/p/get-your-pace-right); o conceito de velocidade crítica por relação distância/tempo foi estudado por [Wakayoshi e colaboradores](https://pubmed.ncbi.nlm.nih.gov/1555562/). Sem CSS, o alvo usa percepção.

### Percepção de esforço

O aplicativo utiliza escala de 0 a 10 com alvos Z1 1–2, Z2 2–3, Z3 4–5, Z4 6–7 e Z5 8–9. Trata-se de orientação operacional, sem conversão automática para lactato, potência ou FC. Força e mobilidade seguem orientação do treinador.

## Previsão de prova

A previsão de corrida usa `tempoAlvo = tempoReferência × (distânciaAlvo / distânciaReferência)^1,06`. É a regra de Riegel, discutida no [estudo de previsão de desempenho publicado na PLOS One](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0157257), e não VDOT ou medida de VO₂máx.

O código exige distância, tempo e data de uma corrida concluída. Referência e alvo devem estar entre 3 km e 42,195 km; o ritmo de referência deve estar entre 120 e 1.200 s/km. O resultado precisa ter no máximo 180 dias, limite de atualização escolhido pelo produto. Alvo superior ao dobro da referência recebe aviso de extrapolação. Não há cálculo de tempo total de triatlo a partir de um único resultado de corrida.

O valor pressupõe preparação e esforço comparáveis. Clima, percurso, fadiga e resistência específica podem alterar o resultado; a estimativa não prescreve ritmo de treino nem garante meta.

## Integrações e acompanhamento

O link de WhatsApp prepara o texto do treino para o usuário revisar e enviar. Não envia mensagens automaticamente. A exportação FIT para Garmin é um arquivo de treino; não é sincronização direta com a conta Garmin. A tela Strava preservada continua pendente dos arquivos complementares e da configuração autorizada pelo usuário. Nenhuma dessas integrações é simulada como concluída.

O painel do coach destaca triagem incompleta, ausência de registros por pelo menos 7 dias, treinos atrasados dos últimos 7 dias, volume planejado acima da disponibilidade e sinais do último check-in: dor acima de zero, fadiga a partir de 8/10 ou sono abaixo de 6 horas. Os limiares são critérios de triagem do produto para uma conversa, não diagnóstico. A consulta é restrita a coach e limitada a 100 atletas, com aviso quando há mais registros.

## Verificação

Os testes de geração verificam orçamento, dias disponíveis, fases, soma dos passos, cálculo real da distribuição, recuperação, distanciamento da intensidade, ausência de limiares, CSS, marcação de revisão e compatibilidade de leitura de planos antigos. Os testes não demonstram eficácia clínica nem substituem a validação individual de uma prescrição. Consulte o [checklist de validação](CHECKLIST_ENDURANCE.md) para os testes de interface, exportação e dispositivos.

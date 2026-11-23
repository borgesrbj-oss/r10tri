# Como o Gotri estrutura os treinos e quais fontes utiliza

Data da revisão: 23/11/2026. Escopo: corrida, ciclismo, natação, triatlo, relatórios e exportações. O gerador é determinístico, não um modelo que lê estudos a cada clique. A IA auxiliou a análise do código e a pesquisa das referências abaixo. Não existe ensaio clínico de validação do Gotri.

## Fluxo da decisão

1. Validar triagem e objetivo no servidor: modalidade, idade informada, experiência, disponibilidade, volume recente específico, agenda e referências de intensidade. Para maratona, exigir data completa e duração do longão recente. Não substituir campos ausentes por valores fisiológicos presumidos.
2. Tratar conflitos de agenda: um dia com corrida/ciclismo/natação marcada e limite zero exige revisão explícita. Não mover silenciosamente uma modalidade para outro dia.
3. Calcular minutos iniciais, alocar dentro do teto de cada dia, semana, esporte e sessão e aplicar as fases conforme a data da prova.
4. Definir sessões apropriadas ao esporte. Corrida: rodagem, longo e alternância entre tiros, ritmo e fartlek quando o nível, a fase e as restrições permitirem. Ciclismo: endurance, cadência e intervalos; natação: técnica, séries, pausas e CSS; triatlo: combinar as modalidades sem ultrapassar o limite agregado e inserir bricks quando permitidos.
5. Estruturar aquecimento, trabalho, recuperação e desaquecimento; salvar os blocos e a referência de intensidade junto do plano. Recalcular totais a partir desses blocos, inclusive nas exportações.
6. Exibir a memória de cálculo e os avisos. Uma lesão/limitação relatada, dor recente ou falta de evidência de recuperação pode bloquear intensidade/progressão. Isso é uma política conservadora do produto, não um diagnóstico.

## Contas efetivamente implementadas

| Cálculo | Fórmula / regra | Natureza |
|---|---|---|
| Capacidade semanal | horas disponíveis × 60 | Conversão de unidade |
| Base por esporte | minutos recentes de corrida, ciclismo e/ou natação; somar apenas os esportes do plano | Dado informado, não confundir com horas de todas as modalidades |
| Volume inicial | menor entre capacidade e base declarada, multiplicado pelo fator de feedback | Política do app |
| Progressão | orçamento anterior × (1 + crescimento), limitado pela disponibilidade e pelos tetos | Crescimento até 5% somente com evidência de tolerância; zero sem essa evidência ou diante de restrição. Não é regra científica universal |
| Recuperação | semana 4 de cada bloco: fator 0,65 | Política do app, não coeficiente retirado de um estudo |
| Fases finais | Peak 0,75; Race 0,45; Transition 0,35 | Política do app; depende da data completa da prova |
| Longão de corrida | parte do maior longão recente; progressão limitada, teto do dia e redução na recuperação/taper | Não existe salto automático de 12 km para um longão padrão de maratona |
| Corrida por km | metros = segundos previstos ÷ pace médio do bloco (s/km) × 1.000; arredondamento de 10 m | Conversão baseada em pace de limiar medido; tempo permanece estimativa para carga |
| Ciclismo | watts = FTP × percentual da zona | Sistema de níveis de Coggan; FTP é referência funcional |
| CSS | (tempo dos 400 m − tempo dos 200 m) ÷ 2 = segundos/100 m | Método de velocidade crítica com duas distâncias |
| Distância de natação | segundos ÷ pace (s/100 m) × 100; arredondar à piscina de 25/50 m | Conversão de unidade e limite de piscina |
| Distribuição | somar segundos ativos por alvo de cada bloco; converter para minutos e dividir pela soma do ciclo | Não usar média simples de percentuais semanais |

O teto de 12 semanas para um bloco específico de maratona de corredor avançado com base e longão declarados, e as referências de 16 semanas para outros cenários, são filtros operacionais. Não demonstram prontidão para 42,195 km nem substituem a avaliação do histórico.

## Zonas: o que é referência e o que é adaptação do código

**Corrida:** o app não implementa as tabelas licenciadas VDOT de Jack Daniels. Usa pace de limiar informado/testado e multiplicadores operacionais: Z1 1,25–1,40; Z2 1,12–1,25; Z3 1,04–1,12; Z4 0,97–1,03; Z5 0,90–0,96, em segundos/km. Como menor pace significa maior velocidade, inverter o sentido ao classificar intensidade. Nas novas sessões marcadas para o relatório, blocos de corrida Z4 são prescritos no próprio valor do limiar para não misturar abaixo/acima numa faixa. FC usa uma adaptação própria em cinco faixas, sem atribuir literalmente essas faixas às sete zonas Friel. Sem dados medidos, PSE é operacional e não comprova posição fisiológica relativa ao limiar.

**Ciclismo:** Z1 usa piso operacional de 40% e teto 55%; Z2 56–75%; Z3 76–90%; Z4 91–105%; Z5 106–120% do FTP. A faixa Z4 cruza 100%: não é correto contabilizar todo esse bloco como exatamente no limiar. O relatório o identifica como indeterminado quando o alvo cruza a referência.

**Natação:** CSS serve como referência operacional por 100 m. Os acréscimos/reduções de segundos para cinco zonas são escolhas do app, não uma tabela universal do Swim Smooth. CSS e FTP não são exames equivalentes de lactato; relatórios por esporte permanecem separados.

## O 80/20 solicitado

Definição de produto desta revisão: **80% até o limiar, inclusive / 20% acima**. Os minutos no limiar aparecem separados dentro dos 80%. Isso não é automaticamente a mesma definição de treinamento polarizado da literatura (frequentemente três zonas, com limiares diferentes, ou contagem por sessões).

Aquecimento, desaquecimento e recuperação ativa contam segundo os alvos prescritos. Pausa passiva, força e prova não entram. Alvo que cruza o limiar ou depende apenas de PSE sem referência mensurada fica **indeterminado**. Dados ausentes não são divididos artificialmente em 80/20. O relatório calcula o percentual do ciclo pelos minutos somados e só declara a meta confirmada se os totais a atingirem. Não adiciona intensidade só para fechar a conta.

## Exemplos de cálculo — dados fictícios, não plano do Ricardo

- Corrida com limiar 5:00/km: 300 s/km. Z2 do app: 336–375 s/km, ou 5:36–6:15/km. Em um bloco de 20 min, distância estimada = 1.200 ÷ 355,5 × 1.000 ≈ 3.380 m após arredondamento. Essa faixa é parâmetro operacional relativo ao limiar, não uma saída VDOT.
- Ciclismo com FTP 200 W: Z2 = 200 × 0,56 até 200 × 0,75 = **112–150 W**.
- Natação com 400 m em 8:00 e 200 m em 3:40: (480 − 220) ÷ 2 = **130 s/100 m = 2:10/100 m de CSS**.
- Sessão de corrida de 60 min com 10 min exatamente no limiar e 50 min abaixo: abaixo 50; no limiar 10; acima 0. Resultado até/acima = **100% / 0%**, não 80/20. Se os 10 min forem acima do limiar: **83,33% / 16,67%**.

## Estudos, artigos e exemplos consultados

1. **Stöggl & Sperlich, 2015 — The training intensity distribution among well-trained and elite endurance athletes.** Revisão científica. Sustenta a discussão sobre distribuição e suas limitações; não valida automaticamente um único percentual para cada pessoa. https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2015.00295/full
2. **Consenso COI, 2016 — How much is too much? Part 1.** Relação carga/capacidade, individualização e risco. Não fundamenta um aumento universal de 5% nem garante prevenção de lesões. https://bjsm.bmj.com/content/50/17/1030
3. **Andrew Coggan — Power Training Levels.** Artigo do autor na TrainingPeaks. Fonte dos níveis percentuais de potência. https://www.trainingpeaks.com/blog/power-training-levels/
4. **Joe Friel — Quick Guide to Setting Training Zones.** Artigo técnico do treinador: limiar e diferenças por esporte. Referência conceitual; as cinco faixas operacionais do Gotri não são reprodução literal. https://www.trainingpeaks.com/learn/articles/joe-friel-s-quick-guide-to-setting-zones/
5. **Swim Smooth — CSS Challenge / metodologia.** Exemplos de testes 400/200 m e uso do CSS. https://blog.swimsmooth.com/p/just-how-much-faster-and-smoother e https://swimsmooth.com/method
6. **Boston Athletic Association — Boston Marathon Training.** Exemplos de planos com sessões leves, longões e taper; não copiados para o cadastro de um atleta. https://www.baa.org/races/boston-marathon/info-for-athletes/boston-marathon-training/
7. **V.O2 / Jack Daniels — calculadora oficial.** Referência comparativa de ritmos e desempenho, não implementada como se fosse uma licença VDOT. https://new.vdoto2.com/calculator

As fontes são identificadas no app, mas não são um mecanismo de busca em tempo real. Não foram adquiridos ou copiados planos pagos. Ajustes por clima, altimetria, resposta individual, técnica e retorno a lesões precisam de dados e revisão profissional; o app não conhece esses fatores se não estiverem registrados.

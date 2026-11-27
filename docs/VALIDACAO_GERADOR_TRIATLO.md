# Validação do gerador de triatlo

Este relatório registra os resultados da Etapa 4. A revisão seguinte acrescentou regressões de agenda parcial, estímulos variados e prévia antes de gravar em `tests/plan-generate.test.ts` e `tests/triathlon-generator.test.ts`.

A comparação usa o mesmo conjunto fictício antes e depois. O motor anterior é o commit d716297. A matriz usa a semente 20261123, com 10 perfis por combinação de quatro formatos e três níveis. São seis dias disponíveis, variando o dia indisponível, com teto sorteado de 6 a 15 horas. Histórico, referências e metas são sintéticos. Os agrupamentos de semana da versão nova são usados como referência comum para comparar os dois resultados.

| Medição | Antes | Depois |
| --- | ---: | ---: |
| Planos conformes por semana e ciclo | 0/120 | 120/120 |
| Ciclos conformes | 0/120 | 120/120 |
| Semanas conformes | 748/1980 | 1980/1980 |

As tabelas usam Z1–Z2 / Z3 / Z4–Z5 nesta ordem. A coluna de volume mostra o tempo total de treinos após os limites, e a coluna de ativo exclui força e pausas. Percentuais são arredondados para leitura. O teste usa os segundos originais.

O calendário abaixo contém exemplos fictícios gerados pelo motor. Os tempos de prova foram avaliados com faixas também fictícias. Cadastre faixas fundamentadas para cada atleta real e revise o volume com o treinador, principalmente após descargas repetidas.

## Sprint · iniciante

Início em 2027-01-04, prova em 2027-03-28. Histórico de 4,58 h/semana e teto de 12 h/semana. FTP 184 W, CSS 2:07/100 m e limiar de corrida 5:47/km.

### Intensidade por semana

| Semana | Fase | Tempo ativo antes | Zonas antes | Volume depois | Tempo ativo depois | Zonas depois |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | regular | 4h14min40s | 100% / 0% / 0% | 275 min | 4h18min00s | 77,13% / 0% / 22,87% |
| 2 | regular | 4h26min32s | 100% / 0% / 0% | 288 min | 4h28min20s | 77,08% / 0% / 22,92% |
| 3 | descarga | 4h39min00s | 100% / 0% / 0% | 187 min | 3h04min20s | 90,24% / 0% / 9,76% |
| 4 | regular | 3h21min20s | 100% / 0% / 0% | 196 min | 3h03min20s | 77,09% / 0% / 22,91% |
| 5 | regular | 4h52min20s | 90,08% / 0% / 9,92% | 205 min | 3h12min20s | 77,12% / 0% / 22,88% |
| 6 | descarga | 4h59min20s | 90,14% / 0% / 9,86% | 133 min | 2h11min00s | 90,08% / 0% / 9,92% |
| 7 | regular | 5h02min40s | 90,09% / 0% / 9,91% | 139 min | 2h16min40s | 77,32% / 0% / 22,68% |
| 8 | regular | 3h51min32s | 100% / 0% / 0% | 145 min | 2h22min20s | 77,52% / 0% / 22,48% |
| 9 | descarga | 4h14min00s | 90,16% / 0% / 9,84% | 94 min | 1h32min40s | 100% / 0% / 0% |
| 10 | regular | 4h26min20s | 90,05% / 0% / 9,95% | 98 min | 1h36min20s | 77,16% / 0% / 22,84% |
| 11 | polimento | 2h56min00s | 100% / 0% / 0% | 58 min | 57min00s | 90,35% / 0% / 9,65% |
| 12 | polimento | 2h54min40s | 100% / 0% / 0% | 49 min | 49min00s | 90,82% / 0% / 9,18% |
| **Ciclo** |  | 49h58min24s | 95,33% / 0% / 4,67% | 1867 min | 29h51min20s | 81,44% / 0% / 18,56% |

### Metas simuladas por trecho

| Trecho | Tempo | Faixa cadastrada para o teste | Alvo |
| --- | ---: | ---: | --- |
| Natação | 17min08s | 15min25s a 18min51s | 2:17/100 m |
| T1 | 2min54s | 2min36s a 3min12s | Transição |
| Ciclismo | 46min09s | 41min32s a 50min46s | 26 km/h · 147 W |
| T2 | 1min43s | 1min32s a 1min54s | Transição |
| Corrida | 31min45s | 28min34s a 34min56s | 6:21/km após o pedal |
| **Soma** | **1h39min39s** | | |

Meta informada de 1h39min39s e diferença de 0%.

### Calendário completo

<details>
<summary>Semana 1 · regular · 275 min</summary>

- **segunda-feira, 04/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 13 min.
  - Aquec. 1min57s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 8min27s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min18s passivo · Volta à calma 1min18s Z1 (Percepção 2–3/10, confortável e conversacional).
- **segunda-feira, 04/01** · Técnica · Natação · Base · Aeróbico e técnica · 24 min.
  - Aquec. 3min36s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min36s Z1 (2:19–2:27/100 m) · Rec. 2min24s Z1 (2:19–2:27/100 m) · Volta à calma 2min24s Z1 (2:19–2:27/100 m).
- **terça-feira, 05/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 67 min.
  - Aquec. 10min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Principal 9min18s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 6min42s Z1 (74–101 W (40–55% do FTP)).
- **quarta-feira, 06/01** · Descanso.
- **quinta-feira, 07/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (7:14–8:06/km) · Principal 26min00s Z2 (6:29–7:14/km) · Rec. 4min00s Z1 (7:14–8:06/km) · Volta à calma 4min00s Z1 (7:14–8:06/km).
- **sexta-feira, 08/01** · Técnica · Natação · Base · Aeróbico e técnica · 24 min.
  - Aquec. 3min36s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min36s Z1 (2:19–2:27/100 m) · Rec. 2min24s Z1 (2:19–2:27/100 m) · Volta à calma 2min24s Z1 (2:19–2:27/100 m).
- **sábado, 09/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 67 min.
  - Aquec. 10min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min45s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min45s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min45s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min45s Z4 (167–193 W (91–105% do FTP)) · Principal 14min18s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 6min42s Z1 (74–101 W (40–55% do FTP)).
- **domingo, 10/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (7:14–8:06/km) · Principal 26min00s Z2 (6:29–7:14/km) · Rec. 4min00s Z1 (7:14–8:06/km) · Volta à calma 4min00s Z1 (7:14–8:06/km).

</details>

<details>
<summary>Semana 2 · regular · 288 min</summary>

- **segunda-feira, 11/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 70 min.
  - Aquec. 10min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Principal 12min00s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 7min00s Z1 (74–101 W (40–55% do FTP)).
- **segunda-feira, 11/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 15 min.
  - Aquec. 2min15s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 9min45s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min30s passivo · Volta à calma 1min30s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 12/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (7:14–8:06/km) · Principal 26min00s Z2 (6:29–7:14/km) · Rec. 4min00s Z1 (7:14–8:06/km) · Volta à calma 4min00s Z1 (7:14–8:06/km).
- **quarta-feira, 13/01** · Descanso.
- **quinta-feira, 14/01** · Endurance leve · Natação · Base · Aeróbico e técnica · 27 min.
  - Aquec. 4min03s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min13s Z1 (2:19–2:27/100 m) · Rec. 2min42s Z1 (2:19–2:27/100 m) · Volta à calma 2min42s Z1 (2:19–2:27/100 m).
- **sexta-feira, 15/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 70 min.
  - Aquec. 10min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min22s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min22s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min22s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min24s Z4 (167–193 W (91–105% do FTP)) · Principal 14min30s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 7min00s Z1 (74–101 W (40–55% do FTP)).
- **sábado, 16/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (7:14–8:06/km) · Principal 26min00s Z2 (6:29–7:14/km) · Rec. 4min00s Z1 (7:14–8:06/km) · Volta à calma 4min00s Z1 (7:14–8:06/km).
- **domingo, 17/01** · Endurance leve · Natação · Base · Aeróbico e técnica · 26 min.
  - Aquec. 3min54s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 0min34s Z1 (2:19–2:27/100 m) · Rec. 2min36s Z1 (2:19–2:27/100 m) · Volta à calma 2min36s Z1 (2:19–2:27/100 m).

</details>

<details>
<summary>Semana 3 · descarga · 187 min</summary>

- **segunda-feira, 18/01** · Recuperação · Corrida · Base · Recuperação · 28 min.
  - Aquec. 4min12s Z1 (7:14–8:06/km) · Principal 18min12s Z1 (7:14–8:06/km) · Rec. 2min48s Z1 (7:14–8:06/km) · Volta à calma 2min48s Z1 (7:14–8:06/km).
- **terça-feira, 19/01** · Técnica · Natação · Base · Recuperação · 17 min.
  - Aquec. 2min33s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min43s Z1 (2:19–2:27/100 m) · Rec. 1min42s Z1 (2:19–2:27/100 m) · Volta à calma 1min42s Z1 (2:19–2:27/100 m).
- **quarta-feira, 20/01** · Descanso.
- **quinta-feira, 21/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 49 min.
  - Aquec. 7min21s Z1 (74–101 W (40–55% do FTP)) · Principal 6min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min00s Z4 (167–193 W (91–105% do FTP)) · Principal 12min45s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 4min54s Z1 (74–101 W (40–55% do FTP)).
- **sexta-feira, 22/01** · Recuperação · Corrida · Base · Recuperação · 28 min.
  - Aquec. 4min12s Z1 (7:14–8:06/km) · Principal 18min12s Z1 (7:14–8:06/km) · Rec. 2min48s Z1 (7:14–8:06/km) · Volta à calma 2min48s Z1 (7:14–8:06/km).
- **sábado, 23/01** · Técnica · Natação · Base · Recuperação · 17 min.
  - Aquec. 2min33s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min43s Z1 (2:19–2:27/100 m) · Rec. 1min42s Z1 (2:19–2:27/100 m) · Volta à calma 1min42s Z1 (2:19–2:27/100 m).
- **domingo, 24/01** · Endurance leve · Ciclismo · Base · Recuperação · 48 min.
  - Aquec. 7min12s Z1 (74–101 W (40–55% do FTP)) · Principal 31min12s Z2 (103–138 W (56–75% do FTP)) · Rec. 4min48s Z1 (74–101 W (40–55% do FTP)) · Volta à calma 4min48s Z1 (74–101 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 4 · regular · 196 min</summary>

- **segunda-feira, 25/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **segunda-feira, 25/01** · Endurance leve · Natação · Base · Aeróbico e técnica · 16 min.
  - Aquec. 2min24s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min04s Z1 (2:19–2:27/100 m) · Rec. 1min36s Z1 (2:19–2:27/100 m) · Volta à calma 1min36s Z1 (2:19–2:27/100 m).
- **terça-feira, 26/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 49 min.
  - Aquec. 7min21s Z1 (74–101 W (40–55% do FTP)) · Principal 6min52s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min52s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min52s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min54s Z4 (167–193 W (91–105% do FTP)) · Principal 0min15s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 4min54s Z1 (74–101 W (40–55% do FTP)).
- **quarta-feira, 27/01** · Descanso.
- **quinta-feira, 28/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 28 min.
  - Aquec. 4min12s Z1 (7:14–8:06/km) · Principal 18min12s Z2 (6:29–7:14/km) · Rec. 2min48s Z1 (7:14–8:06/km) · Volta à calma 2min48s Z1 (7:14–8:06/km).
- **sexta-feira, 29/01** · Endurance leve · Natação · Base · Aeróbico e técnica · 16 min.
  - Aquec. 2min24s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min04s Z1 (2:19–2:27/100 m) · Rec. 1min36s Z1 (2:19–2:27/100 m) · Volta à calma 1min36s Z1 (2:19–2:27/100 m).
- **sábado, 30/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 49 min.
  - Aquec. 7min21s Z1 (74–101 W (40–55% do FTP)) · Principal 7min15s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min15s Z4 (167–193 W (91–105% do FTP)) · Principal 19min15s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 4min54s Z1 (74–101 W (40–55% do FTP)).
- **domingo, 31/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 28 min.
  - Aquec. 4min12s Z1 (7:14–8:06/km) · Principal 18min12s Z2 (6:29–7:14/km) · Rec. 2min48s Z1 (7:14–8:06/km) · Volta à calma 2min48s Z1 (7:14–8:06/km).

</details>

<details>
<summary>Semana 5 · regular · 205 min</summary>

- **segunda-feira, 01/02** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 52 min.
  - Aquec. 7min48s Z1 (74–101 W (40–55% do FTP)) · Principal 7min30s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min30s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min30s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min30s Z4 (167–193 W (91–105% do FTP)) · Volta à calma 5min12s Z1 (74–101 W (40–55% do FTP)).
- **segunda-feira, 01/02** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 02/02** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 29 min.
  - Aquec. 4min21s Z1 (7:14–8:06/km) · Principal 18min51s Z2 (6:29–7:14/km) · Rec. 2min54s Z1 (7:14–8:06/km) · Volta à calma 2min54s Z1 (7:14–8:06/km).
- **quarta-feira, 03/02** · Descanso.
- **quinta-feira, 04/02** · Técnica · Natação · Build · Aeróbico e técnica · 17 min.
  - Aquec. 2min33s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min43s Z1 (2:19–2:27/100 m) · Rec. 1min42s Z1 (2:19–2:27/100 m) · Volta à calma 1min42s Z1 (2:19–2:27/100 m).
- **sexta-feira, 05/02** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 51 min.
  - Aquec. 7min39s Z1 (74–101 W (40–55% do FTP)) · Principal 7min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min00s Z4 (167–193 W (91–105% do FTP)) · Principal 21min15s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 5min06s Z1 (74–101 W (40–55% do FTP)).
- **sábado, 06/02** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 29 min.
  - Aquec. 4min21s Z1 (7:14–8:06/km) · Principal 18min51s Z2 (6:29–7:14/km) · Rec. 2min54s Z1 (7:14–8:06/km) · Volta à calma 2min54s Z1 (7:14–8:06/km).
- **domingo, 07/02** · Técnica · Natação · Build · Aeróbico e técnica · 17 min.
  - Aquec. 2min33s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min43s Z1 (2:19–2:27/100 m) · Rec. 1min42s Z1 (2:19–2:27/100 m) · Volta à calma 1min42s Z1 (2:19–2:27/100 m).

</details>

<details>
<summary>Semana 6 · descarga · 133 min</summary>

- **segunda-feira, 08/02** · Recuperação · Corrida · Build · Recuperação · 20 min.
  - Aquec. 3min00s Z1 (7:14–8:06/km) · Principal 13min00s Z1 (7:14–8:06/km) · Rec. 2min00s Z1 (7:14–8:06/km) · Volta à calma 2min00s Z1 (7:14–8:06/km).
- **terça-feira, 09/02** · Endurance leve · Natação · Build · Recuperação · 12 min.
  - Aquec. 1min48s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 0min48s Z1 (2:19–2:27/100 m) · Rec. 1min12s Z1 (2:19–2:27/100 m) · Volta à calma 1min12s Z1 (2:19–2:27/100 m).
- **quarta-feira, 10/02** · Descanso.
- **quinta-feira, 11/02** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 35 min.
  - Aquec. 5min15s Z1 (74–101 W (40–55% do FTP)) · Principal 6min30s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 6min30s Z4 (167–193 W (91–105% do FTP)) · Principal 10min15s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 3min30s Z1 (74–101 W (40–55% do FTP)).
- **sexta-feira, 12/02** · Recuperação · Corrida · Build · Recuperação · 20 min.
  - Aquec. 3min00s Z1 (7:14–8:06/km) · Principal 13min00s Z1 (7:14–8:06/km) · Rec. 2min00s Z1 (7:14–8:06/km) · Volta à calma 2min00s Z1 (7:14–8:06/km).
- **sábado, 13/02** · Endurance leve · Natação · Build · Recuperação · 12 min.
  - Aquec. 1min48s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 0min48s Z1 (2:19–2:27/100 m) · Rec. 1min12s Z1 (2:19–2:27/100 m) · Volta à calma 1min12s Z1 (2:19–2:27/100 m).
- **domingo, 14/02** · Endurance leve · Ciclismo · Build · Recuperação · 34 min.
  - Aquec. 5min06s Z1 (74–101 W (40–55% do FTP)) · Principal 22min06s Z2 (103–138 W (56–75% do FTP)) · Rec. 3min24s Z1 (74–101 W (40–55% do FTP)) · Volta à calma 3min24s Z1 (74–101 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 7 · regular · 139 min</summary>

- **segunda-feira, 15/02** · Técnica · Natação · Build · Aeróbico e técnica · 26 min.
  - Aquec. 3min54s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 0min34s Z1 (2:19–2:27/100 m) · Rec. 2min36s Z1 (2:19–2:27/100 m) · Volta à calma 2min36s Z1 (2:19–2:27/100 m).
- **terça-feira, 16/02** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 73 min.
  - Aquec. 10min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min45s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min45s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min45s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min45s Z4 (167–193 W (91–105% do FTP)) · Principal 15min42s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 7min18s Z1 (74–101 W (40–55% do FTP)).
- **quarta-feira, 17/02** · Descanso.
- **quinta-feira, 18/02** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (7:14–8:06/km) · Principal 26min00s Z2 (6:29–7:14/km) · Rec. 4min00s Z1 (7:14–8:06/km) · Volta à calma 4min00s Z1 (7:14–8:06/km).
- **sexta-feira, 19/02** · Descanso.
- **sábado, 20/02** · Descanso.
- **domingo, 21/02** · Descanso.

</details>

<details>
<summary>Semana 8 · regular · 145 min</summary>

- **segunda-feira, 22/02** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 75 min.
  - Aquec. 10min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 8min00s Z4 (167–193 W (91–105% do FTP)) · Principal 16min30s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 7min30s Z1 (74–101 W (40–55% do FTP)).
- **terça-feira, 23/02** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (7:14–8:06/km) · Principal 26min00s Z2 (6:29–7:14/km) · Rec. 4min00s Z1 (7:14–8:06/km) · Volta à calma 4min00s Z1 (7:14–8:06/km).
- **quarta-feira, 24/02** · Descanso.
- **quinta-feira, 25/02** · Endurance leve · Natação · Build · Aeróbico e técnica · 30 min.
  - Aquec. 4min30s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 0min50s Z1 (2:19–2:27/100 m) · Rec. 3min00s Z1 (2:19–2:27/100 m) · Volta à calma 3min00s Z1 (2:19–2:27/100 m).
- **sexta-feira, 26/02** · Descanso.
- **sábado, 27/02** · Descanso.
- **domingo, 28/02** · Descanso.

</details>

<details>
<summary>Semana 9 · descarga · 94 min</summary>

- **segunda-feira, 01/03** · Recuperação · Corrida · Build · Recuperação · 14 min.
  - Aquec. 2min06s Z1 (7:14–8:06/km) · Principal 9min06s Z1 (7:14–8:06/km) · Rec. 1min24s Z1 (7:14–8:06/km) · Volta à calma 1min24s Z1 (7:14–8:06/km).
- **terça-feira, 02/03** · Técnica · Natação · Build · Recuperação · 10 min.
  - Aquec. 1min30s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min50s Z1 (2:19–2:27/100 m) · Rec. 1min00s Z1 (2:19–2:27/100 m) · Volta à calma 1min00s Z1 (2:19–2:27/100 m).
- **quarta-feira, 03/03** · Descanso.
- **quinta-feira, 04/03** · Endurance leve · Ciclismo · Build · Recuperação · 24 min.
  - Aquec. 3min36s Z1 (74–101 W (40–55% do FTP)) · Principal 15min36s Z2 (103–138 W (56–75% do FTP)) · Rec. 2min24s Z1 (74–101 W (40–55% do FTP)) · Volta à calma 2min24s Z1 (74–101 W (40–55% do FTP)).
- **sexta-feira, 05/03** · Recuperação · Corrida · Build · Recuperação · 13 min.
  - Aquec. 1min57s Z1 (7:14–8:06/km) · Principal 8min27s Z1 (7:14–8:06/km) · Rec. 1min18s Z1 (7:14–8:06/km) · Volta à calma 1min18s Z1 (7:14–8:06/km).
- **sábado, 06/03** · Técnica · Natação · Build · Recuperação · 10 min.
  - Aquec. 1min30s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 1min50s Z1 (2:19–2:27/100 m) · Rec. 1min00s Z1 (2:19–2:27/100 m) · Volta à calma 1min00s Z1 (2:19–2:27/100 m).
- **domingo, 07/03** · Endurance leve · Ciclismo · Build · Recuperação · 23 min.
  - Aquec. 3min27s Z1 (74–101 W (40–55% do FTP)) · Principal 14min57s Z2 (103–138 W (56–75% do FTP)) · Rec. 2min18s Z1 (74–101 W (40–55% do FTP)) · Volta à calma 2min18s Z1 (74–101 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 10 · regular · 98 min</summary>

- **segunda-feira, 08/03** · Endurance leve · Natação · Build · Aeróbico e técnica · 18 min.
  - Aquec. 2min42s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 0min02s Z1 (2:19–2:27/100 m) · Rec. 1min48s Z1 (2:19–2:27/100 m) · Volta à calma 1min48s Z1 (2:19–2:27/100 m).
- **terça-feira, 09/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 51 min.
  - Aquec. 7min39s Z1 (74–101 W (40–55% do FTP)) · Principal 7min20s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min20s Z4 (167–193 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–101 W (40–55% do FTP)) · Principal 7min20s Z4 (167–193 W (91–105% do FTP)) · Principal 10min15s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 5min06s Z1 (74–101 W (40–55% do FTP)).
- **quarta-feira, 10/03** · Descanso.
- **quinta-feira, 11/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 29 min.
  - Aquec. 4min21s Z1 (7:14–8:06/km) · Principal 18min51s Z2 (6:29–7:14/km) · Rec. 2min54s Z1 (7:14–8:06/km) · Volta à calma 2min54s Z1 (7:14–8:06/km).
- **sexta-feira, 12/03** · Descanso.
- **sábado, 13/03** · Descanso.
- **domingo, 14/03** · Descanso.

</details>

<details>
<summary>Semana 11 · polimento · 58 min</summary>

- **segunda-feira, 15/03** · Intervalos longos · Ciclismo · Peak · Intervalos estruturados · 30 min.
  - Aquec. 5min00s Z1 (74–101 W (40–55% do FTP)) · Principal 1min22s Z4 (167–193 W (91–105% do FTP)) · Rec. 1min30s Z1 (74–101 W (40–55% do FTP)) · Principal 1min22s Z4 (167–193 W (91–105% do FTP)) · Rec. 1min30s Z1 (74–101 W (40–55% do FTP)) · Principal 1min22s Z4 (167–193 W (91–105% do FTP)) · Rec. 1min30s Z1 (74–101 W (40–55% do FTP)) · Principal 1min24s Z4 (167–193 W (91–105% do FTP)) · Principal 11min00s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 4min00s Z1 (74–101 W (40–55% do FTP)).
- **terça-feira, 16/03** · Rodagem leve · Corrida · Peak · Aeróbico e técnica · 17 min.
  - Aquec. 2min33s Z1 (7:14–8:06/km) · Principal 11min03s Z2 (6:29–7:14/km) · Rec. 1min42s Z1 (7:14–8:06/km) · Volta à calma 1min42s Z1 (7:14–8:06/km).
- **quarta-feira, 17/03** · Descanso.
- **quinta-feira, 18/03** · Técnica · Natação · Peak · Aeróbico e técnica · 11 min.
  - Aquec. 1min39s Z1 (2:19–2:27/100 m) · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:19–2:27/100 m) · Rec. 0min20s passivo · Principal 0min09s Z1 (2:19–2:27/100 m) · Rec. 1min06s Z1 (2:19–2:27/100 m) · Volta à calma 1min06s Z1 (2:19–2:27/100 m).
- **sexta-feira, 19/03** · Descanso.
- **sábado, 20/03** · Descanso.
- **domingo, 21/03** · Descanso.

</details>

<details>
<summary>Semana 12 · polimento · 49 min</summary>

- **segunda-feira, 22/03** · Rodagem leve · Corrida · Race · Aeróbico e técnica · 19 min.
  - Aquec. 2min51s Z1 (7:14–8:06/km) · Principal 12min21s Z2 (6:29–7:14/km) · Rec. 1min54s Z1 (7:14–8:06/km) · Volta à calma 1min54s Z1 (7:14–8:06/km).
- **terça-feira, 23/03** · Descanso.
- **quarta-feira, 24/03** · Descanso.
- **quinta-feira, 25/03** · Intervalos longos · Ciclismo · Race · Intervalos estruturados · 30 min.
  - Aquec. 5min00s Z1 (74–101 W (40–55% do FTP)) · Principal 1min30s Z4 (167–193 W (91–105% do FTP)) · Rec. 1min30s Z1 (74–101 W (40–55% do FTP)) · Principal 1min30s Z4 (167–193 W (91–105% do FTP)) · Rec. 1min30s Z1 (74–101 W (40–55% do FTP)) · Principal 1min30s Z4 (167–193 W (91–105% do FTP)) · Principal 13min30s Z2 (103–138 W (56–75% do FTP)) · Volta à calma 4min00s Z1 (74–101 W (40–55% do FTP)).
- **sexta-feira, 26/03** · Descanso.
- **sábado, 27/03** · Descanso.
- **domingo, 28/03** · Prova-alvo, registrada à parte.

</details>

## 70.3 · intermediário

Início em 2027-01-04, prova em 2027-04-25. Histórico de 7,55 h/semana e teto de 11 h/semana. FTP 186 W, CSS 2:13/100 m e limiar de corrida 5:08/km.

### Intensidade por semana

| Semana | Fase | Tempo ativo antes | Zonas antes | Volume depois | Tempo ativo depois | Zonas depois |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | regular | 7h00min40s | 100% / 0% / 0% | 453 min | 7h09min20s | 77,41% / 0% / 22,59% |
| 2 | regular | 7h29min00s | 100% / 0% / 0% | 475 min | 7h34min20s | 77,11% / 0% / 22,89% |
| 3 | regular | 7h47min00s | 80,73% / 0% / 19,27% | 498 min | 7h50min23s | 77,04% / 0% / 22,96% |
| 4 | descarga | 5h39min00s | 100% / 0% / 0% | 323 min | 5h23min00s | 90,09% / 0% / 9,91% |
| 5 | regular | 8h05min10s | 81,45% / 0% / 18,55% | 339 min | 5h21min00s | 77,1% / 0% / 22,9% |
| 6 | regular | 8h42min00s | 82,76% / 0% / 17,24% | 355 min | 5h41min00s | 77,13% / 0% / 22,87% |
| 7 | regular | 8h55min00s | 83,18% / 0% / 16,82% | 372 min | 5h54min32s | 77,15% / 0% / 22,85% |
| 8 | descarga | 6h31min00s | 100% / 0% / 0% | 241 min | 4h01min00s | 90,04% / 0% / 9,96% |
| 9 | regular | 9h24min01s | 84,04% / 0% / 15,96% | 253 min | 3h59min40s | 77,05% / 0% / 22,95% |
| 10 | regular | 10h01min00s | 85,02% / 0% / 14,98% | 265 min | 4h15min00s | 77,06% / 0% / 22,94% |
| 11 | regular | 10h12min00s | 85,29% / 0% / 14,71% | 278 min | 4h23min00s | 77,19% / 0% / 22,81% |
| 12 | descarga | 7h33min00s | 100% / 0% / 0% | 180 min | 3h00min00s | 90% / 0% / 10% |
| 13 | regular | 8h06min42s | 90,03% / 0% / 9,97% | 189 min | 2h56min20s | 77,03% / 0% / 22,97% |
| 14 | regular | 8h41min00s | 90,4% / 0% / 9,6% | 198 min | 3h08min00s | 77,13% / 0% / 22,87% |
| 15 | polimento | 5h37min40s | 100% / 0% / 0% | 118 min | 1h56min20s | 90,11% / 0% / 9,89% |
| 16 | polimento | 5h45min00s | 100% / 0% / 0% | 99 min | 1h39min00s | 90,4% / 0% / 9,6% |
| **Ciclo** |  | 125h29min13s | 90,32% / 0% / 9,68% | 4636 min | 74h11min55s | 79,93% / 0% / 20,07% |

### Metas simuladas por trecho

| Trecho | Tempo | Faixa cadastrada para o teste | Alvo |
| --- | ---: | ---: | --- |
| Natação | 45min17s | 40min45s a 49min49s | 2:23/100 m |
| T1 | 2min24s | 2min09s a 2min39s | Transição |
| Ciclismo | 3h20min00s | 3h00min00s a 3h40min01s | 27 km/h · 149 W |
| T2 | 1min56s | 1min44s a 2min08s | Transição |
| Corrida | 2h00min16s | 1h48min14s a 2h12min18s | 5:42/km após o pedal |
| **Soma** | **6h09min53s** | | |

Meta informada de 6h09min53s e diferença de 0%.

### Calendário completo

<details>
<summary>Semana 1 · regular · 453 min</summary>

- **segunda-feira, 04/01** · Descanso.
- **terça-feira, 05/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 18 min.
  - Aquec. 2min42s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 11min42s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min48s passivo · Volta à calma 1min48s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 05/01** · Intervalos longos · Natação · Base · Intervalos estruturados · 39 min.
  - Aquec. 5min51s Z1 (2:25–2:33/100 m) · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Principal 2min55s Z2 (2:19–2:25/100 m) · Volta à calma 3min54s Z1 (2:25–2:33/100 m).
- **quarta-feira, 06/01** · Cadência · Ciclismo · Base · Aeróbico e técnica · 113 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 27min54s Z2 (104–140 W (56–75% do FTP)) · Principal 27min54s Z2 (104–140 W (56–75% do FTP)) · Principal 27min54s Z2 (104–140 W (56–75% do FTP)) · Rec. 11min18s Z1 (74–102 W (40–55% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **quinta-feira, 07/01** · Intervalos longos · Corrida · Base · Intervalos estruturados · 51 min.
  - Aquec. 7min39s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Principal 0min15s Z2 (5:45–6:25/km) · Volta à calma 5min06s Z1 (6:25–7:11/km).
- **sexta-feira, 08/01** · Técnica · Natação · Base · Aeróbico e técnica · 38 min.
  - Aquec. 5min42s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min22s Z1 (2:25–2:33/100 m) · Rec. 3min48s Z1 (2:25–2:33/100 m) · Volta à calma 3min48s Z1 (2:25–2:33/100 m).
- **sábado, 09/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 113 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 37min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **domingo, 10/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 81 min.
  - Aquec. 10min00s Z1 (6:25–7:11/km) · Principal 54min54s Z2 (5:45–6:25/km) · Rec. 8min06s Z1 (6:25–7:11/km) · Volta à calma 8min00s Z1 (6:25–7:11/km).

</details>

<details>
<summary>Semana 2 · regular · 475 min</summary>

- **segunda-feira, 11/01** · Descanso.
- **terça-feira, 12/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 119 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 43min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **terça-feira, 12/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 19 min.
  - Aquec. 2min51s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 12min21s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min54s passivo · Volta à calma 1min54s Z1 (Percepção 2–3/10, confortável e conversacional).
- **quarta-feira, 13/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 69 min.
  - Aquec. 10min00s Z1 (6:25–7:11/km) · Principal 45min12s Z2 (5:45–6:25/km) · Rec. 6min54s Z1 (6:25–7:11/km) · Volta à calma 6min54s Z1 (6:25–7:11/km).
- **quinta-feira, 14/01** · Endurance leve · Natação · Base · Aeróbico e técnica · 41 min.
  - Aquec. 6min09s Z1 (2:25–2:33/100 m) · Principal 26min39s Z2 (2:19–2:25/100 m) · Rec. 4min06s Z1 (2:25–2:33/100 m) · Volta à calma 4min06s Z1 (2:25–2:33/100 m).
- **sexta-feira, 15/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 118 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 42min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **sábado, 16/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 69 min.
  - Aquec. 10min00s Z1 (6:25–7:11/km) · Principal 45min12s Z2 (5:45–6:25/km) · Rec. 6min54s Z1 (6:25–7:11/km) · Volta à calma 6min54s Z1 (6:25–7:11/km).
- **domingo, 17/01** · Intervalos longos · Natação · Base · Intervalos estruturados · 40 min.
  - Aquec. 6min00s Z1 (2:25–2:33/100 m) · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (2:12–2:15/100 m) · Principal 10min20s Z2 (2:19–2:25/100 m) · Volta à calma 4min00s Z1 (2:25–2:33/100 m).

</details>

<details>
<summary>Semana 3 · regular · 498 min</summary>

- **segunda-feira, 18/01** · Descanso.
- **terça-feira, 19/01** · Intervalos longos · Corrida · Base · Intervalos estruturados · 72 min.
  - Aquec. 10min00s Z1 (6:25–7:11/km) · Principal 5min30s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 5min30s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 5min30s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 5min30s Z4 (4:59–5:17/km) · Principal 26min48s Z2 (5:45–6:25/km) · Volta à calma 7min12s Z1 (6:25–7:11/km).
- **terça-feira, 19/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 20 min.
  - Aquec. 3min00s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 13min00s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 2min00s passivo · Volta à calma 2min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **quarta-feira, 20/01** · Técnica · Natação · Base · Aeróbico e técnica · 43 min.
  - Aquec. 6min27s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min17s passivo · Rec. 4min18s Z1 (2:25–2:33/100 m) · Volta à calma 4min18s Z1 (2:25–2:33/100 m).
- **quinta-feira, 21/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 96 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 20min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **sexta-feira, 22/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 72 min.
  - Aquec. 10min00s Z1 (6:25–7:11/km) · Principal 47min36s Z2 (5:45–6:25/km) · Rec. 7min12s Z1 (6:25–7:11/km) · Volta à calma 7min12s Z1 (6:25–7:11/km).
- **sábado, 23/01** · Técnica · Natação · Base · Aeróbico e técnica · 42 min.
  - Aquec. 6min18s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min38s Z1 (2:25–2:33/100 m) · Rec. 4min12s Z1 (2:25–2:33/100 m) · Volta à calma 4min12s Z1 (2:25–2:33/100 m).
- **domingo, 24/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 153 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 1h17min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 4 · descarga · 323 min</summary>

- **segunda-feira, 25/01** · Descanso.
- **terça-feira, 26/01** · Endurance leve · Natação · Base · Recuperação · 30 min.
  - Aquec. 4min30s Z1 (2:25–2:33/100 m) · Principal 19min30s Z2 (2:19–2:25/100 m) · Rec. 3min00s Z1 (2:25–2:33/100 m) · Volta à calma 3min00s Z1 (2:25–2:33/100 m).
- **quarta-feira, 27/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 84 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Principal 25min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **quinta-feira, 28/01** · Recuperação · Corrida · Base · Recuperação · 37 min.
  - Aquec. 5min33s Z1 (6:25–7:11/km) · Principal 24min03s Z1 (6:25–7:11/km) · Rec. 3min42s Z1 (6:25–7:11/km) · Volta à calma 3min42s Z1 (6:25–7:11/km).
- **sexta-feira, 29/01** · Endurance leve · Natação · Base · Recuperação · 29 min.
  - Aquec. 4min21s Z1 (2:25–2:33/100 m) · Principal 18min51s Z2 (2:19–2:25/100 m) · Rec. 2min54s Z1 (2:25–2:33/100 m) · Volta à calma 2min54s Z1 (2:25–2:33/100 m).
- **sábado, 30/01** · Cadência · Ciclismo · Base · Recuperação · 83 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 18min54s Z2 (104–140 W (56–75% do FTP)) · Principal 18min54s Z2 (104–140 W (56–75% do FTP)) · Principal 18min54s Z2 (104–140 W (56–75% do FTP)) · Rec. 8min18s Z1 (74–102 W (40–55% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **domingo, 31/01** · Recuperação · Corrida · Base · Recuperação · 60 min.
  - Aquec. 9min00s Z1 (6:25–7:11/km) · Principal 39min00s Z1 (6:25–7:11/km) · Rec. 6min00s Z1 (6:25–7:11/km) · Volta à calma 6min00s Z1 (6:25–7:11/km).

</details>

<details>
<summary>Semana 5 · regular · 339 min</summary>

- **segunda-feira, 01/02** · Descanso.
- **terça-feira, 02/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 86 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 10min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **terça-feira, 02/02** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 13 min.
  - Aquec. 1min57s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 8min27s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min18s passivo · Volta à calma 1min18s Z1 (Percepção 2–3/10, confortável e conversacional).
- **quarta-feira, 03/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 49 min.
  - Aquec. 7min21s Z1 (6:25–7:11/km) · Principal 31min51s Z2 (5:45–6:25/km) · Rec. 4min54s Z1 (6:25–7:11/km) · Volta à calma 4min54s Z1 (6:25–7:11/km).
- **quinta-feira, 04/02** · Técnica · Natação · Base · Aeróbico e técnica · 29 min.
  - Aquec. 4min21s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 0min11s Z1 (2:25–2:33/100 m) · Rec. 2min54s Z1 (2:25–2:33/100 m) · Volta à calma 2min54s Z1 (2:25–2:33/100 m).
- **sexta-feira, 05/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 85 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min37s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min37s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min37s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min39s Z4 (169–195 W (91–105% do FTP)) · Principal 27min30s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **sábado, 06/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 49 min.
  - Aquec. 7min21s Z1 (6:25–7:11/km) · Principal 31min51s Z2 (5:45–6:25/km) · Rec. 4min54s Z1 (6:25–7:11/km) · Volta à calma 4min54s Z1 (6:25–7:11/km).
- **domingo, 07/02** · Técnica · Natação · Base · Aeróbico e técnica · 28 min.
  - Aquec. 4min12s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min52s Z1 (2:25–2:33/100 m) · Rec. 2min48s Z1 (2:25–2:33/100 m) · Volta à calma 2min48s Z1 (2:25–2:33/100 m).

</details>

<details>
<summary>Semana 6 · regular · 355 min</summary>

- **segunda-feira, 08/02** · Descanso.
- **terça-feira, 09/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 51 min.
  - Aquec. 7min39s Z1 (6:25–7:11/km) · Principal 33min09s Z2 (5:45–6:25/km) · Rec. 5min06s Z1 (6:25–7:11/km) · Volta à calma 5min06s Z1 (6:25–7:11/km).
- **terça-feira, 09/02** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 14 min.
  - Aquec. 2min06s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 9min06s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min24s passivo · Volta à calma 1min24s Z1 (Percepção 2–3/10, confortável e conversacional).
- **quarta-feira, 10/02** · Endurance leve · Natação · Base · Aeróbico e técnica · 30 min.
  - Aquec. 4min30s Z1 (2:25–2:33/100 m) · Principal 19min30s Z2 (2:19–2:25/100 m) · Rec. 3min00s Z1 (2:25–2:33/100 m) · Volta à calma 3min00s Z1 (2:25–2:33/100 m).
- **quinta-feira, 11/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 69 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min00s Z4 (169–195 W (91–105% do FTP)) · Principal 5min06s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 6min54s Z1 (74–102 W (40–55% do FTP)).
- **sexta-feira, 12/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 51 min.
  - Aquec. 7min39s Z1 (6:25–7:11/km) · Principal 33min09s Z2 (5:45–6:25/km) · Rec. 5min06s Z1 (6:25–7:11/km) · Volta à calma 5min06s Z1 (6:25–7:11/km).
- **sábado, 13/02** · Endurance leve · Natação · Base · Aeróbico e técnica · 30 min.
  - Aquec. 4min30s Z1 (2:25–2:33/100 m) · Principal 19min30s Z2 (2:19–2:25/100 m) · Rec. 3min00s Z1 (2:25–2:33/100 m) · Volta à calma 3min00s Z1 (2:25–2:33/100 m).
- **domingo, 14/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 110 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 34min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 7 · regular · 372 min</summary>

- **segunda-feira, 15/02** · Descanso.
- **terça-feira, 16/02** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 14 min.
  - Aquec. 2min06s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 9min06s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min24s passivo · Volta à calma 1min24s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 16/02** · Técnica · Natação · Build · Aeróbico e técnica · 32 min.
  - Aquec. 4min48s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min08s passivo · Rec. 3min12s Z1 (2:25–2:33/100 m) · Volta à calma 3min12s Z1 (2:25–2:33/100 m).
- **quarta-feira, 17/02** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 94 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 18min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **quinta-feira, 18/02** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 41 min.
  - Aquec. 6min09s Z1 (6:25–7:11/km) · Principal 26min39s Z2 (5:45–6:25/km) · Rec. 4min06s Z1 (6:25–7:11/km) · Volta à calma 4min06s Z1 (6:25–7:11/km).
- **sexta-feira, 19/02** · Intervalos longos · Natação · Build · Intervalos estruturados · 31 min.
  - Aquec. 4min39s Z1 (2:25–2:33/100 m) · Principal 2min40s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 2min40s Z4 (2:12–2:15/100 m) · Rec. 0min20s passivo · Principal 2min40s Z4 (2:12–2:15/100 m) · Principal 14min35s Z2 (2:19–2:25/100 m) · Volta à calma 3min06s Z1 (2:25–2:33/100 m).
- **sábado, 20/02** · Cadência · Ciclismo · Build · Aeróbico e técnica · 94 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 22min12s Z2 (104–140 W (56–75% do FTP)) · Principal 22min12s Z2 (104–140 W (56–75% do FTP)) · Principal 22min12s Z2 (104–140 W (56–75% do FTP)) · Rec. 9min24s Z1 (74–102 W (40–55% do FTP)) · Volta à calma 8min00s Z1 (74–102 W (40–55% do FTP)).
- **domingo, 21/02** · Intervalos longos · Corrida · Build · Intervalos estruturados · 66 min.
  - Aquec. 9min54s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Principal 6min00s Z4 (4:59–5:17/km) · Principal 11min30s Z2 (5:45–6:25/km) · Volta à calma 6min36s Z1 (6:25–7:11/km).

</details>

<details>
<summary>Semana 8 · descarga · 241 min</summary>

- **segunda-feira, 22/02** · Descanso.
- **terça-feira, 23/02** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 63 min.
  - Aquec. 9min27s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Principal 17min15s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 6min18s Z1 (74–102 W (40–55% do FTP)).
- **quarta-feira, 24/02** · Recuperação · Corrida · Build · Recuperação · 36 min.
  - Aquec. 5min24s Z1 (6:25–7:11/km) · Principal 23min24s Z1 (6:25–7:11/km) · Rec. 3min36s Z1 (6:25–7:11/km) · Volta à calma 3min36s Z1 (6:25–7:11/km).
- **quinta-feira, 25/02** · Endurance leve · Natação · Build · Recuperação · 22 min.
  - Aquec. 3min18s Z1 (2:25–2:33/100 m) · Principal 14min18s Z2 (2:19–2:25/100 m) · Rec. 2min12s Z1 (2:25–2:33/100 m) · Volta à calma 2min12s Z1 (2:25–2:33/100 m).
- **sexta-feira, 26/02** · Endurance leve · Ciclismo · Build · Recuperação · 62 min.
  - Aquec. 9min18s Z1 (74–102 W (40–55% do FTP)) · Principal 40min18s Z2 (104–140 W (56–75% do FTP)) · Rec. 6min12s Z1 (74–102 W (40–55% do FTP)) · Volta à calma 6min12s Z1 (74–102 W (40–55% do FTP)).
- **sábado, 27/02** · Recuperação · Corrida · Build · Recuperação · 36 min.
  - Aquec. 5min24s Z1 (6:25–7:11/km) · Principal 23min24s Z1 (6:25–7:11/km) · Rec. 3min36s Z1 (6:25–7:11/km) · Volta à calma 3min36s Z1 (6:25–7:11/km).
- **domingo, 28/02** · Endurance leve · Natação · Build · Recuperação · 22 min.
  - Aquec. 3min18s Z1 (2:25–2:33/100 m) · Principal 14min18s Z2 (2:19–2:25/100 m) · Rec. 2min12s Z1 (2:25–2:33/100 m) · Volta à calma 2min12s Z1 (2:25–2:33/100 m).

</details>

<details>
<summary>Semana 9 · regular · 253 min</summary>

- **segunda-feira, 01/03** · Descanso.
- **terça-feira, 02/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 37 min.
  - Aquec. 5min33s Z1 (6:25–7:11/km) · Principal 24min03s Z2 (5:45–6:25/km) · Rec. 3min42s Z1 (6:25–7:11/km) · Volta à calma 3min42s Z1 (6:25–7:11/km).
- **terça-feira, 02/03** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **quarta-feira, 03/03** · Técnica · Natação · Build · Aeróbico e técnica · 21 min.
  - Aquec. 3min09s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min59s Z1 (2:25–2:33/100 m) · Rec. 2min06s Z1 (2:25–2:33/100 m) · Volta à calma 2min06s Z1 (2:25–2:33/100 m).
- **quinta-feira, 04/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 49 min.
  - Aquec. 7min21s Z1 (74–102 W (40–55% do FTP)) · Principal 6min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min00s Z4 (169–195 W (91–105% do FTP)) · Principal 21min45s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 4min54s Z1 (74–102 W (40–55% do FTP)).
- **sexta-feira, 05/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 36 min.
  - Aquec. 5min24s Z1 (6:25–7:11/km) · Principal 23min24s Z2 (5:45–6:25/km) · Rec. 3min36s Z1 (6:25–7:11/km) · Volta à calma 3min36s Z1 (6:25–7:11/km).
- **sábado, 06/03** · Técnica · Natação · Build · Aeróbico e técnica · 21 min.
  - Aquec. 3min09s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min59s Z1 (2:25–2:33/100 m) · Rec. 2min06s Z1 (2:25–2:33/100 m) · Volta à calma 2min06s Z1 (2:25–2:33/100 m).
- **domingo, 07/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 79 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min10s Z4 (169–195 W (91–105% do FTP)) · Principal 3min06s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 7min54s Z1 (74–102 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 10 · regular · 265 min</summary>

- **segunda-feira, 08/03** · Descanso.
- **terça-feira, 09/03** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 09/03** · Endurance leve · Natação · Build · Aeróbico e técnica · 23 min.
  - Aquec. 3min27s Z1 (2:25–2:33/100 m) · Principal 14min57s Z2 (2:19–2:25/100 m) · Rec. 2min18s Z1 (2:25–2:33/100 m) · Volta à calma 2min18s Z1 (2:25–2:33/100 m).
- **quarta-feira, 10/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 67 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min36s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min36s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min36s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min36s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min36s Z4 (169–195 W (91–105% do FTP)) · Principal 0min18s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 6min42s Z1 (74–102 W (40–55% do FTP)).
- **quinta-feira, 11/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 29 min.
  - Aquec. 4min21s Z1 (6:25–7:11/km) · Principal 18min51s Z2 (5:45–6:25/km) · Rec. 2min54s Z1 (6:25–7:11/km) · Volta à calma 2min54s Z1 (6:25–7:11/km).
- **sexta-feira, 12/03** · Endurance leve · Natação · Build · Aeróbico e técnica · 22 min.
  - Aquec. 3min18s Z1 (2:25–2:33/100 m) · Principal 14min18s Z2 (2:19–2:25/100 m) · Rec. 2min12s Z1 (2:25–2:33/100 m) · Volta à calma 2min12s Z1 (2:25–2:33/100 m).
- **sábado, 13/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 67 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min50s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min50s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min50s Z4 (169–195 W (91–105% do FTP)) · Principal 23min48s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 6min42s Z1 (74–102 W (40–55% do FTP)).
- **domingo, 14/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 47 min.
  - Aquec. 7min03s Z1 (6:25–7:11/km) · Principal 30min33s Z2 (5:45–6:25/km) · Rec. 4min42s Z1 (6:25–7:11/km) · Volta à calma 4min42s Z1 (6:25–7:11/km).

</details>

<details>
<summary>Semana 11 · regular · 278 min</summary>

- **segunda-feira, 15/03** · Descanso.
- **terça-feira, 16/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 70 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 8min00s Z4 (169–195 W (91–105% do FTP)) · Principal 1min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 7min00s Z1 (74–102 W (40–55% do FTP)).
- **terça-feira, 16/03** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 11 min.
  - Aquec. 1min39s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 7min09s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min06s passivo · Volta à calma 1min06s Z1 (Percepção 2–3/10, confortável e conversacional).
- **quarta-feira, 17/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (6:25–7:11/km) · Principal 26min00s Z2 (5:45–6:25/km) · Rec. 4min00s Z1 (6:25–7:11/km) · Volta à calma 4min00s Z1 (6:25–7:11/km).
- **quinta-feira, 18/03** · Técnica · Natação · Build · Aeróbico e técnica · 24 min.
  - Aquec. 3min36s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min36s Z1 (2:25–2:33/100 m) · Rec. 2min24s Z1 (2:25–2:33/100 m) · Volta à calma 2min24s Z1 (2:25–2:33/100 m).
- **sexta-feira, 19/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 70 min.
  - Aquec. 10min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min40s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min40s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min40s Z4 (169–195 W (91–105% do FTP)) · Principal 27min00s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 7min00s Z1 (74–102 W (40–55% do FTP)).
- **sábado, 20/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 40 min.
  - Aquec. 6min00s Z1 (6:25–7:11/km) · Principal 26min00s Z2 (5:45–6:25/km) · Rec. 4min00s Z1 (6:25–7:11/km) · Volta à calma 4min00s Z1 (6:25–7:11/km).
- **domingo, 21/03** · Técnica · Natação · Build · Aeróbico e técnica · 23 min.
  - Aquec. 3min27s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 0min57s Z1 (2:25–2:33/100 m) · Rec. 2min18s Z1 (2:25–2:33/100 m) · Volta à calma 2min18s Z1 (2:25–2:33/100 m).

</details>

<details>
<summary>Semana 12 · descarga · 180 min</summary>

- **segunda-feira, 22/03** · Descanso.
- **terça-feira, 23/03** · Recuperação · Corrida · Build · Recuperação · 27 min.
  - Aquec. 4min03s Z1 (6:25–7:11/km) · Principal 17min33s Z1 (6:25–7:11/km) · Rec. 2min42s Z1 (6:25–7:11/km) · Volta à calma 2min42s Z1 (6:25–7:11/km).
- **quarta-feira, 24/03** · Endurance leve · Natação · Build · Recuperação · 17 min.
  - Aquec. 2min33s Z1 (2:25–2:33/100 m) · Principal 11min03s Z2 (2:19–2:25/100 m) · Rec. 1min42s Z1 (2:25–2:33/100 m) · Volta à calma 1min42s Z1 (2:25–2:33/100 m).
- **quinta-feira, 25/03** · Endurance leve · Ciclismo · Build · Recuperação · 36 min.
  - Aquec. 5min24s Z1 (74–102 W (40–55% do FTP)) · Principal 23min24s Z2 (104–140 W (56–75% do FTP)) · Rec. 3min36s Z1 (74–102 W (40–55% do FTP)) · Volta à calma 3min36s Z1 (74–102 W (40–55% do FTP)).
- **sexta-feira, 26/03** · Recuperação · Corrida · Build · Recuperação · 27 min.
  - Aquec. 4min03s Z1 (6:25–7:11/km) · Principal 17min33s Z1 (6:25–7:11/km) · Rec. 2min42s Z1 (6:25–7:11/km) · Volta à calma 2min42s Z1 (6:25–7:11/km).
- **sábado, 27/03** · Endurance leve · Natação · Build · Recuperação · 16 min.
  - Aquec. 2min24s Z1 (2:25–2:33/100 m) · Principal 10min24s Z2 (2:19–2:25/100 m) · Rec. 1min36s Z1 (2:25–2:33/100 m) · Volta à calma 1min36s Z1 (2:25–2:33/100 m).
- **domingo, 28/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 57 min.
  - Aquec. 8min33s Z1 (74–102 W (40–55% do FTP)) · Principal 6min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min00s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min00s Z4 (169–195 W (91–105% do FTP)) · Principal 18min45s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 5min42s Z1 (74–102 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 13 · regular · 189 min</summary>

- **segunda-feira, 29/03** · Descanso.
- **terça-feira, 30/03** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 30/03** · Técnica · Natação · Build · Aeróbico e técnica · 16 min.
  - Aquec. 2min24s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min04s Z1 (2:25–2:33/100 m) · Rec. 1min36s Z1 (2:25–2:33/100 m) · Volta à calma 1min36s Z1 (2:25–2:33/100 m).
- **quarta-feira, 31/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 48 min.
  - Aquec. 7min12s Z1 (74–102 W (40–55% do FTP)) · Principal 6min45s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min45s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min45s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min45s Z4 (169–195 W (91–105% do FTP)) · Volta à calma 4min48s Z1 (74–102 W (40–55% do FTP)).
- **quinta-feira, 01/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 20 min.
  - Aquec. 3min00s Z1 (6:25–7:11/km) · Principal 13min00s Z2 (5:45–6:25/km) · Rec. 2min00s Z1 (6:25–7:11/km) · Volta à calma 2min00s Z1 (6:25–7:11/km).
- **sexta-feira, 02/04** · Técnica · Natação · Build · Aeróbico e técnica · 15 min.
  - Aquec. 2min15s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 0min25s Z1 (2:25–2:33/100 m) · Rec. 1min30s Z1 (2:25–2:33/100 m) · Volta à calma 1min30s Z1 (2:25–2:33/100 m).
- **sábado, 03/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 47 min.
  - Aquec. 7min03s Z1 (74–102 W (40–55% do FTP)) · Principal 6min45s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 6min45s Z4 (169–195 W (91–105% do FTP)) · Principal 18min45s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 4min42s Z1 (74–102 W (40–55% do FTP)).
- **domingo, 04/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 33 min.
  - Aquec. 4min57s Z1 (6:25–7:11/km) · Principal 21min27s Z2 (5:45–6:25/km) · Rec. 3min18s Z1 (6:25–7:11/km) · Volta à calma 3min18s Z1 (6:25–7:11/km).

</details>

<details>
<summary>Semana 14 · regular · 198 min</summary>

- **segunda-feira, 05/04** · Descanso.
- **terça-feira, 06/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 50 min.
  - Aquec. 7min30s Z1 (74–102 W (40–55% do FTP)) · Principal 7min07s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min07s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min07s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min09s Z4 (169–195 W (91–105% do FTP)) · Volta à calma 5min00s Z1 (74–102 W (40–55% do FTP)).
- **terça-feira, 06/04** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **quarta-feira, 07/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 28 min.
  - Aquec. 4min12s Z1 (6:25–7:11/km) · Principal 18min12s Z2 (5:45–6:25/km) · Rec. 2min48s Z1 (6:25–7:11/km) · Volta à calma 2min48s Z1 (6:25–7:11/km).
- **quinta-feira, 08/04** · Endurance leve · Natação · Build · Aeróbico e técnica · 17 min.
  - Aquec. 2min33s Z1 (2:25–2:33/100 m) · Principal 11min03s Z2 (2:19–2:25/100 m) · Rec. 1min42s Z1 (2:25–2:33/100 m) · Volta à calma 1min42s Z1 (2:25–2:33/100 m).
- **sexta-feira, 09/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 49 min.
  - Aquec. 7min21s Z1 (74–102 W (40–55% do FTP)) · Principal 7min15s Z4 (169–195 W (91–105% do FTP)) · Rec. 3min00s Z1 (74–102 W (40–55% do FTP)) · Principal 7min15s Z4 (169–195 W (91–105% do FTP)) · Principal 19min15s Z2 (104–140 W (56–75% do FTP)) · Volta à calma 4min54s Z1 (74–102 W (40–55% do FTP)).
- **sábado, 10/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 28 min.
  - Aquec. 4min12s Z1 (6:25–7:11/km) · Principal 18min12s Z2 (5:45–6:25/km) · Rec. 2min48s Z1 (6:25–7:11/km) · Volta à calma 2min48s Z1 (6:25–7:11/km).
- **domingo, 11/04** · Endurance leve · Natação · Build · Aeróbico e técnica · 16 min.
  - Aquec. 2min24s Z1 (2:25–2:33/100 m) · Principal 10min24s Z2 (2:19–2:25/100 m) · Rec. 1min36s Z1 (2:25–2:33/100 m) · Volta à calma 1min36s Z1 (2:25–2:33/100 m).

</details>

<details>
<summary>Semana 15 · polimento · 118 min</summary>

- **segunda-feira, 12/04** · Descanso.
- **terça-feira, 13/04** · Intervalos longos · Corrida · Peak · Intervalos estruturados · 36 min.
  - Aquec. 5min24s Z1 (6:25–7:11/km) · Principal 1min25s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min25s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min25s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min25s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min25s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min25s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min30s Z4 (4:59–5:17/km) · Principal 7min36s Z2 (5:45–6:25/km) · Volta à calma 4min00s Z1 (6:25–7:11/km).
- **quarta-feira, 14/04** · Técnica · Natação · Peak · Aeróbico e técnica · 21 min.
  - Aquec. 3min09s Z1 (2:25–2:33/100 m) · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:25–2:33/100 m) · Rec. 0min20s passivo · Principal 1min59s Z1 (2:25–2:33/100 m) · Rec. 2min06s Z1 (2:25–2:33/100 m) · Volta à calma 2min06s Z1 (2:25–2:33/100 m).
- **quinta-feira, 15/04** · Intervalos longos · Ciclismo · Peak · Intervalos estruturados · 61 min.
  - Aquec. 9min09s Z1 (74–102 W (40–55% do FTP)) · Principal 1min30s Z4 (169–195 W (91–105% do FTP)) · Principal 43min15s Z2 (104–140 W (56–75% do FTP)) · Rec. 1min00s Z1 (74–102 W (40–55% do FTP)) · Volta à calma 6min06s Z1 (74–102 W (40–55% do FTP)).
- **sexta-feira, 16/04** · Descanso.
- **sábado, 17/04** · Descanso.
- **domingo, 18/04** · Descanso.

</details>

<details>
<summary>Semana 16 · polimento · 99 min</summary>

- **segunda-feira, 19/04** · Descanso.
- **terça-feira, 20/04** · Endurance leve · Natação · Race · Aeróbico e técnica · 18 min.
  - Aquec. 2min42s Z1 (2:25–2:33/100 m) · Principal 11min42s Z2 (2:19–2:25/100 m) · Rec. 1min48s Z1 (2:25–2:33/100 m) · Volta à calma 1min48s Z1 (2:25–2:33/100 m).
- **quarta-feira, 21/04** · Cadência · Ciclismo · Race · Aeróbico e técnica · 51 min.
  - Aquec. 7min39s Z1 (74–102 W (40–55% do FTP)) · Principal 11min03s Z2 (104–140 W (56–75% do FTP)) · Principal 11min03s Z2 (104–140 W (56–75% do FTP)) · Principal 11min03s Z2 (104–140 W (56–75% do FTP)) · Rec. 5min06s Z1 (74–102 W (40–55% do FTP)) · Volta à calma 5min06s Z1 (74–102 W (40–55% do FTP)).
- **quinta-feira, 22/04** · Intervalos longos · Corrida · Race · Intervalos estruturados · 30 min.
  - Aquec. 5min00s Z1 (6:25–7:11/km) · Principal 1min21s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min21s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min21s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min21s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min21s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min21s Z4 (4:59–5:17/km) · Rec. 1min30s Z1 (6:25–7:11/km) · Principal 1min24s Z4 (4:59–5:17/km) · Principal 2min30s Z2 (5:45–6:25/km) · Volta à calma 4min00s Z1 (6:25–7:11/km).
- **sexta-feira, 23/04** · Descanso.
- **sábado, 24/04** · Descanso.
- **domingo, 25/04** · Prova-alvo, registrada à parte.

</details>

## Ironman · avançado

Início em 2027-01-04, prova em 2027-06-20. Histórico de 10,33 h/semana e teto de 10 h/semana. FTP 216 W, CSS 1:49/100 m e limiar de corrida 5:03/km.

### Intensidade por semana

| Semana | Fase | Tempo ativo antes | Zonas antes | Volume depois | Tempo ativo depois | Zonas depois |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | regular | 9h17min40s | 100% / 0% / 0% | 600 min | 9h22min40s | 77,61% / 0% / 22,39% |
| 2 | regular | 9h28min00s | 100% / 0% / 0% | 600 min | 9h31min00s | 80,56% / 0% / 19,44% |
| 3 | regular | 9h20min41s | 83,95% / 0% / 16,05% | 600 min | 9h29min30s | 78,93% / 0% / 21,07% |
| 4 | descarga | 7h46min00s | 100% / 0% / 0% | 390 min | 6h30min00s | 90% / 0% / 10% |
| 5 | regular | 9h16min00s | 83,81% / 0% / 16,19% | 409 min | 6h28min00s | 77,06% / 0% / 22,94% |
| 6 | regular | 9h33min00s | 84,29% / 0% / 15,71% | 429 min | 6h53min00s | 77,12% / 0% / 22,88% |
| 7 | regular | 9h18min00s | 83,87% / 0% / 16,13% | 450 min | 7h06min20s | 77,01% / 0% / 22,99% |
| 8 | descarga | 8h58min00s | 100% / 0% / 0% | 292 min | 4h52min00s | 90,07% / 0% / 9,93% |
| 9 | regular | 9h21min00s | 83,96% / 0% / 16,04% | 306 min | 4h49min25s | 77,02% / 0% / 22,98% |
| 10 | regular | 9h30min00s | 84,21% / 0% / 15,79% | 321 min | 5h09min00s | 77,02% / 0% / 22,98% |
| 11 | regular | 9h17min20s | 83,85% / 0% / 16,15% | 337 min | 5h19min00s | 77,12% / 0% / 22,88% |
| 12 | descarga | 10h00min00s | 100% / 0% / 0% | 219 min | 3h39min00s | 90,18% / 0% / 9,82% |
| 13 | regular | 9h18min40s | 83,89% / 0% / 16,11% | 229 min | 3h35min40s | 77,05% / 0% / 22,95% |
| 14 | regular | 9h33min00s | 84,29% / 0% / 15,71% | 240 min | 3h50min00s | 77,17% / 0% / 22,83% |
| 15 | regular | 9h21min20s | 83,97% / 0% / 16,03% | 252 min | 3h58min40s | 77,16% / 0% / 22,84% |
| 16 | descarga | 10h00min00s | 100% / 0% / 0% | 163 min | 2h43min00s | 90,18% / 0% / 9,82% |
| 17 | regular | 9h23min00s | 84,01% / 0% / 15,99% | 171 min | 2h38min48s | 77,02% / 0% / 22,98% |
| 18 | regular | 9h37min00s | 84,4% / 0% / 15,6% | 179 min | 2h49min00s | 77,22% / 0% / 22,78% |
| 19 | regular | 9h26min01s | 84,1% / 0% / 15,9% | 187 min | 2h54min20s | 77,06% / 0% / 22,94% |
| 20 | descarga | 10h00min00s | 100% / 0% / 0% | 121 min | 2h01min00s | 90,08% / 0% / 9,92% |
| 21 | regular | 9h20min40s | 91,08% / 0% / 8,92% | 127 min | 2h05min00s | 77,2% / 0% / 22,8% |
| 22 | polimento | 9h33min00s | 91,27% / 0% / 8,73% | 76 min | 1h16min00s | 90,13% / 0% / 9,87% |
| 23 | polimento | 9h45min00s | 100% / 0% / 0% | 64 min | 1h03min00s | 90,48% / 0% / 9,52% |
| 24 | polimento | 10h00min00s | 100% / 0% / 0% | 51 min | 51min00s | 90,2% / 0% / 9,8% |
| **Ciclo** |  | 226h23min22s | 90,65% / 0% / 9,35% | 6813 min | 108h54min23s | 80,33% / 0% / 19,67% |

### Metas simuladas por trecho

| Trecho | Tempo | Faixa cadastrada para o teste | Alvo |
| --- | ---: | ---: | --- |
| Natação | 1h15min22s | 1h07min49s a 1h22min55s | 1:59/100 m |
| T1 | 3min15s | 2min55s a 3min35s | Transição |
| Ciclismo | 6h12min25s | 5h35min10s a 6h49min40s | 29 km/h · 173 W |
| T2 | 1min47s | 1min36s a 1min58s | Transição |
| Corrida | 3h57min00s | 3h33min18s a 4h20min43s | 5:37/km após o pedal |
| **Soma** | **11h29min49s** | | |

Meta informada de 11h29min49s e diferença de 0%.

### Calendário completo

<details>
<summary>Semana 1 · regular · 600 min</summary>

- **segunda-feira, 04/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 28 min.
  - Aquec. 4min12s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 18min12s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 2min48s passivo · Volta à calma 2min48s Z1 (Percepção 2–3/10, confortável e conversacional).
- **segunda-feira, 04/01** · Técnica · Natação · Base · Aeróbico e técnica · 53 min.
  - Aquec. 7min57s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min47s Z1 (2:01–2:09/100 m) · Rec. 5min18s Z1 (2:01–2:09/100 m) · Volta à calma 5min18s Z1 (2:01–2:09/100 m).
- **terça-feira, 05/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 143 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 1h05min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 06/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 69 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 45min12s Z2 (5:39–6:19/km) · Rec. 6min54s Z1 (6:19–7:04/km) · Volta à calma 6min54s Z1 (6:19–7:04/km).
- **quinta-feira, 07/01** · Técnica · Natação · Base · Aeróbico e técnica · 53 min.
  - Aquec. 7min57s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min47s Z1 (2:01–2:09/100 m) · Rec. 5min18s Z1 (2:01–2:09/100 m) · Volta à calma 5min18s Z1 (2:01–2:09/100 m).
- **sexta-feira, 08/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 143 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 1h05min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **sábado, 09/01** · Descanso.
- **domingo, 10/01** · Intervalos longos · Corrida · Base · Intervalos estruturados · 111 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Principal 47min00s Z2 (5:39–6:19/km) · Volta à calma 8min00s Z1 (6:19–7:04/km).

</details>

<details>
<summary>Semana 2 · regular · 600 min</summary>

- **segunda-feira, 11/01** · Endurance leve · Ciclismo · Base · Aeróbico e técnica · 148 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 1h55min12s Z2 (121–162 W (56–75% do FTP)) · Rec. 14min48s Z1 (86–119 W (40–55% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **segunda-feira, 11/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 26 min.
  - Aquec. 3min54s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 16min54s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 2min36s passivo · Volta à calma 2min36s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 12/01** · Intervalos longos · Corrida · Base · Intervalos estruturados · 88 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 6min00s Z4 (4:54–5:12/km) · Principal 24min00s Z2 (5:39–6:19/km) · Volta à calma 8min00s Z1 (6:19–7:04/km).
- **quarta-feira, 13/01** · Endurance leve · Natação · Base · Aeróbico e técnica · 52 min.
  - Aquec. 7min48s Z1 (2:01–2:09/100 m) · Principal 33min48s Z2 (1:55–2:01/100 m) · Rec. 5min12s Z1 (2:01–2:09/100 m) · Volta à calma 5min12s Z1 (2:01–2:09/100 m).
- **quinta-feira, 14/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 148 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 1h10min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **sexta-feira, 15/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 87 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 1h00min18s Z2 (5:39–6:19/km) · Rec. 8min42s Z1 (6:19–7:04/km) · Volta à calma 8min00s Z1 (6:19–7:04/km).
- **sábado, 16/01** · Descanso.
- **domingo, 17/01** · Intervalos longos · Natação · Base · Intervalos estruturados · 51 min.
  - Aquec. 7min39s Z1 (2:01–2:09/100 m) · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Principal 5min15s Z2 (1:55–2:01/100 m) · Volta à calma 5min06s Z1 (2:01–2:09/100 m).

</details>

<details>
<summary>Semana 3 · regular · 600 min</summary>

- **segunda-feira, 18/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 87 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 1h00min18s Z2 (5:39–6:19/km) · Rec. 8min42s Z1 (6:19–7:04/km) · Volta à calma 8min00s Z1 (6:19–7:04/km).
- **segunda-feira, 18/01** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 23 min.
  - Aquec. 3min27s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 14min57s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 2min18s passivo · Volta à calma 2min18s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 19/01** · Técnica · Natação · Base · Aeróbico e técnica · 50 min.
  - Aquec. 7min30s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min10s passivo · Rec. 5min00s Z1 (2:01–2:09/100 m) · Volta à calma 5min00s Z1 (2:01–2:09/100 m).
- **quarta-feira, 20/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 116 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 38min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 21/01** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 87 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 1h00min18s Z2 (5:39–6:19/km) · Rec. 8min42s Z1 (6:19–7:04/km) · Volta à calma 8min00s Z1 (6:19–7:04/km).
- **sexta-feira, 22/01** · Intervalos longos · Natação · Base · Intervalos estruturados · 50 min.
  - Aquec. 7min30s Z1 (2:01–2:09/100 m) · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Rec. 0min20s passivo · Principal 3min00s Z4 (1:48–1:51/100 m) · Principal 4min30s Z2 (1:55–2:01/100 m) · Volta à calma 5min00s Z1 (2:01–2:09/100 m).
- **sábado, 23/01** · Descanso.
- **domingo, 24/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 187 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 1h49min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 4 · descarga · 390 min</summary>

- **segunda-feira, 25/01** · Endurance leve · Natação · Base · Recuperação · 36 min.
  - Aquec. 5min24s Z1 (2:01–2:09/100 m) · Principal 23min24s Z2 (1:55–2:01/100 m) · Rec. 3min36s Z1 (2:01–2:09/100 m) · Volta à calma 3min36s Z1 (2:01–2:09/100 m).
- **terça-feira, 26/01** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 101 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min48s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min48s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min48s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min48s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min48s Z4 (197–227 W (91–105% do FTP)) · Principal 32min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 27/01** · Recuperação · Corrida · Base · Recuperação · 45 min.
  - Aquec. 6min45s Z1 (6:19–7:04/km) · Principal 29min15s Z1 (6:19–7:04/km) · Rec. 4min30s Z1 (6:19–7:04/km) · Volta à calma 4min30s Z1 (6:19–7:04/km).
- **quinta-feira, 28/01** · Endurance leve · Natação · Base · Recuperação · 35 min.
  - Aquec. 5min15s Z1 (2:01–2:09/100 m) · Principal 22min45s Z2 (1:55–2:01/100 m) · Rec. 3min30s Z1 (2:01–2:09/100 m) · Volta à calma 3min30s Z1 (2:01–2:09/100 m).
- **sexta-feira, 29/01** · Cadência · Ciclismo · Base · Recuperação · 101 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 24min18s Z2 (121–162 W (56–75% do FTP)) · Principal 24min18s Z2 (121–162 W (56–75% do FTP)) · Principal 24min18s Z2 (121–162 W (56–75% do FTP)) · Rec. 10min06s Z1 (86–119 W (40–55% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **sábado, 30/01** · Descanso.
- **domingo, 31/01** · Recuperação · Corrida · Base · Recuperação · 72 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 47min36s Z1 (6:19–7:04/km) · Rec. 7min12s Z1 (6:19–7:04/km) · Volta à calma 7min12s Z1 (6:19–7:04/km).

</details>

<details>
<summary>Semana 5 · regular · 409 min</summary>

- **segunda-feira, 01/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 104 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 26min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **segunda-feira, 01/02** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 15 min.
  - Aquec. 2min15s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 9min45s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min30s passivo · Volta à calma 1min30s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 02/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 59 min.
  - Aquec. 8min51s Z1 (6:19–7:04/km) · Principal 38min21s Z2 (5:39–6:19/km) · Rec. 5min54s Z1 (6:19–7:04/km) · Volta à calma 5min54s Z1 (6:19–7:04/km).
- **quarta-feira, 03/02** · Técnica · Natação · Base · Aeróbico e técnica · 35 min.
  - Aquec. 5min15s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min45s Z1 (2:01–2:09/100 m) · Rec. 3min30s Z1 (2:01–2:09/100 m) · Volta à calma 3min30s Z1 (2:01–2:09/100 m).
- **quinta-feira, 04/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 103 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min20s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min20s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min20s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min20s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min20s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min20s Z4 (197–227 W (91–105% do FTP)) · Principal 26min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **sexta-feira, 05/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 59 min.
  - Aquec. 8min51s Z1 (6:19–7:04/km) · Principal 38min21s Z2 (5:39–6:19/km) · Rec. 5min54s Z1 (6:19–7:04/km) · Volta à calma 5min54s Z1 (6:19–7:04/km).
- **sábado, 06/02** · Descanso.
- **domingo, 07/02** · Técnica · Natação · Base · Aeróbico e técnica · 34 min.
  - Aquec. 5min06s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min06s Z1 (2:01–2:09/100 m) · Rec. 3min24s Z1 (2:01–2:09/100 m) · Volta à calma 3min24s Z1 (2:01–2:09/100 m).

</details>

<details>
<summary>Semana 6 · regular · 429 min</summary>

- **segunda-feira, 08/02** · Intervalos longos · Corrida · Base · Intervalos estruturados · 62 min.
  - Aquec. 9min18s Z1 (6:19–7:04/km) · Principal 4min30s Z4 (4:54–5:12/km) · Principal 41min00s Z2 (5:39–6:19/km) · Rec. 1min00s Z1 (6:19–7:04/km) · Volta à calma 6min12s Z1 (6:19–7:04/km).
- **segunda-feira, 08/02** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 16 min.
  - Aquec. 2min24s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 10min24s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min36s passivo · Volta à calma 1min36s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 09/02** · Endurance leve · Natação · Base · Aeróbico e técnica · 36 min.
  - Aquec. 5min24s Z1 (2:01–2:09/100 m) · Principal 23min24s Z2 (1:55–2:01/100 m) · Rec. 3min36s Z1 (2:01–2:09/100 m) · Volta à calma 3min36s Z1 (2:01–2:09/100 m).
- **quarta-feira, 10/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 83 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 5min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 11/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 62 min.
  - Aquec. 9min18s Z1 (6:19–7:04/km) · Principal 40min18s Z2 (5:39–6:19/km) · Rec. 6min12s Z1 (6:19–7:04/km) · Volta à calma 6min12s Z1 (6:19–7:04/km).
- **sexta-feira, 12/02** · Endurance leve · Natação · Base · Aeróbico e técnica · 36 min.
  - Aquec. 5min24s Z1 (2:01–2:09/100 m) · Principal 23min24s Z2 (1:55–2:01/100 m) · Rec. 3min36s Z1 (2:01–2:09/100 m) · Volta à calma 3min36s Z1 (2:01–2:09/100 m).
- **sábado, 13/02** · Descanso.
- **domingo, 14/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 134 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 56min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 7 · regular · 450 min</summary>

- **segunda-feira, 15/02** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 17 min.
  - Aquec. 2min33s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 11min03s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min42s passivo · Volta à calma 1min42s Z1 (Percepção 2–3/10, confortável e conversacional).
- **segunda-feira, 15/02** · Técnica · Natação · Base · Aeróbico e técnica · 38 min.
  - Aquec. 5min42s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min22s Z1 (2:01–2:09/100 m) · Rec. 3min48s Z1 (2:01–2:09/100 m) · Volta à calma 3min48s Z1 (2:01–2:09/100 m).
- **terça-feira, 16/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 114 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 36min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 17/02** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 50 min.
  - Aquec. 7min30s Z1 (6:19–7:04/km) · Principal 32min30s Z2 (5:39–6:19/km) · Rec. 5min00s Z1 (6:19–7:04/km) · Volta à calma 5min00s Z1 (6:19–7:04/km).
- **quinta-feira, 18/02** · Técnica · Natação · Base · Aeróbico e técnica · 38 min.
  - Aquec. 5min42s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min22s Z1 (2:01–2:09/100 m) · Rec. 3min48s Z1 (2:01–2:09/100 m) · Volta à calma 3min48s Z1 (2:01–2:09/100 m).
- **sexta-feira, 19/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 113 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 35min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **sábado, 20/02** · Descanso.
- **domingo, 21/02** · Intervalos longos · Corrida · Base · Intervalos estruturados · 80 min.
  - Aquec. 10min00s Z1 (6:19–7:04/km) · Principal 4min00s Z4 (4:54–5:12/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Principal 4min00s Z4 (4:54–5:12/km) · Principal 52min00s Z2 (5:39–6:19/km) · Volta à calma 8min00s Z1 (6:19–7:04/km).

</details>

<details>
<summary>Semana 8 · descarga · 292 min</summary>

- **segunda-feira, 22/02** · Endurance leve · Ciclismo · Base · Recuperação · 76 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 50min48s Z2 (121–162 W (56–75% do FTP)) · Rec. 7min36s Z1 (86–119 W (40–55% do FTP)) · Volta à calma 7min36s Z1 (86–119 W (40–55% do FTP)).
- **terça-feira, 23/02** · Recuperação · Corrida · Base · Recuperação · 44 min.
  - Aquec. 6min36s Z1 (6:19–7:04/km) · Principal 28min36s Z1 (6:19–7:04/km) · Rec. 4min24s Z1 (6:19–7:04/km) · Volta à calma 4min24s Z1 (6:19–7:04/km).
- **quarta-feira, 24/02** · Endurance leve · Natação · Base · Recuperação · 27 min.
  - Aquec. 4min03s Z1 (2:01–2:09/100 m) · Principal 17min33s Z2 (1:55–2:01/100 m) · Rec. 2min42s Z1 (2:01–2:09/100 m) · Volta à calma 2min42s Z1 (2:01–2:09/100 m).
- **quinta-feira, 25/02** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 75 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min15s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min15s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min15s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min15s Z4 (197–227 W (91–105% do FTP)) · Principal 19min30s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 7min30s Z1 (86–119 W (40–55% do FTP)).
- **sexta-feira, 26/02** · Recuperação · Corrida · Base · Recuperação · 44 min.
  - Aquec. 6min36s Z1 (6:19–7:04/km) · Principal 28min36s Z1 (6:19–7:04/km) · Rec. 4min24s Z1 (6:19–7:04/km) · Volta à calma 4min24s Z1 (6:19–7:04/km).
- **sábado, 27/02** · Descanso.
- **domingo, 28/02** · Endurance leve · Natação · Base · Recuperação · 26 min.
  - Aquec. 3min54s Z1 (2:01–2:09/100 m) · Principal 16min54s Z2 (1:55–2:01/100 m) · Rec. 2min36s Z1 (2:01–2:09/100 m) · Volta à calma 2min36s Z1 (2:01–2:09/100 m).

</details>

<details>
<summary>Semana 9 · regular · 306 min</summary>

- **segunda-feira, 01/03** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 44 min.
  - Aquec. 6min36s Z1 (6:19–7:04/km) · Principal 28min36s Z2 (5:39–6:19/km) · Rec. 4min24s Z1 (6:19–7:04/km) · Volta à calma 4min24s Z1 (6:19–7:04/km).
- **segunda-feira, 01/03** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 12 min.
  - Aquec. 1min48s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 7min48s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min12s passivo · Volta à calma 1min12s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 02/03** · Técnica · Natação · Base · Aeróbico e técnica · 26 min.
  - Aquec. 3min54s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min34s Z1 (2:01–2:09/100 m) · Rec. 2min36s Z1 (2:01–2:09/100 m) · Volta à calma 2min36s Z1 (2:01–2:09/100 m).
- **quarta-feira, 03/03** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 59 min.
  - Aquec. 8min51s Z1 (86–119 W (40–55% do FTP)) · Principal 7min10s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min10s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min10s Z4 (197–227 W (91–105% do FTP)) · Principal 16min45s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 5min54s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 04/03** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 44 min.
  - Aquec. 6min36s Z1 (6:19–7:04/km) · Principal 28min36s Z2 (5:39–6:19/km) · Rec. 4min24s Z1 (6:19–7:04/km) · Volta à calma 4min24s Z1 (6:19–7:04/km).
- **sexta-feira, 05/03** · Técnica · Natação · Base · Aeróbico e técnica · 25 min.
  - Aquec. 3min45s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min15s passivo · Rec. 2min30s Z1 (2:01–2:09/100 m) · Volta à calma 2min30s Z1 (2:01–2:09/100 m).
- **sábado, 06/03** · Descanso.
- **domingo, 07/03** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 96 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 18min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 10 · regular · 321 min</summary>

- **segunda-feira, 08/03** · Endurance leve · Força e mobilidade · Base · Aeróbico e técnica · 12 min.
  - Aquec. 1min48s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 7min48s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min12s passivo · Volta à calma 1min12s Z1 (Percepção 2–3/10, confortável e conversacional).
- **segunda-feira, 08/03** · Endurance leve · Natação · Base · Aeróbico e técnica · 27 min.
  - Aquec. 4min03s Z1 (2:01–2:09/100 m) · Principal 17min33s Z2 (1:55–2:01/100 m) · Rec. 2min42s Z1 (2:01–2:09/100 m) · Volta à calma 2min42s Z1 (2:01–2:09/100 m).
- **terça-feira, 09/03** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 81 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 3min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 10/03** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 36 min.
  - Aquec. 5min24s Z1 (6:19–7:04/km) · Principal 23min24s Z2 (5:39–6:19/km) · Rec. 3min36s Z1 (6:19–7:04/km) · Volta à calma 3min36s Z1 (6:19–7:04/km).
- **quinta-feira, 11/03** · Endurance leve · Natação · Base · Aeróbico e técnica · 27 min.
  - Aquec. 4min03s Z1 (2:01–2:09/100 m) · Principal 17min33s Z2 (1:55–2:01/100 m) · Rec. 2min42s Z1 (2:01–2:09/100 m) · Volta à calma 2min42s Z1 (2:01–2:09/100 m).
- **sexta-feira, 12/03** · Intervalos longos · Ciclismo · Base · Intervalos estruturados · 81 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Principal 28min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **sábado, 13/03** · Descanso.
- **domingo, 14/03** · Rodagem leve · Corrida · Base · Aeróbico e técnica · 57 min.
  - Aquec. 8min33s Z1 (6:19–7:04/km) · Principal 37min03s Z2 (5:39–6:19/km) · Rec. 5min42s Z1 (6:19–7:04/km) · Volta à calma 5min42s Z1 (6:19–7:04/km).

</details>

<details>
<summary>Semana 11 · regular · 337 min</summary>

- **segunda-feira, 15/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 85 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 7min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **segunda-feira, 15/03** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 13 min.
  - Aquec. 1min57s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 8min27s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min18s passivo · Volta à calma 1min18s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 16/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 49 min.
  - Aquec. 7min21s Z1 (6:19–7:04/km) · Principal 31min51s Z2 (5:39–6:19/km) · Rec. 4min54s Z1 (6:19–7:04/km) · Volta à calma 4min54s Z1 (6:19–7:04/km).
- **quarta-feira, 17/03** · Técnica · Natação · Build · Aeróbico e técnica · 29 min.
  - Aquec. 4min21s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min11s Z1 (2:01–2:09/100 m) · Rec. 2min54s Z1 (2:01–2:09/100 m) · Volta à calma 2min54s Z1 (2:01–2:09/100 m).
- **quinta-feira, 18/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 85 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min00s Z4 (197–227 W (91–105% do FTP)) · Principal 30min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 8min00s Z1 (86–119 W (40–55% do FTP)).
- **sexta-feira, 19/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 48 min.
  - Aquec. 7min12s Z1 (6:19–7:04/km) · Principal 31min12s Z2 (5:39–6:19/km) · Rec. 4min48s Z1 (6:19–7:04/km) · Volta à calma 4min48s Z1 (6:19–7:04/km).
- **sábado, 20/03** · Descanso.
- **domingo, 21/03** · Técnica · Natação · Build · Aeróbico e técnica · 28 min.
  - Aquec. 4min12s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min52s Z1 (2:01–2:09/100 m) · Rec. 2min48s Z1 (2:01–2:09/100 m) · Volta à calma 2min48s Z1 (2:01–2:09/100 m).

</details>

<details>
<summary>Semana 12 · descarga · 219 min</summary>

- **segunda-feira, 22/03** · Recuperação · Corrida · Build · Recuperação · 33 min.
  - Aquec. 4min57s Z1 (6:19–7:04/km) · Principal 21min27s Z1 (6:19–7:04/km) · Rec. 3min18s Z1 (6:19–7:04/km) · Volta à calma 3min18s Z1 (6:19–7:04/km).
- **terça-feira, 23/03** · Endurance leve · Natação · Build · Recuperação · 20 min.
  - Aquec. 3min00s Z1 (2:01–2:09/100 m) · Principal 13min00s Z2 (1:55–2:01/100 m) · Rec. 2min00s Z1 (2:01–2:09/100 m) · Volta à calma 2min00s Z1 (2:01–2:09/100 m).
- **quarta-feira, 24/03** · Endurance leve · Ciclismo · Build · Recuperação · 43 min.
  - Aquec. 6min27s Z1 (86–119 W (40–55% do FTP)) · Principal 27min57s Z2 (121–162 W (56–75% do FTP)) · Rec. 4min18s Z1 (86–119 W (40–55% do FTP)) · Volta à calma 4min18s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 25/03** · Recuperação · Corrida · Build · Recuperação · 33 min.
  - Aquec. 4min57s Z1 (6:19–7:04/km) · Principal 21min27s Z1 (6:19–7:04/km) · Rec. 3min18s Z1 (6:19–7:04/km) · Volta à calma 3min18s Z1 (6:19–7:04/km).
- **sexta-feira, 26/03** · Endurance leve · Natação · Build · Recuperação · 20 min.
  - Aquec. 3min00s Z1 (2:01–2:09/100 m) · Principal 13min00s Z2 (1:55–2:01/100 m) · Rec. 2min00s Z1 (2:01–2:09/100 m) · Volta à calma 2min00s Z1 (2:01–2:09/100 m).
- **sábado, 27/03** · Descanso.
- **domingo, 28/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 70 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min10s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min10s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min10s Z4 (197–227 W (91–105% do FTP)) · Principal 25min30s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 7min00s Z1 (86–119 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 13 · regular · 229 min</summary>

- **segunda-feira, 29/03** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **segunda-feira, 29/03** · Técnica · Natação · Build · Aeróbico e técnica · 19 min.
  - Aquec. 2min51s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min41s Z1 (2:01–2:09/100 m) · Rec. 1min54s Z1 (2:01–2:09/100 m) · Volta à calma 1min54s Z1 (2:01–2:09/100 m).
- **terça-feira, 30/03** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 58 min.
  - Aquec. 8min42s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Principal 2min30s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 5min48s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 31/03** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 25 min.
  - Aquec. 3min45s Z1 (6:19–7:04/km) · Principal 16min15s Z2 (5:39–6:19/km) · Rec. 2min30s Z1 (6:19–7:04/km) · Volta à calma 2min30s Z1 (6:19–7:04/km).
- **quinta-feira, 01/04** · Técnica · Natação · Build · Aeróbico e técnica · 19 min.
  - Aquec. 2min51s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min41s Z1 (2:01–2:09/100 m) · Rec. 1min54s Z1 (2:01–2:09/100 m) · Volta à calma 1min54s Z1 (2:01–2:09/100 m).
- **sexta-feira, 02/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 57 min.
  - Aquec. 8min33s Z1 (86–119 W (40–55% do FTP)) · Principal 5min50s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 5min50s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 5min50s Z4 (197–227 W (91–105% do FTP)) · Principal 19min15s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 5min42s Z1 (86–119 W (40–55% do FTP)).
- **sábado, 03/04** · Descanso.
- **domingo, 04/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 41 min.
  - Aquec. 6min09s Z1 (6:19–7:04/km) · Principal 26min39s Z2 (5:39–6:19/km) · Rec. 4min06s Z1 (6:19–7:04/km) · Volta à calma 4min06s Z1 (6:19–7:04/km).

</details>

<details>
<summary>Semana 14 · regular · 240 min</summary>

- **segunda-feira, 05/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 61 min.
  - Aquec. 9min09s Z1 (86–119 W (40–55% do FTP)) · Principal 6min42s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min42s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min42s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min42s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min42s Z4 (197–227 W (91–105% do FTP)) · Principal 0min15s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 6min06s Z1 (86–119 W (40–55% do FTP)).
- **segunda-feira, 05/04** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 06/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 35 min.
  - Aquec. 5min15s Z1 (6:19–7:04/km) · Principal 22min45s Z2 (5:39–6:19/km) · Rec. 3min30s Z1 (6:19–7:04/km) · Volta à calma 3min30s Z1 (6:19–7:04/km).
- **quarta-feira, 07/04** · Endurance leve · Natação · Build · Aeróbico e técnica · 20 min.
  - Aquec. 3min00s Z1 (2:01–2:09/100 m) · Principal 13min00s Z2 (1:55–2:01/100 m) · Rec. 2min00s Z1 (2:01–2:09/100 m) · Volta à calma 2min00s Z1 (2:01–2:09/100 m).
- **quinta-feira, 08/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 60 min.
  - Aquec. 9min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min20s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min20s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min20s Z4 (197–227 W (91–105% do FTP)) · Principal 20min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 6min00s Z1 (86–119 W (40–55% do FTP)).
- **sexta-feira, 09/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 34 min.
  - Aquec. 5min06s Z1 (6:19–7:04/km) · Principal 22min06s Z2 (5:39–6:19/km) · Rec. 3min24s Z1 (6:19–7:04/km) · Volta à calma 3min24s Z1 (6:19–7:04/km).
- **sábado, 10/04** · Descanso.
- **domingo, 11/04** · Endurance leve · Natação · Build · Aeróbico e técnica · 20 min.
  - Aquec. 3min00s Z1 (2:01–2:09/100 m) · Principal 13min00s Z2 (1:55–2:01/100 m) · Rec. 2min00s Z1 (2:01–2:09/100 m) · Volta à calma 2min00s Z1 (2:01–2:09/100 m).

</details>

<details>
<summary>Semana 15 · regular · 252 min</summary>

- **segunda-feira, 12/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 37 min.
  - Aquec. 5min33s Z1 (6:19–7:04/km) · Principal 24min03s Z2 (5:39–6:19/km) · Rec. 3min42s Z1 (6:19–7:04/km) · Volta à calma 3min42s Z1 (6:19–7:04/km).
- **segunda-feira, 12/04** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 13/04** · Técnica · Natação · Build · Aeróbico e técnica · 21 min.
  - Aquec. 3min09s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min59s Z1 (2:01–2:09/100 m) · Rec. 2min06s Z1 (2:01–2:09/100 m) · Volta à calma 2min06s Z1 (2:01–2:09/100 m).
- **quarta-feira, 14/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 49 min.
  - Aquec. 7min21s Z1 (86–119 W (40–55% do FTP)) · Principal 4min45s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 4min45s Z4 (197–227 W (91–105% do FTP)) · Principal 24min15s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min54s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 15/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 36 min.
  - Aquec. 5min24s Z1 (6:19–7:04/km) · Principal 23min24s Z2 (5:39–6:19/km) · Rec. 3min36s Z1 (6:19–7:04/km) · Volta à calma 3min36s Z1 (6:19–7:04/km).
- **sexta-feira, 16/04** · Técnica · Natação · Build · Aeróbico e técnica · 21 min.
  - Aquec. 3min09s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 1min59s Z1 (2:01–2:09/100 m) · Rec. 2min06s Z1 (2:01–2:09/100 m) · Volta à calma 2min06s Z1 (2:01–2:09/100 m).
- **sábado, 17/04** · Descanso.
- **domingo, 18/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 78 min.
  - Aquec. 10min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min30s Z4 (197–227 W (91–105% do FTP)) · Principal 0min12s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 7min48s Z1 (86–119 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 16 · descarga · 163 min</summary>

- **segunda-feira, 19/04** · Endurance leve · Natação · Build · Recuperação · 15 min.
  - Aquec. 2min15s Z1 (2:01–2:09/100 m) · Principal 9min45s Z2 (1:55–2:01/100 m) · Rec. 1min30s Z1 (2:01–2:09/100 m) · Volta à calma 1min30s Z1 (2:01–2:09/100 m).
- **terça-feira, 20/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 42 min.
  - Aquec. 6min18s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Principal 12min30s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min12s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 21/04** · Recuperação · Corrida · Build · Recuperação · 19 min.
  - Aquec. 2min51s Z1 (6:19–7:04/km) · Principal 12min21s Z1 (6:19–7:04/km) · Rec. 1min54s Z1 (6:19–7:04/km) · Volta à calma 1min54s Z1 (6:19–7:04/km).
- **quinta-feira, 22/04** · Endurance leve · Natação · Build · Recuperação · 15 min.
  - Aquec. 2min15s Z1 (2:01–2:09/100 m) · Principal 9min45s Z2 (1:55–2:01/100 m) · Rec. 1min30s Z1 (2:01–2:09/100 m) · Volta à calma 1min30s Z1 (2:01–2:09/100 m).
- **sexta-feira, 23/04** · Cadência · Ciclismo · Build · Recuperação · 42 min.
  - Aquec. 6min18s Z1 (86–119 W (40–55% do FTP)) · Principal 9min06s Z2 (121–162 W (56–75% do FTP)) · Principal 9min06s Z2 (121–162 W (56–75% do FTP)) · Principal 9min06s Z2 (121–162 W (56–75% do FTP)) · Rec. 4min12s Z1 (86–119 W (40–55% do FTP)) · Volta à calma 4min12s Z1 (86–119 W (40–55% do FTP)).
- **sábado, 24/04** · Descanso.
- **domingo, 25/04** · Recuperação · Corrida · Build · Recuperação · 30 min.
  - Aquec. 4min30s Z1 (6:19–7:04/km) · Principal 19min30s Z1 (6:19–7:04/km) · Rec. 3min00s Z1 (6:19–7:04/km) · Volta à calma 3min00s Z1 (6:19–7:04/km).

</details>

<details>
<summary>Semana 17 · regular · 171 min</summary>

- **segunda-feira, 26/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 43 min.
  - Aquec. 6min27s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Principal 2min15s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min18s Z1 (86–119 W (40–55% do FTP)).
- **segunda-feira, 26/04** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 27/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 24 min.
  - Aquec. 3min36s Z1 (6:19–7:04/km) · Principal 15min36s Z2 (5:39–6:19/km) · Rec. 2min24s Z1 (6:19–7:04/km) · Volta à calma 2min24s Z1 (6:19–7:04/km).
- **quarta-feira, 28/04** · Técnica · Natação · Build · Aeróbico e técnica · 14 min.
  - Aquec. 2min06s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min06s passivo · Rec. 1min24s Z1 (2:01–2:09/100 m) · Volta à calma 1min24s Z1 (2:01–2:09/100 m).
- **quinta-feira, 29/04** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 42 min.
  - Aquec. 6min18s Z1 (86–119 W (40–55% do FTP)) · Principal 6min15s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min15s Z4 (197–227 W (91–105% do FTP)) · Principal 16min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min12s Z1 (86–119 W (40–55% do FTP)).
- **sexta-feira, 30/04** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 24 min.
  - Aquec. 3min36s Z1 (6:19–7:04/km) · Principal 15min36s Z2 (5:39–6:19/km) · Rec. 2min24s Z1 (6:19–7:04/km) · Volta à calma 2min24s Z1 (6:19–7:04/km).
- **sábado, 01/05** · Descanso.
- **domingo, 02/05** · Técnica · Natação · Build · Aeróbico e técnica · 14 min.
  - Aquec. 2min06s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min06s passivo · Rec. 1min24s Z1 (2:01–2:09/100 m) · Volta à calma 1min24s Z1 (2:01–2:09/100 m).

</details>

<details>
<summary>Semana 18 · regular · 179 min</summary>

- **segunda-feira, 03/05** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 26 min.
  - Aquec. 3min54s Z1 (6:19–7:04/km) · Principal 16min54s Z2 (5:39–6:19/km) · Rec. 2min36s Z1 (6:19–7:04/km) · Volta à calma 2min36s Z1 (6:19–7:04/km).
- **segunda-feira, 03/05** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **terça-feira, 04/05** · Endurance leve · Natação · Build · Aeróbico e técnica · 15 min.
  - Aquec. 2min15s Z1 (2:01–2:09/100 m) · Principal 9min45s Z2 (1:55–2:01/100 m) · Rec. 1min30s Z1 (2:01–2:09/100 m) · Volta à calma 1min30s Z1 (2:01–2:09/100 m).
- **quarta-feira, 05/05** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 34 min.
  - Aquec. 5min06s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Principal 18min00s Z2 (121–162 W (56–75% do FTP)) · Rec. 1min00s Z1 (86–119 W (40–55% do FTP)) · Volta à calma 3min24s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 06/05** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 25 min.
  - Aquec. 3min45s Z1 (6:19–7:04/km) · Principal 16min15s Z2 (5:39–6:19/km) · Rec. 2min30s Z1 (6:19–7:04/km) · Volta à calma 2min30s Z1 (6:19–7:04/km).
- **sexta-feira, 07/05** · Endurance leve · Natação · Build · Aeróbico e técnica · 14 min.
  - Aquec. 2min06s Z1 (2:01–2:09/100 m) · Principal 9min06s Z2 (1:55–2:01/100 m) · Rec. 1min24s Z1 (2:01–2:09/100 m) · Volta à calma 1min24s Z1 (2:01–2:09/100 m).
- **sábado, 08/05** · Descanso.
- **domingo, 09/05** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 55 min.
  - Aquec. 8min15s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 8min00s Z4 (197–227 W (91–105% do FTP)) · Principal 0min15s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 5min30s Z1 (86–119 W (40–55% do FTP)).

</details>

<details>
<summary>Semana 19 · regular · 187 min</summary>

- **segunda-feira, 10/05** · Endurance leve · Força e mobilidade · Build · Aeróbico e técnica · 10 min.
  - Aquec. 1min30s Z1 (Percepção 2–3/10, confortável e conversacional) · Principal 6min30s Z2 (Percepção 2–3/10, confortável e conversacional) · Rec. 1min00s passivo · Volta à calma 1min00s Z1 (Percepção 2–3/10, confortável e conversacional).
- **segunda-feira, 10/05** · Técnica · Natação · Build · Aeróbico e técnica · 15 min.
  - Aquec. 2min15s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min25s Z1 (2:01–2:09/100 m) · Rec. 1min30s Z1 (2:01–2:09/100 m) · Volta à calma 1min30s Z1 (2:01–2:09/100 m).
- **terça-feira, 11/05** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 47 min.
  - Aquec. 7min03s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min30s Z4 (197–227 W (91–105% do FTP)) · Principal 0min15s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min42s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 12/05** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 20 min.
  - Aquec. 3min00s Z1 (6:19–7:04/km) · Principal 13min00s Z2 (5:39–6:19/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Volta à calma 2min00s Z1 (6:19–7:04/km).
- **quinta-feira, 13/05** · Técnica · Natação · Build · Aeróbico e técnica · 15 min.
  - Aquec. 2min15s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min25s Z1 (2:01–2:09/100 m) · Rec. 1min30s Z1 (2:01–2:09/100 m) · Volta à calma 1min30s Z1 (2:01–2:09/100 m).
- **sexta-feira, 14/05** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 47 min.
  - Aquec. 7min03s Z1 (86–119 W (40–55% do FTP)) · Principal 7min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min00s Z4 (197–227 W (91–105% do FTP)) · Principal 18min15s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min42s Z1 (86–119 W (40–55% do FTP)).
- **sábado, 15/05** · Descanso.
- **domingo, 16/05** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 33 min.
  - Aquec. 4min57s Z1 (6:19–7:04/km) · Principal 21min27s Z2 (5:39–6:19/km) · Rec. 3min18s Z1 (6:19–7:04/km) · Volta à calma 3min18s Z1 (6:19–7:04/km).

</details>

<details>
<summary>Semana 20 · descarga · 121 min</summary>

- **segunda-feira, 17/05** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 32 min.
  - Aquec. 4min48s Z1 (86–119 W (40–55% do FTP)) · Principal 6min00s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 6min00s Z4 (197–227 W (91–105% do FTP)) · Principal 9min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 3min12s Z1 (86–119 W (40–55% do FTP)).
- **terça-feira, 18/05** · Recuperação · Corrida · Build · Recuperação · 18 min.
  - Aquec. 2min42s Z1 (6:19–7:04/km) · Principal 11min42s Z1 (6:19–7:04/km) · Rec. 1min48s Z1 (6:19–7:04/km) · Volta à calma 1min48s Z1 (6:19–7:04/km).
- **quarta-feira, 19/05** · Endurance leve · Natação · Build · Recuperação · 11 min.
  - Aquec. 1min39s Z1 (2:01–2:09/100 m) · Principal 7min09s Z2 (1:55–2:01/100 m) · Rec. 1min06s Z1 (2:01–2:09/100 m) · Volta à calma 1min06s Z1 (2:01–2:09/100 m).
- **quinta-feira, 20/05** · Endurance leve · Ciclismo · Build · Recuperação · 31 min.
  - Aquec. 4min39s Z1 (86–119 W (40–55% do FTP)) · Principal 20min09s Z2 (121–162 W (56–75% do FTP)) · Rec. 3min06s Z1 (86–119 W (40–55% do FTP)) · Volta à calma 3min06s Z1 (86–119 W (40–55% do FTP)).
- **sexta-feira, 21/05** · Recuperação · Corrida · Build · Recuperação · 18 min.
  - Aquec. 2min42s Z1 (6:19–7:04/km) · Principal 11min42s Z1 (6:19–7:04/km) · Rec. 1min48s Z1 (6:19–7:04/km) · Volta à calma 1min48s Z1 (6:19–7:04/km).
- **sábado, 22/05** · Descanso.
- **domingo, 23/05** · Endurance leve · Natação · Build · Recuperação · 11 min.
  - Aquec. 1min39s Z1 (2:01–2:09/100 m) · Principal 7min09s Z2 (1:55–2:01/100 m) · Rec. 1min06s Z1 (2:01–2:09/100 m) · Volta à calma 1min06s Z1 (2:01–2:09/100 m).

</details>

<details>
<summary>Semana 21 · regular · 127 min</summary>

- **segunda-feira, 24/05** · Rodagem leve · Corrida · Build · Aeróbico e técnica · 38 min.
  - Aquec. 5min42s Z1 (6:19–7:04/km) · Principal 24min42s Z2 (5:39–6:19/km) · Rec. 3min48s Z1 (6:19–7:04/km) · Volta à calma 3min48s Z1 (6:19–7:04/km).
- **terça-feira, 25/05** · Técnica · Natação · Build · Aeróbico e técnica · 23 min.
  - Aquec. 3min27s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min57s Z1 (2:01–2:09/100 m) · Rec. 2min18s Z1 (2:01–2:09/100 m) · Volta à calma 2min18s Z1 (2:01–2:09/100 m).
- **quarta-feira, 26/05** · Intervalos longos · Ciclismo · Build · Intervalos estruturados · 66 min.
  - Aquec. 9min54s Z1 (86–119 W (40–55% do FTP)) · Principal 7min07s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min07s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min07s Z4 (197–227 W (91–105% do FTP)) · Rec. 3min00s Z1 (86–119 W (40–55% do FTP)) · Principal 7min09s Z4 (197–227 W (91–105% do FTP)) · Principal 12min00s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 6min36s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 27/05** · Descanso.
- **sexta-feira, 28/05** · Descanso.
- **sábado, 29/05** · Descanso.
- **domingo, 30/05** · Descanso.

</details>

<details>
<summary>Semana 22 · polimento · 76 min</summary>

- **segunda-feira, 31/05** · Endurance leve · Natação · Peak · Aeróbico e técnica · 14 min.
  - Aquec. 2min06s Z1 (2:01–2:09/100 m) · Principal 9min06s Z2 (1:55–2:01/100 m) · Rec. 1min24s Z1 (2:01–2:09/100 m) · Volta à calma 1min24s Z1 (2:01–2:09/100 m).
- **terça-feira, 01/06** · Intervalos longos · Ciclismo · Peak · Intervalos estruturados · 39 min.
  - Aquec. 5min51s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Principal 15min39s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min00s Z1 (86–119 W (40–55% do FTP)).
- **quarta-feira, 02/06** · Rodagem leve · Corrida · Peak · Aeróbico e técnica · 23 min.
  - Aquec. 3min27s Z1 (6:19–7:04/km) · Principal 14min57s Z2 (5:39–6:19/km) · Rec. 2min18s Z1 (6:19–7:04/km) · Volta à calma 2min18s Z1 (6:19–7:04/km).
- **quinta-feira, 03/06** · Descanso.
- **sexta-feira, 04/06** · Descanso.
- **sábado, 05/06** · Descanso.
- **domingo, 06/06** · Descanso.

</details>

<details>
<summary>Semana 23 · polimento · 64 min</summary>

- **segunda-feira, 07/06** · Intervalos longos · Ciclismo · Peak · Intervalos estruturados · 33 min.
  - Aquec. 5min00s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min30s Z4 (197–227 W (91–105% do FTP)) · Principal 13min30s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min00s Z1 (86–119 W (40–55% do FTP)).
- **terça-feira, 08/06** · Rodagem leve · Corrida · Peak · Aeróbico e técnica · 19 min.
  - Aquec. 2min51s Z1 (6:19–7:04/km) · Principal 12min21s Z2 (5:39–6:19/km) · Rec. 1min54s Z1 (6:19–7:04/km) · Volta à calma 1min54s Z1 (6:19–7:04/km).
- **quarta-feira, 09/06** · Técnica · Natação · Peak · Aeróbico e técnica · 12 min.
  - Aquec. 1min48s Z1 (2:01–2:09/100 m) · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 2min00s Z1 (2:01–2:09/100 m) · Rec. 0min20s passivo · Principal 0min48s Z1 (2:01–2:09/100 m) · Rec. 1min12s Z1 (2:01–2:09/100 m) · Volta à calma 1min12s Z1 (2:01–2:09/100 m).
- **quinta-feira, 10/06** · Descanso.
- **sexta-feira, 11/06** · Descanso.
- **sábado, 12/06** · Descanso.
- **domingo, 13/06** · Descanso.

</details>

<details>
<summary>Semana 24 · polimento · 51 min</summary>

- **segunda-feira, 14/06** · Rodagem leve · Corrida · Race · Aeróbico e técnica · 20 min.
  - Aquec. 3min00s Z1 (6:19–7:04/km) · Principal 13min00s Z2 (5:39–6:19/km) · Rec. 2min00s Z1 (6:19–7:04/km) · Volta à calma 2min00s Z1 (6:19–7:04/km).
- **terça-feira, 15/06** · Descanso.
- **quarta-feira, 16/06** · Intervalos longos · Ciclismo · Race · Intervalos estruturados · 31 min.
  - Aquec. 5min00s Z1 (86–119 W (40–55% do FTP)) · Principal 1min15s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min15s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min15s Z4 (197–227 W (91–105% do FTP)) · Rec. 1min30s Z1 (86–119 W (40–55% do FTP)) · Principal 1min15s Z4 (197–227 W (91–105% do FTP)) · Principal 12min30s Z2 (121–162 W (56–75% do FTP)) · Volta à calma 4min00s Z1 (86–119 W (40–55% do FTP)).
- **quinta-feira, 17/06** · Descanso.
- **sexta-feira, 18/06** · Descanso.
- **sábado, 19/06** · Descanso.
- **domingo, 20/06** · Prova-alvo, registrada à parte.

</details>

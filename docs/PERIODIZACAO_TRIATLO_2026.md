# Gotri: periodização individualizada de triathlon

Revisão de 18/11/2026. Trabalho incremental sobre 4b9cf16, com nova migração aditiva. Nome preservado. Nenhum banco foi redefinido, atleta apagado ou treino concluído recalculado pela mudança de FTP.

## Mudanças e arquivos

| Achado concreto | Implementação | Impacto |
|---|---|---|
| Dias de modalidade eram confundidos com disponibilidade | Preferências opcionais em `planningPreferences`; dias permitidos separados de dias preferidos, descanso reservado, minutos por dia, máximo por sessão, sessões duplas e volume recente por modalidade | Planejamento limitado pela rotina e histórico informado; conflitos não viram sessões extras |
| Não havia brick explícito | Dupla bike → corrida nos dias escolhidos, somente em construção, fora de recuperação/taper e após adaptação; corrida de transição com limite progressivo | Treino de transição identificável, sem exigir intensidade ou prometer prontidão |
| Pouca diferenciação dos estímulos | Sessões fáceis, longos preferidos, blocos curtos/longos, ritmo Z3, cadência confortável e técnica na piscina | Objetivo, duração, recuperação e alvos entram nos blocos; natação básica segue conservadora |
| FTP só valia para novas gerações | `refreshFutureBikeTargets` dentro da transação de perfil/triagem; refaz alvos das sessões de ciclismo não concluídas, a partir de hoje, em planos ativos/manuais | Duração não muda; sessões concluídas e planos arquivados não são reescritos |
| Edição não tinha revisão semanal | `/api/week-review` verifica dias, volume, sessões duplas, máximos e proximidade de estímulos; considera dor/fadiga/sono recentes | Mostra conflitos e espaços de agenda; nunca acumula faltas automaticamente |
| Faltavam ações conservadoras | Mover, encurtar, substituir, pausar/retomar no calendário; revisão da semana relevante é aberta após a alteração | Histórico preservado; pausa é reversível e não entra como falta ou em exportação de plano ativo |
| Realizado era fácil de confundir com prescrito | `SeasonSummary` e `analyzeSeason`: blocos de até quatro semanas, volume por modalidade e total, intensidade planejada ponderada e minutos realizados separados | Sem amostras reais por tempo, distribuição realizada é declarada desconhecida |
| Visual não tinha foco escuro | Preto/grafite, texto claro e destaque laranja; nova preferência de tema começa escura; tema claro continua opcional | Calendário semanal inicial, fase e sessão de hoje/próxima sessão em destaque |

Módulos: `lib/planning-preferences.ts`, `lib/training-structure.ts`, `lib/workout-reassessment.ts`, `lib/season-analysis.ts`; novas APIs `week-review` e `workouts/adapt`; componentes de preferências, revisão, ações e temporada; APIs de perfil/triagem; calendário, painel e plano. [Plano registrado antes da implementação](PERIODIZACAO_TRIATLO_PLANO.md).

## O que as preferências significam

Disponibilidade é um limite; marcar tiros, ritmo, longo ou natação é uma preferência de encaixe. Descanso reservado bloqueia o dia. Um dia não se torna disponível porque recebeu uma preferência. A agenda de modalidades existente continua válida: se nela há uma modalidade incompatível, a preferência pode não ser atendida, com aviso. Abaixo da duração mínima viável ou diante de recuperação insuficiente, o motor deixa volume sem alocar em vez de comprimir tudo.

Nas configurações novas, uma sessão é permitida por dia, ou até duas nos dias assinalados. Perfis legados sem essa configuração conservam a política anterior até confirmação. Preferências salvas não reescrevem silenciosamente o plano antigo: a revisão semanal passa a apontar conflitos e a nova geração usa os novos limites. Mover a preferência do longo modifica os próximos planos; uma sessão salva pode ser movida com a ação do calendário.

Volume recente por modalidade é teto inicial operacional, com referência mínima conservadora de 20 min/semana para modalidade declarada com volume zero. Não é uma recomendação universal nem uma avaliação de capacidade. Sem volume específico informado, continua a referência semanal total e os limites por experiência, com aviso. Força permanece fora dos minutos de endurance e requer disponibilidade e orientação para exercícios/cargas.

Bricks exigem consentimento para duas sessões, fase de construção, ausência de impedimentos e pelo menos duas semanas de adaptação operacional (quatro para iniciante). Não são programados automaticamente no taper, na recuperação ou no retorno com restrição. Corrida de transição: até 10 min para iniciante; para intermediário/avançado, limite operacional de 10 + 2 × índice da semana, até 35 min, sempre sujeito ao orçamento e à tolerância. Esses números são escolhas do produto, não doses validadas por estudo.

## Temporada, blocos e carga

A prova A futura orienta o horizonte; na ausência de A, a primeira prova futura. As outras datas de prova são reservadas e competições próximas geram aviso. O ciclo é dividido em semanas, agrupadas na interface em blocos de até quatro; Base, Construção/especificidade, Redução pré-prova, Prova e Recuperação ficam explícitas. Não há otimizador de múltiplos picos ou de temporadas sucessivas. Sem prova válida, não se inventa competição.

O motor conserva semanas mais leves programadas e usa sono, fadiga, dor e aderência para limitar a geração solicitada. A progressão continua dependente de relatos favoráveis, não apenas da passagem do tempo. Minutos são medida externa de volume, não TSS nem medida de estresse fisiológico. Alterações ficam sob controle da pessoa; a revisão propõe alternativas de agenda e solicita revisão do coach para conflitos de carga. Um espaço livre não significa que a pessoa esteja recuperada para outro treino.

Se não houver foco específico salvo, distâncias reconhecidas da prova prioritária orientam o foco (supersprint, sprint, olímpico, 70.3/full no triathlon; distâncias reconhecidas na corrida), com aviso da origem. Distâncias desconhecidas não são convertidas em metas presumidas. Uma escolha explícita de foco continua prioritária; divergências com a prova devem ser revistas pelo coach.

## Modelo de intensidade e 80/20

O modelo fisiológico de três zonas usa: **baixa abaixo de LT1/VT1; moderada entre LT1/VT1 e LT2/VT2; alta acima de LT2/VT2**. Lactato e ventilação são métodos de avaliação diferentes, não garantias de equivalência perfeita. O app não mede esses limiares.

Como os perfis normalmente não têm ambos os limiares medidos por modalidade, o relatório é identificado como **aproximação operacional**: zonas exibidas Z1–Z2 → baixa, Z3 → moderada, Z4–Z5 → alta. Uma zona relativa a FTP/CSS/pace pode cruzar um limiar real; a associação não é uma tradução fisiológica exata. Não se deve anunciar polarização fisiologicamente medida a partir dela.

A referência solicitada para o bloco é cerca de 80% baixo e 20% **moderado + alto**, com somas ponderadas pelos segundos. Aquecimento, recuperação ativa e desaquecimento entram de acordo com o alvo. Repouso passivo e força ficam separados. O limitador considera moderado + alto, não só Z4–Z5. Recuperação, iniciação, taper e restrições reduzem essa fração; não se insere esforço para fechar 20% numa semana. O relatório mostra o que foi realmente prescrito.

**Realizado:** duração registrada é volume realizado. FC média, FTP do perfil ou PSE global não revelam quanto tempo foi passado em cada zona. Sem amostras temporais verificadas, os percentuais reais permanecem desconhecidos; o app não copia os percentuais do plano para apresentá-los como execução.

## Potência

Modelo de cinco faixas derivado dos níveis de Coggan: Z1 40–55%, Z2 56–75%, Z3 76–90%, Z4 91–105%, Z5 106–120% do FTP. O piso de Z1 é limite operacional, e níveis anaeróbicos adicionais não são automatizados. Cada bloco com potência apresenta zona, percentuais e watts. Exemplo FTP 200 W, Z2: 112–150 W. FTP 250 W: 140–188 W, arredondamento inteiro. Sem medidor/rolo compatível, PSE; não se estimam watts ou FC pelo nível do atleta.

Ao mudar FTP/equipamento por perfil ou triagem, a atualização dos alvos futuros ocorre atomicamente com o perfil. Não altera minutos e não libera treino intenso após um salto de FTP; os blocos recebem aviso de revisão. [Semanas fictícias e alvos completos](EXEMPLOS_TRIATLO_2026.md).

## Fontes, qualidade e decisões

Consulta: 18/11/2026. Fontes abaixo complementam a [revisão científica anterior](AUDITORIA_CIENTIFICA_2026.md). Não foi conduzida revisão sistemática original nem ensaio humano do aplicativo.

| Fonte verificável | Natureza e limites | Decisão sustentada |
|---|---|---|
| Seiler e Kjerland, Noruega, fevereiro/2006. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16430681/), DOI [10.1111/j.1600-0838.2004.00418.x](https://doi.org/10.1111/j.1600-0838.2004.00418.x) | Estudo observacional em esquiadores jovens bem treinados; compara formas de quantificar intensidade. Não valida proporção universal para triatletas iniciantes. | Diferenciar métodos e contar tempo de intensidade, sem chamar frequência de sessões de tempo em zona. |
| Joe Friel, EUA, [Training Week Design, 12/11/2011](https://joefrieltraining.com/training-week-design/) | Prática original de treinador, individualizando semana e sessões-âncora; não ensaio controlado. | Preferências, disponibilidade de piscina, sessões-chave e recuperação, com explicação de conflitos. |
| Joe Friel, [Build Period Overview, 10/01/2011](https://joefrieltraining.com/build-period-overview/) e [Base 2 and 3, 22/11/2010](https://joefrieltraining.com/training-in-base-2-and-3/) | Prática de progressiva especificidade; distância altera as exigências. Não define um único taper ou volume para todos. | Construção ligada à prova, técnica/base antes da especificidade e transições condicionadas ao contexto. |
| World Triathlon, [Rest & Recovery CPD Curriculum, janeiro/2025](https://cms.triathlon.org/assets/13efb3e1-4d59-42de-a11d-36f8d7c0939a) | Currículo internacional introdutório, com Lorena Torres Ronda e equipe espanhola; orientação federativa, não validação das constantes do app. | Integrar sono, recuperação e periodização, sem diagnóstico ou promessa de prevenção de lesões. Não automatizar terapias mencionadas no currículo. |
| Coggan/TrainingPeaks, [Power Training Levels](https://www.trainingpeaks.com/blog/power-training-levels/) | Modelo operacional de potência, dependente de FTP e equipamento; não mede LT1/LT2 individualmente. | Percentual e watts por bloco, fonte explícita e fallback de percepção. |
| Wang et al., 2023, [DOI 10.1371/journal.pone.0282838](https://pmc.ncbi.nlm.nih.gov/articles/PMC10171681/) | Síntese sobre taper em atletas de endurance; protocolos e populações limitam extrapolação. | Redução pré-prova, sem recuperar faltas acumulando volume. O motor não reproduz integralmente um protocolo individualizado da síntese. |
| Rosenblat et al., 2025, [DOI 10.1007/s40279-024-02149-3](https://doi.org/10.1007/s40279-024-02149-3) | Não demonstra superioridade global universal do polarizado sobre piramidal; nível e método de contagem importam. | 80/20 como referência operacional ajustável, sem alegação de superioridade ou eficácia clínica do gerador. |

A página USA Triathlon sobre ciclismo/bricks foi localizada, mas o acesso integral retornou 403; seu trecho de busca não sustenta uma dose numérica implementada. As regras quantitativas de brick, 48h/dias de espaçamento, progressão e mínimos de duração continuam identificadas como políticas auditáveis do produto.

## Validação e limites

Casos automatizados: iniciante com poucos dias, intermediário, ciclista com/sem potência, mudança do longo, brick com/sem autorização de sessão dupla, volume recente por esporte, dados desconhecidos, fadiga, faltas, taper, retarget de FTP, soma de blocos e ponderação de intensidade. Integração real em banco isolado verifica atualização futura de FTP preservando uma sessão concluída, bloqueio entre atletas, pausa/volume semanal, retomada e encurtamento.

Novas sessões não são validação clínica. Permanecem sem integração de séries temporais reais por zona, gravação GPS, otimização de múltiplos picos, sincronização Strava/Garmin e validação física em Safari/iPhone. Ajustes não reorganizam silenciosamente toda a semana; mostram conflitos e alternativas para decisão. Exercícios/cargas de força, retorno com dor e águas abertas continuam sob orientação competente. Não há migração destrutiva nem alteração de nome.

Comandos: `npm ci`, configurar `.env` privado/PostgreSQL, `npm run db:migrate`, `npm run dev`. Validar com `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; integração somente em PostgreSQL isolado. Nunca aplicar reset do banco na produção. Recuperação de código: commit-base documentado; colunas aditivas podem permanecer ao restaurar código anterior.

## Fechamento da validação — 19/11/2026

- 165 testes automatizados aprovados; 30 cenários HTTP/PostgreSQL aprovados, em contas fictícias isoladas; autenticação HTTP 10/10. O CI também executa recuperação por SMTP TLS local.
- Tipos, linter e build de produção aprovados; verificação de padrões de segredo sem ocorrências. Dados de teste, credenciais e backups não são entregues no Git.
- Chrome: disponibilidade conferida em 320, 390, 768 e 1280 px, sem excesso de largura da página; tabelas têm rolagem interna. Pausa de sessão fictícia mudou a revisão semanal de 300 para 253 minutos; retomada restaurou a sessão. Preferência de máximo de 90 minutos salva pela interface e confirmada. Painel e blocos conferidos; não é teste físico de Android/iPhone ou Safari.
- Regressão TCX encontrada e corrigida: rótulos numerados de técnica/caminhada impediam comprimir repetições equivalentes. O exportador agora reconhece esses rótulos sem mudar segundos, alvos ou ordem. Teste de 90 minutos de natação verifica exportação sem alterar a estrutura original.
- O teste de integração novo inicialmente omitiu a descrição obrigatória ao criar uma sessão fictícia; a fixture foi corrigida. Nenhum requisito do banco foi relaxado.
- Regressão de fronteira de fase coberta: brick só quando a própria data da sessão está em construção, não apenas o fim da semana. Longo e brick no mesmo dia podem compartilhar a preferência sem ignorar os limites da corrida de transição.

![Painel escuro com conta fictícia](evidencias-triatlo/painel-mobile.jpg)

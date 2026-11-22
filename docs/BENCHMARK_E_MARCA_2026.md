# Benchmark, naming e posicionamento — 16/11/2026

## Benchmark documental

Consulta a páginas oficiais; não houve assinatura de planos, reprodução de telas nem teste comparativo com atletas. Afirmações dos fornecedores descrevem produto, não comprovam superioridade clínica. O app preserva sua linguagem e seus componentes.

| Plataforma / fonte | Padrão observado | Decisão para Gotri |
|---|---|---|
| [TrainingPeaks: construtor estruturado](https://help.trainingpeaks.com/hc/en-us/articles/235164967-Structured-Workout-Builder) | Blocos com tempo/distância e intensidade por potência, pace, FC ou esforço | Exibir estrutura e soma da duração; preservar dados ao editar. |
| [Runna: planos](https://www.runna.com/training/training-plans), [força](https://support.runna.com/en/articles/15624879-adding-strength-training-to-your-runna-plan) | Onboarding ligado a rotina, objetivos e equipamentos; força com configuração própria | Triagem em etapas, disponibilidade por dia e força explícita. Não assumir como seu modelo adaptativo interno funciona. |
| [Garmin: calendário](https://support.garmin.com/en-IN/?faq=XRcMvEtKdf7yBf8My9jua6), [Triathlon Coach](https://support.garmin.com/en-US/?faq=ECq7okB1qH3JhlHZhzkEO6) | Calendário e planos orientados a prova; execução depende de aparelho compatível | Prioridade/data da prova e acesso direto ao próximo treino. Não chamar arquivo FIT de sincronização de calendário. |
| [Athletica: FAQ](https://athletica.ai/frequently-asked-questions) | Respostas reais do atleta participam de adaptação | Feedback transparente com motivos e limites; não alegar equivalência ao otimizador comercial. |
| [TriDot](https://tridot.com/) | Proposta de personalização entre modalidades | Respeitar orçamento compartilhado de triathlon; evitar treinos fortes acumulados. As alegações comerciais de redução de lesão não foram reproduzidas. |
| [JOIN Plan](https://help.join.cc/hc/en-150/articles/42801206411537-What-is-the-JOIN-Plan) | Contexto de progresso e estado do dia em visão resumida | Próximo treino, semana e recuperação juntos; estado só com evidência. |
| [TrainerRoad: Adaptive Training](https://www.trainerroad.com/blog/how-to-use-adaptive-training/) | Ajustes associados ao calendário e respostas ao treino | Separar indicação de ajuste de alteração salva; não compensar sessão perdida automaticamente. |
| [Intervals.icu: API](https://www.intervals.icu/features/open-api/) | Atividades, wellness e treinos acessíveis por API | Manter integração existente e proteger chave; não publicar dados privados em cache. |
| [Final Surge: aplicativo](https://www.finalsurge.com/app) | Calendário e movimentação de sessões | Manter edição/reagendamento e conclusão com check-in; não esconder exportação em função de decoração. |
| [Strava Developers](https://developers.strava.com/docs/authentication/) | Aplicativo registrado, OAuth e escopos; revogação documentada | Tela existente preservada com pendência de implementação. Não simular importação ou conexão. |

Diferencial implementado: explicações acessíveis de como a disponibilidade, o afastamento e os check-ins alteram a prescrição; dados ausentes aparecem como ausentes. Não transformar uma pontuação visual de recuperação em diagnóstico.

## Integrações e formatos

- [Garmin Training API](https://developer.garmin.com/gc-developer-program/enterprise/training-api/): publicação de treinos/calendário requer programa e acesso autorizado. Sem aprovação/credenciais, manter arquivos; não automatizar login do usuário para contornar API.
- [Strava OAuth](https://developers.strava.com/docs/authentication/): cadastro de aplicativo, consentimento e escopos são necessários. A documentação registra endpoint de revogação disponível em 2026. Faltam os módulos que o usuário se dispôs a fornecer.
- TrainingPeaks: builder e formatos documentados não constituem autorização de integração. Não há chave/parceria registrada neste projeto; exportação TCX é intercâmbio, compatibilidade final deve ser testada no destino.
- [Intervals.icu, guia de upload](https://forum.intervals.icu/t/uploading-planned-workouts-to-intervals-icu/63624): aceita arquivos ZWO/FIT/MRC/ERG ou descrição nativa. O envio atual usa a estrutura e a chave do proprietário; não foi realizado envio externo nesta auditoria.
- [Zwift: custom workouts](https://support.zwift.com/fr/-ryGOTVEPs): documentação declara ZWO e limite de 250 blocos. FIT/TCX têm semânticas diferentes. RPE/pace sem equivalência de potência não viram watts inventados. Arquivos longos e importações precisam de ensaio no destino.
- [MyWhoosh: Workout Builder](https://www.mywhoosh.com/everything-you-need-to-know-about-the-new-mywhoosh-workout-builder/), [portal](https://workout.mywhoosh.com/): recursos próprios e conta são exigidos. Exportar ZWO não comprova sincronização. MRC/ERG não foram acrescentados: o ZIP já oferece os formatos usados, e a disponibilidade declarada pelo destino não justifica um novo formato sem validação da modalidade.

## Vinte direções de nome

Conceitos de criação, sem alegação de ineditismo mundial. Potencial de memória é avaliação editorial, não pesquisa de mercado. Riscos se referem a colisão e distintividade preliminares; nenhum nome está liberado juridicamente.

| Nome | Significado / conceito | Posicionamento | Memória / pronúncia | Slogan possível | Risco preliminar |
|---|---|---|---|---|---|
| Cadorya | Cadência + trajetória | Orientação precisa e humana | Forte; ca-do-ria | Cada sessão tem direção. | Sem colisão óbvia na busca exata; registros/handles pendentes. |
| Nivorya | Nível + caminho | Evolução sustentável | Forte; ni-vó-ria | Evolua no seu contexto. | Domínio .com já retorna registro; não recomendado como primeira opção. |
| Orvexa | Órbita + vetor | Método e direção | Curto; or-vé-xa | Encontre seu próximo ritmo. | Alto: aplicativo homônimo encontrado no Google Play. |
| Alviora | Alvo + movimento | Planejamento inteligente | Fluido; al-vi-ó-ra | Seu objetivo, em movimento. | Alto: empresas e apps de software homônimos encontrados. |
| Ritmora | Ritmo + agora | Rotina esportiva | Fácil em português | Um ritmo que faz sentido. | Alto: comércio/vestuário e suplementos com o nome. |
| Voryn | Vigor + ordem | Performance técnica | Forte; vó-rin | Treine com intenção. | Alto: Voryn Connect e outros usos digitais. |
| Avyren | Avanço + duração | Endurance internacional | Pronúncia precisa ser ensinada | Progresso, sem atalhos. | Alto: empresa de software e vestuário homônimos. |
| Noryth | Norte + ritmo | Inteligência de treino | Memorável, grafia menos simples | Encontre sua constância. | Alto: empresa de IA e jogo homônimos. |
| Velunor | Velocidade + norte | Precisão multiesporte | Forte; ve-lu-nor | Mova-se com propósito. | Alto: estúdio de jogos com apps e presença social identificados. |
| Eluntra | Evolução + trajetória | Premium acessível | Fluido; e-lun-tra | Treinar. Entender. Evoluir. | Não verificado; semelhanças fonéticas devem ser pesquisadas. |
| Cadenzae | Cadência + continuidade | Método e disciplina | Mais distinto, grafia complexa | Dê forma à consistência. | Raiz musical concorrida; não verificado. |
| Trajora | Trajetória + agora | Foco na execução diária | Simples; tra-jó-ra | Hoje constrói seu percurso. | Não verificado. |
| Auvecta | Movimento + vetor | Tecnologia com clareza | Média; au-véc-ta | Contexto para avançar. | Raiz vetor usada em tecnologia; não verificado. |
| Oridra | Origem + direção | Coaching próximo | Boa; o-ri-dra | Seu ponto de partida importa. | Não verificado. |
| Veltiva | Velocidade + ativo | Energia controlada | Boa; vel-ti-va | Seu treino, com intenção. | Próximo de raízes comerciais frequentes; não verificado. |
| Senvora | Sentir + evolução | Dados e percepção | Forte; sen-vó-ra | Escute. Ajuste. Evolua. | Não verificado; possível proximidade fonética em saúde. |
| Triavé | Três modalidades + avanço | Triathlon com expansão | Forte em português; acento dificulta domínio | Um percurso, três formas de mover. | Raiz tri concorrida; não verificado. |
| R10 Vértice | Ponto de encontro e direção | Assessoria multiesporte | Muito boa no Brasil | Seu treino encontra direção. | Vértice é termo amplamente utilizado; composição precisa de busca formal. |
| R10 Limiar | Capacidade e evolução | Técnica, orientada a dados | Muito boa em português | Entenda seu próximo nível. | Descritivo no esporte; distintividade limitada. |
| R10 Prisma | Várias dimensões de um atleta | Multiesporte e visão integral | Muito boa; prís-ma | O atleta por inteiro. | Prisma é frequente em software e marcas; composição deve ser examinada. |

### Cinco finalistas e recomendação

1. **Cadorya — vencedor criativo provisório:** une cadência e trajetória sem limitar o produto ao triathlon. Boa leitura em tela e sem colisão óbvia nas buscas exatas realizadas. Isso não demonstra registrabilidade.
2. **R10 Vértice:** preserva reconhecimento existente e amplia o escopo; vantagem para transição gradual. Termo concorrente exige diligência.
3. **R10 Prisma:** comunica visão integral, mas tem maior risco de proximidade com software e serviços.
4. **R10 Limiar:** claro para atletas, porém mais descritivo e menos internacional.
5. **Nivorya:** conceito e sonoridade bons; domínio .com registrado reduz prioridade.

Busca web exata e documentação: 16/11/2026. RDAP oficial Verisign retornou 404 para cadorya.com, r10vertice.com, r10limiar.com e r10prisma.com; retornou 200 para nivorya.com. O arquivo CONSULTA_DOMINIOS_2026.json registra horário e status. 404 significa que a consulta não encontrou registro naquele instante; não é reserva, cotação ou garantia de compra.

Colisões confirmadas em fontes dos próprios titulares: [Orvexa no Google Play](https://play.google.com/store/apps/details?id=orvexa.video.downloader), [Alviora Apps](https://apps.alvioragroup.com/), [Ritmora](https://ritmora.co/), [Voryn](https://voryngroup.com/news/voryn-connect-coming-september-1-2026), [Avyren](https://avyren.com/), [Noryth](https://www.noryth.com/), [Velunor](https://velunor.us/). Esses nomes foram mantidos na exploração para mostrar por que pesquisa muda a recomendação.

Handles sociais e disponibilidade em todas as lojas não foram confirmados. Ausência em busca web não prova disponibilidade. A [busca de marcas do INPI](https://servicos.busca.inpi.gov.br/marcas/) e o [guia oficial](https://www.gov.br/inpi/pt-br/assuntos/marcas) foram localizados, mas não foi emitida análise de anterioridade, similaridade fonética ou classes de proteção. Isso exige diligência específica antes de uso comercial. Nenhum domínio foi comprado. Em 22/11/2026, o usuário escolheu **Gotri** como nome do aplicativo; as sugestões anteriores permanecem como histórico da pesquisa.

# Auditoria técnica e funcional — 16/11/2026

## Diagnóstico e preservação

Aplicação existente Next.js 16.4.6, React 19, TypeScript, Prisma 6.7 e PostgreSQL; dependências resolvidas por `package-lock.json`. Autenticação NextAuth com credenciais e APIs mobile; regras de treino determinísticas no servidor. Páginas no App Router, Prisma em `lib/db.ts`, entrada em `app/layout.tsx`, execução por `npm run dev` ou build/start. A geração de texto opcional não decide zonas, segurança ou permissões.

A base tinha 130 testes aprovados, cadastro por convite, login, recuperação testável, triagem, planos estruturados, calendário, registros, provas, ferramentas do coach e exportações. Não era apenas um protótipo. O ZIP não incluía a implementação de conexão Strava; a tela conservada não torna a sincronização operacional. Intervals.icu tem integração opcional com chave, enquanto FIT/TCX/ZWO são arquivos, não sincronização Garmin/TrainingPeaks/MyWhoosh.

Antes das alterações: tag local `resgate/antes-auditoria-2026-11-16` no commit `929e690` e branch separada. A migração nova **somente acrescenta** campos opcionais. Não há exclusão de tabela/coluna, reset de banco, importação de contas de teste na produção ou reescrita do histórico. O backup lógico local privado contém 12 tabelas/760 registros, feito após acrescentar as colunas; não é backup pré-migração da produção. O executável de `pg_dump` não estava disponível nesse PostgreSQL embarcado. O checkpoint de código e a natureza aditiva são mecanismos distintos de recuperação. Backups de produção e restauração devem ser mantidos no provedor, fora do Git.

## Correções por prioridade e impacto

| Prioridade | Problema / causa | Solução e arquivos principais | Impacto |
|---|---|---|---|
| P0 | Editar duração/modalidade mantinha JSON de blocos antigo. | `lib/workout-edit.ts`, API `workouts/update`: redimensionar segundos com soma exata, recalcular distribuição, descartar distâncias auxiliares antigas, reconstruir modalidade e exigir revisão. Preservar observação enviada pelo usuário. | Evita exportação/prescrição contraditória. |
| P0 | Resumo visual tinha fórmulas próprias, diferentes do motor, e aceitava ritmo genérico como limiar. | `components/training-zones-summary.tsx` utiliza `targetForZone`, inclusive FC e equipamento; dois testes de paridade. | O atleta vê os mesmos alvos da geração atual; plano antigo continua identificado como histórico. |
| P0 | Carga semanal não respeitava limite agregado de cada dia. | `dailyMinutes` na triagem/Prisma; alocação soma todas as modalidades, inclusive força, e respeita zero de descanso. | Caso de 15 minutos deixa de receber 30. |
| P0 | Iniciantes/retorno recebiam continuidade pouco específica; recuperação não mudava a geração. | Corrida/caminhada, natação técnica, afastamento e `training-feedback.ts`; sem relato favorável não há progressão automática. | Menos intensidade nos contextos restritos e justificativa rastreável. |
| P1 | Data de hoje podia ser classificada como falta antes do fim do dia. | Comparação de dias em São Paulo, em vez de horário UTC, e regressão. | Não penaliza sessão ainda realizável. |
| P1 | Provas sem prioridade e meta/prazo pouco considerados. | Prioridade A/B/C; prova A orienta o horizonte e vínculo do plano; provas próximas e metas desproporcionais geram revisão. | Coerência do foco e alertas sem promessa de resultado. |
| P1 | Perfil novo sugeria dias que a pessoa não informou. | Dias começam vazios; limite diário, altura, afastamento e força opcionais no questionário existente. | Menos pressupostos sobre disponibilidade. |
| P1 | Edição de bloco de distância podia conservar metros incompatíveis com o tempo reduzido. | Recalcular distância auxiliar após ajuste; edição manual descarta estimativa antiga. | Arquivos exportados mais coerentes. |
| P1 | Calendário agrupava domingo na segunda seguinte. | `calendar-period.ts` com calendário UTC; agenda diária, semanal, mensal e histórico completo. | Limites de semana corretos e consulta focalizada. |
| P1 | Carregamento de widget externo em toda sessão autenticada. | Carregamento somente com `ENABLE_ABACUS_WIDGET=true`, padrão desativado documentado. | Menor exposição a terceiros; recurso preservado por opção. |
| P1 | Auditoria de dependências encontrou alerta moderado na versão 16.4.1. | Next.js, ferramentas SWC e ESLint atualizados para 16.4.6 com lockfile; nova auditoria sem alertas conhecidos. [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h), consultado em 18/11/2026. | Correção preventiva do framework, sem afirmar que a configuração específica tenha sido explorada. |
| P2 | TSS ausente era somado como zero e apresentado como carga real. | Mostrar “Sem estimativa” quando faltam valores; não inventar TSS. | Ausência de medição deixa de parecer carga nula. |
| P2 | Tema escuro obrigatório e excesso de navegação primária. | Tokens claros/escuros, escolha explícita, barra lateral/aba inferior com menu secundário. Login e painel redesenhados. | Clareza e consulta móvel sem apagar rotas. |

Conferência final em 18/11/2026: etapas da triagem receberam nome acessível também no celular; fechamento de diálogo traduzido; menu móvel com altura limitada e fechamento ao selecionar uma aba. Nenhuma função importante foi removida.

Guias antigos continham instruções de APK inexistente, liberação de fontes desconhecidas e sincronização Strava/Garmin/MyWhoosh não implementada. `guias-client.tsx` agora ensina a instalação PWA e distingue exportação de arquivo de conexão de conta; `strava-client.tsx` explica que faltam módulos, e não apenas chaves. Conteúdo corrigido, seção e recursos reais preservados. A triagem móvel também ganhou quebra de linha nos controles de viagem e rodapé, após excesso de largura observado em 390 px.

## Fluxo e parâmetros do algoritmo

1. `assessment-validation.ts` valida idade/dados informados, volume, modalidades, equipamentos e disponibilidade. Campos fisiológicos desconhecidos continuam opcionais; prontidão exige o mínimo para não inventar a rotina.
2. `training-zones.ts` escolhe alvo por modalidade, limiar e equipamento: FC de limiar/pace na corrida, FTP/watts no ciclismo, CSS/100 m na piscina, ou percepção. Não calcula FC por 220−idade. Altura não aumenta carga.
3. `training-feedback.ts` considera os últimos sete dias: dor, fadiga, sono, esforço e faltas. Primeiro reduz/revisa, depois considera tolerância. Relatos favoráveis em três dias distintos permitem progressão limitada; ausência de dado não é recuperação boa. As constantes são políticas operacionais, sem validação clínica.
4. `training-structure.ts` escolhe prova A futura ou primeira prova futura, distribui fases Base/Build/Peak/Race/Transition e semana de recuperação; horizonte automático ou 1–52 semanas explícitas. Adaptação ocorre nos blocos de iniciação/retorno, não em uma fase nominal fictícia adicional. Afastamento, experiência e carga atual limitam o início.
5. Aloca minutos no orçamento diário/semanal, reserva datas de competição, inclui força somente quando disponível e evita alta intensidade aeróbica adjacente. Retorno/restrição e natação básica não recebem intensidade automática. A distribuição real é recalculada por segundos ativos: força e pausa passiva separados.
6. Sessões têm aquecimento, principal, recuperação quando pertinente, desaquecimento, alvo e instrução. Iniciação alterna 60 s de trote e 120 s de caminhada; piscina básica inclui pausas e técnica. Não infere competência em águas abertas ou prescreve musculação terapêutica.
7. API gera e valida antes de arquivar o plano ativo, em transação. O plano anterior fica no histórico. Feedback só influencia **nova geração solicitada**, sem editar silenciosamente semanas existentes.
8. Registro real alimenta painel de sugestões. Dor pede revisão; faltas não acumulam estímulos intensos. Atualizar zonas requer nova informação no perfil, não inferência de melhora a partir de simples conclusão.

Ver referências, população e limites em [AUDITORIA_CIENTIFICA_2026.md](AUDITORIA_CIENTIFICA_2026.md). Os percentuais e alertas não são preditores de lesão nem garantia de performance. O Riegel de previsão não é VDOT ou medição de VO2máx. Força detalhada, taper fino, HRV e periodização reversa/blocos não são anunciados como automatizados.

## Triagem: coleta e uso

| Dados | Situação |
|---|---|
| Idade, peso, experiência, modalidades, nível por modalidade, histórico/lesão, saúde | Campos existentes preservados; condições/restrições geram revisão conservadora. Texto livre não determina diagnóstico. |
| Altura, semanas de afastamento, disponibilidade para força | Acrescentados, opcionais; altura descritiva, afastamento e força influenciam o plano. |
| Volume atual, horas, dias, modalidades por dia, equipamentos, piscina/rolo | Determinam orçamento e elegibilidade; minutos diários acrescentados. Rotina de trabalho pode ser expressa pelos limites, sem coleta invasiva de emprego. |
| Limiar FC/pace, FC máxima/repouso, FTP, CSS, prova recente/meta | Usados quando válidos/aplicáveis. Valores desconhecidos não se tornam limiar inventado; estimativas de distância são identificadas. |
| Sono, fadiga, dor e PSE | Check-in opcional na conclusão, usado pelo feedback recente. Sem sensor/HRV integrado. |
| Distância, data e prioridade da prova | Priorizam horizonte e alertas; múltiplas provas próximas não recebem periodização milagrosa. |

## Inventário de ações e navegação

Classificação feita por leitura de componentes/APIs e testes indicados no relatório de validação; não significa clique manual em cada ação destrutiva. Nada foi excluído nesta rodada.

| Área / ações | Classificação e destino |
|---|---|
| Login, modo atleta/coach, mostrar senha, entrar, recuperar/definir senha, sair | Manter; aprimorar apresentação, erros e acessibilidade existentes. Sem alteração do hash/sessão nesta rodada. |
| Visão geral, próximo treino, detalhes, calendário, planejamento | Criar contexto real, unificar atalhos sob cinco destinos; widgets anteriores preservados. |
| Personalizar painel e widgets de volume/peso/modalidade | Manter; painel de recuperação complementa dados, sem criar índices fictícios. |
| Calendário: filtro/modalidade, período/data, prescrição e registrar | Aprimorar; período explícito e domingo corrigido. Registro mantém consentimento de envio. |
| Triagem: avançar/voltar/salvar/reabrir e gerar plano | Manter; acrescentar limites e objetivos condicionais. Botão de nova geração é a adaptação consciente. |
| Plano/planilha: detalhes, editar, reagendar, conclusão, manual, histórico, exportar e excluir | Manter. Edição estruturada corrigida. Não executar exclusão real para provar botão. |
| Provas: cadastrar/excluir, previsão | Aprimorar com prioridade; previsão continua com premissas/incerteza. |
| Evolução e perfil: registros, medidas, zonas, salvar | Manter. Não inventar série longitudinal de FTP/CSS se não há medições. |
| Coach: atletas, convite, acesso ao atleta, mensagens, alertas, remover | Reposicionar no secundário; permissões no servidor. Exclusão não exercitada contra contas reais. |
| Disponibilidade, exercícios, guias/guia, nutrição, planilha | Manter no secundário; guias e nutrição não equivalem a consulta individualizada. |
| Intervals: salvar chave/enviar; Strava; exportações | Manter com estado honesto. Chave nunca retorna pela API. Strava continua incompleto, sem botão fictício de sucesso. |
| Tema, menu móvel, pular conteúdo e utilitário PWA | Criar/aprimorar. Nenhum recurso esportivo removido. |

## Funcionalidades e viabilidade

**Adicionadas:** limites por dia; afastamento/força na triagem; prioridade de prova; corrida/caminhada e técnica inicial; feedback determinístico explicado; próximo treino e resumo semanal; agenda por período; modo claro/escuro e navegação móvel. **Aprimoradas:** metas, alocação, recuperação, edição estruturada e descrição da sessão. **Removidas:** nenhuma funcionalidade; animação decorativa deixou de ser exibida, gradientes do destaque viraram superfície plana e links foram reposicionados.

**Preservadas e avaliadas:** histórico, volume, aderência, gráficos, notificações do coach, exportações FIT/TCX/ZWO/TXT conforme modalidade e Intervals. **Não simuladas:** início de atividade com gravação GPS, arrastar sessão, recordes automaticamente verificados, curvas longitudinais de FTP/CSS sem dados, HRV, sincronização Garmin/TrainingPeaks/Zwift/MyWhoosh e envio automático de WhatsApp. Compartilhar link abre o WhatsApp sob ação da pessoa; não é API de envio. Benchmark e requisitos oficiais em [BENCHMARK_E_MARCA_2026.md](BENCHMARK_E_MARCA_2026.md).

## Segurança, dados e desempenho

Controle de proprietário/coach permanece nas APIs, com testes negativos entre atletas. A arquitetura atual tem coach global, sem isolamento por assessoria; uma oferta comercial com múltiplas organizações exige vínculo/escopo explícito. Feedback retorna dados mínimos da própria sessão e `no-store`. Senhas ficam em hash; recuperação usa token de uso único e invalida sessões antigas. Segredos de integração são privados. O teste de segredos cobre conteúdo versionável, sem publicar configurações privadas.

Dados de saúde merecem acesso restrito, retenção mínima, registro das bases legais, atendimento a titulares, política clara de fornecedores e processo de incidentes. **Esta revisão não certifica conformidade integral com LGPD.** Ainda é preciso definir controlador/operador, termos, prazos de retenção e procedimentos com o responsável. Não coletar diagnóstico extra só para melhorar o marketing do produto.

Consultas novas limitam a janela de feedback a sete dias/50 registros; painel seleciona campos necessários. Não foi realizado teste de carga concorrente nem auditoria de dependências por pentest. Limitadores de autenticação em memória não substituem controle compartilhado em várias réplicas. Migração aditiva não resolve por si só esses limites.

## Execução, manutenção e recuperação

Use Node compatível com `engines` (validação local: Node 24.14, npm 11.9), PostgreSQL e `.env` privado a partir do exemplo. `npm ci`, `npm run db:migrate`, `npm run dev`. Produção: `npm run build` e `npm start`; Railway executa preparação aditiva do banco antes de iniciar. Nunca executar seed de desenvolvimento na produção nem redefinir banco para corrigir migração.

Validação: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verificar:segredos`. Integração exige banco isolado `r10tri_test`/`r10tri_ci` em localhost, sem credenciais externas. `npx tsx scripts/comparar-planos.ts` reproduz os 12 cenários contra o commit-base enquanto ele existir no histórico Git.

Antes de atualizar: guardar backup privado do PostgreSQL, verificar restauração em ambiente isolado, registrar commit/deploy anterior, revisar alterações de esquema e publicar após CI. Em incidente, restaurar a versão anterior do código no provedor; deixar colunas opcionais adicionadas no lugar. Não apagar colunas nem aplicar down migration sem análise e confirmação. Nunca usar force push como rollback. Revisar registros de erro sem tokens, links de convite ou saúde identificável.

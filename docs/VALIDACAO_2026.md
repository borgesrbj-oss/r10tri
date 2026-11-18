# Validação técnica — fechamento em 18/11/2026

## Resultados automatizados locais

| Verificação | Resultado observado | Alcance |
|---|---|---|
| `npm test` | 150 aprovados, zero falhas | Regressões existentes, 12 perfis, cenários extremos, recuperação, permissões, exportações e paridade das zonas visuais. |
| ESLint | Sem erros/avisos na execução final | Análise estática, não auditoria completa de UX. |
| TypeScript/build | Compilação de produção com Next.js 16.4.6 | Rotas e tipos verificados pelo build. |
| Prisma validate/migrate | Esquema válido; migração local aditiva aplicada | Altura, limites diários, afastamento, força e prioridade de prova. Sem reset. |
| Integração HTTP/PostgreSQL | 24/24 aprovados | Quatro contas fictícias, permissões cruzadas, convites, geração, FIT/TCX/ZWO, orçamento diário, feedback isolado e edição de blocos/observação. |
| Autenticação HTTP sem SMTP | 10/10 aprovados | Normalização de identificador, senha com caracteres/espaços, convite, sessão e indisponibilidade de transporte. |
| Recuperação com SMTP local TLS | 10/10 aprovados | E-mail capturado em servidor de teste, link de uso único, expiração/invalidação e sessões. Não comprova entrega na internet. |
| `npm audit` | Zero vulnerabilidades conhecidas após atualização | Snapshot do registro npm; não equivale a pentest nem garantia de ausência de vulnerabilidades. |
| Verificação de segredos | Nenhum padrão detectado nos arquivos versionáveis | `.env`, credenciais, backups, logs privados e contas temporárias ficam fora do repositório. |

As falhas iniciais de integração na retomada ocorreram com servidor indisponível: banco local parado e build ainda em andamento. Após iniciar o PostgreSQL e aguardar o build, os cenários passaram. O primeiro build também exibiu um aviso de atualização; a auditoria confirmou um alerta moderado e a atualização corrigida foi instalada explicitamente. Não foram alterados certificados, proteções ou senhas de usuários para fazer os testes passarem.

## Perfis científicos e cenários extremos

Os 12 casos são fictícios: sedentário, primeiros 5 km, intermediário 10 km, meia, maratonista experiente, ciclista iniciante, nadador básico, triatleta iniciante, longa distância, histórico de joelho, apenas 15 min/dia e prazo incompatível. [Tabela antes/depois](COMPARACAO_TREINOS_2026.md) produzida pelo mesmo script e entradas, comparando commit `929e690` com o motor revisado.

Asserções verificam somatório dos blocos, limites diários/semanal, datas disponíveis, espaçamento de intensidade, força separada, reserva de competição, água/equipamentos, retorno, dados incompletos e estimativas. Feedback testa dor mesmo quando o último check-in está incompleto, faltas sem compensação, sono/fadiga e progressão apenas com relatos em dias distintos. Testes não demonstram prevenção de lesões, melhora de VO2máx ou eficácia em pessoas reais.

## Verificação manual no Chrome

- Login responsivo em 320, 375, 390, 430, 768 e 1280 px, sem rolagem horizontal observada; modos claro/escuro e entrada com conta fictícia de coach.
- Painel em 320, 390, 768 e 1280 px, próximo treino real, resumo semanal e motivo de ajuste; conta de teste, sem dados reais de atletas nas capturas.
- Calendário móvel: filtro diário mostra a sessão da data, mensal e por modalidade apresentam estado vazio correto; diálogo de registro rejeita fadiga 11 antes de salvar.
- Plano: lista, distribuição, previsão com premissas e reabertura da avaliação conferidas. Nenhum plano real foi excluído ou regenerado para teste.
- Destinos de menu abertos no navegador: provas, desempenho, perfil, disponibilidade, planilha/exportações, força/mobilidade, integrações, guias, alimentação e atletas. Abertura de tela não implica testar toda ação de salvar/excluir de cada módulo.
- Menu móvel: abrir, fechar por Escape e navegar para competições. Etapas da triagem com nome acessível; limites diários e força visíveis. Excesso de largura identificado nos botões de viagem/rodapé e corrigido com quebra de linha.
- Contraste amostral no painel claro/escuro: título 12,74:1 / 12,02:1; apoio 5,30:1 / 6,11:1; link de ação 7,83:1 / 8,26:1. Cálculo pelos estilos computados e fundos compostos no Chrome; não abrange todos os elementos legados.

Capturas na entrega local em `outputs/evidencias/auditoria`: antes do login e depois em temas claro/escuro, painel desktop/mobile e calendário móvel. Parte das capturas usa dados de planos de demonstração antigos; preservação do histórico é intencional. Cálculo de regras novas é comprovado pelos cenários sintéticos e de integração, não por imagens decorativas.

## Checklist pendente por dispositivo

| Ambiente | Situação | Verificar |
|---|---|---|
| Chrome desktop Windows | Testado nas ações descritas | Repetir ações críticas após mudanças de autenticação. |
| Chrome com viewport móvel | Testado; não é Android físico | Toque, teclado virtual, rotação, área segura e instalação em Android real. |
| Safari macOS | Não disponível nesta execução | Login, cookies, recuperação, downloads e tema. |
| Safari iPhone | Não disponível nesta execução | Login, teclado/zoom, formulário, agenda, áreas seguras, instalação e reabertura da PWA. |
| Chrome iPhone | Não disponível nesta execução | Mesmos fluxos com engine do iOS; não inferir resultado do Chrome Windows. |
| Leitor de tela/alto zoom | Revisão parcial de semântica, sem ensaio completo | Foco, rótulos legados, diálogos, ordem de leitura e gráficos. |

Manifest, service worker, ícones e orientação de instalação existentes foram preservados. A PWA não deve armazenar respostas autenticadas/saúde para uso offline; não há promessa de sincronização offline ou push no iOS. Ver também o [checklist anterior](CHECKLIST_ENDURANCE.md).

## Limites de qualidade

Não foram realizados teste clínico, pentest, teste de carga, teste físico de Garmin/piscina, envio automático de WhatsApp, sincronização Strava nem restauração de backup da produção. A migração adiciona colunas opcionais; não elimina riscos operacionais. Revisão especializada, dados humanos e testes em aparelhos reais continuam necessários para anunciar qualidade clínica/comercial ou compatibilidade integral.

# Plano de auditoria científica e redesign — 16/11/2026

Ponto de recuperação: tag local `resgate/antes-auditoria-2026-11-16`, commit `929e690`. Trabalho isolado na branch `codex/auditoria-cientifica-redesign`. Base: 130 testes aprovados. Não apagar dados, reconstruir banco ou sobrescrever planos antigos.

## Ordem e arquivos previstos antes da edição

1. Diagnóstico: APIs, autenticação, banco, bibliotecas, interfaces e integrações inventariados; registrar achados e prioridades neste diretório.
2. Pesquisa: relatório `AUDITORIA_CIENTIFICA_2026.md` com fontes, datas, população, limitações e vínculo com regras implementadas. Benchmark em `BENCHMARK_E_MARCA_2026.md`.
3. Triagem: `prisma/schema.prisma`, nova migração aditiva, `lib/assessment-validation.ts`, `lib/training-types.ts`, questionário existente. Acrescentar altura opcional, limites por dia, afastamento e disponibilidade para força.
4. Motor: `lib/training-structure.ts`, `lib/training-zones.ts`, novo `lib/training-feedback.ts`, `app/api/plan/generate/route.ts`. Fazer limites e recuperação influenciarem carga; não prometer prevenção de lesões ou superioridade universal de 80/20.
5. Sessões: iniciação corrida/caminhada, técnica em piscina, foco por objetivo, objetivo fisiológico e explicação. Preservar contratos de exportação.
6. Adaptação: nova rota/componente de sugestões, com acesso por proprietário/coach; sugestões explicadas sem reescrita automática do histórico ou compensação de faltas.
7. Testes: `tests/auditoria-cientifica.test.ts`, `scripts/comparar-planos.ts`, relatório comparativo gerado com 12 perfis fictícios e cenários extremos.
8. Segurança: corrigir edição de treino para não conservar JSON incompatível; manter identidade/roles no servidor e segredos fora do Git.
9. Naming: 20 opções e cinco finalistas; nenhuma troca definitiva de marca.
10. Design: três direções; sistema visual em `DESIGN_SYSTEM_2026.md`. Escolha provisória de lilás mineral, laranja suave e superfícies claras, com tema escuro acessível.
11. Redesign: `app/globals.css`, `app/layout.tsx`, `components/app-nav.tsx`, novo seletor de tema, componentes compartilhados de botão/card/input, login, dashboard e estrutura de treino.
12. Dashboard: próximo treino e contexto semanal real; preservar ferramentas existentes em navegação secundária. Reaproveitar calendário, plano, evolução e perfil.
13. QA: tipos, lint, testes, migrações locais, build, integração e navegador disponível. Capturas antes/depois sem credenciais. Safari físico continua dependente de dispositivo disponível.
14. Entrega: documentação, resultados reais, limitações, PR e publicação após verificação. Mudanças de banco somente aditivas; checkpoint Git permite restaurar código. Não há autorização para contratar domínio/serviço ou alterar definitivamente o nome.

Nenhuma função importante será apagada. Redundâncias de navegação serão agrupadas mantendo as rotas e acessos. Integrações incompletas serão identificadas como tais.

Complementos durante a implementação: `lib/workout-edit.ts` e API de edição para corrigir a divergência dos blocos; `lib/calendar-period.ts` e calendário para filtros e domingo; `openapi.json` e README para documentar contratos. Nenhuma dessas mudanças exige exclusão de dados ou aprovação de nome.

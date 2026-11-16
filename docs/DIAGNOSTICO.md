# Diagnóstico e correções do R10 TRI

Consolidação iniciada em 14 de novembro de 2026 a partir do ZIP fornecido e das verificações locais. Este documento não contém valores de credenciais.

## Estado da revisão de endurance em 16 de novembro de 2026

A base existente de cadastro, convites, calendário, gestão de atletas, planos, registros e exportações foi mantida. Os ajustes são incrementais na branch `codex/ajustes-endurance`. Os números da publicação inicial aparecem em seção histórica abaixo e não comprovam, por si só, o estado final das novas alterações.

| Área | Diagnóstico e comportamento atual | Limite ou validação restante |
| --- | --- | --- |
| Login | Busca de credenciais corrigida para normalizar e-mail/identificador e preservar a senha; o identificador agora existe no modelo. | Confirmar fluxo no deploy HTTPS e em Safari real. Não há conta ou senha padrão. |
| Recuperação | Fluxo implementado com token de uso único, hash no banco, expiração de 30 minutos, intervalo mínimo de 60 segundos e invalidação de sessões antigas. | SMTP real ainda precisa de configuração e teste de entrega; sem ele, a API retorna 503. |
| PWA e mobile | Manifesto, ícones, service worker com cache público limitado, página offline neutra e ajustes de viewport/áreas seguras. | Safari/macOS e aparelhos iPhone/Android físicos não foram testados. Push não está configurado como serviço ativo. |
| Triagem e planos | Dados validados no servidor; geração exige disponibilidade e informações mínimas. Treinos novos persistem passos, alvos e distribuição real por tempo ativo. | Revisão individual do coach continua necessária; planos antigos têm informação parcial. |
| Acompanhamento | Alertas restritos ao coach, previsão de corrida com Riegel, link de WhatsApp e check-in de sono/fadiga/dor. | Critérios operacionais não equivalem a diagnóstico ou previsão garantida. WhatsApp exige ação do usuário. |
| Integrações | Exportação de arquivos e Intervals.icu preservados. | FIT não é sincronização Garmin. Strava depende dos arquivos complementares prometidos e da configuração autorizada. |
| Hospedagem | Railway preparado com projeto, PostgreSQL e domínio; configuração de build, migração, bootstrap e saúde presente no repositório. | O app ainda não tinha deploy funcional confirmado no último estado registrado. |

### Causa raiz do erro de acesso

A busca anterior utilizava correspondência exata de e-mail, sem normalizar espaços externos ou maiúsculas. A tela também sugeria um identificador de coach, mas o banco não tinha campo de nome de usuário nem uma conta padrão com esse identificador. Esses caminhos levavam à mensagem genérica de credenciais inválidas. As verificações não demonstraram um defeito de salt/bcrypt que justificasse substituir senhas ou ignorar sua verificação.

Foi acrescentado `User.username` opcional e único; e-mails e identificadores são normalizados e consultados sem diferenciar maiúsculas. A senha não recebe trim nem normalização Unicode. Colisões legadas de identidade são recusadas para revisão, em vez de fundir contas ou conceder privilégios. O papel continua vindo do banco. A identidade da conta inicial é configurada privadamente e não consta destes documentos.

### Problemas, causas, arquivos e soluções da revisão atual

| Problema | Causa | Arquivos principais | Solução |
| --- | --- | --- | --- |
| E-mail válido podia ser recusado; identificador sugerido não funcionava | Comparação exata e ausência de campo/conta de usuário | `auth.ts`, `lib/auth-credentials.ts`, login e APIs de autenticação, `prisma/schema.prisma` | Normalização somente da identidade, username persistido, senha integral e mensagens claras. |
| Recuperação inexistente | Ausência de token, envio e revogação próprios | `lib/password-reset.ts`, `lib/auth-mail.ts`, rotas `forgot-password`/`reset-password`, páginas `esqueci-senha`/`redefinir-senha` | Token aleatório, hash, validade, consumo único transacional, SMTP com TLS e `authVersion` para revogar sessões. |
| Interface não atendia instalação e particularidades mobile | Recursos PWA e tratamento de altura/áreas seguras incompletos | `app/layout.tsx`, `app/globals.css`, `components/pwa-manager.tsx`, navegação, `public/manifest.json`, `public/sw.js`, `public/offline.html` | Instalação progressiva em contexto seguro, viewport dinâmico, inputs e cache restrito a recursos públicos. |
| Triagem aceitava dados incompletos ou inconsistentes | Ausência de contrato único validado antes de gerar | `lib/assessment-validation.ts`, APIs de perfil/triagem/plano, `components/coach-questionnaire.tsx` | Validação por campo, consistência de FC/datas e lista explícita do que falta. |
| Treinos genéricos não permitiam comprovar distribuição e descansos | Conteúdo textual sem passos persistidos e sem resumo calculado | `lib/training-types.ts`, `lib/training-zones.ts`, `lib/training-structure.ts`, `lib/plan-engine.ts`, APIs/plano/calendário | Estrutura versionada com tempos, zonas, alvos, recuperação e soma verificável; compatibilidade com planos legados. |
| Percentual intenso podia ser apenas uma declaração | Falta de cálculo sobre o treino real | `lib/training-structure.ts`, componentes de estrutura e plano | Medição pelo tempo aeróbico ativo; força/pausa passiva separadas e justificativa para semanas menos intensas. |
| Falta de acompanhamento objetivo | Dados de sono/fadiga/dor e alertas não estavam ligados ao fluxo | `lib/coach-alerts.ts`, `/api/coach-alerts`, `components/coach-alerts.tsx`, API de registro, calendário | Check-in com limites, alertas de revisão e acesso exclusivo de coach. |
| Estimativa de prova sem limite explícito seria enganosa | Ausência de regra e requisitos claros de resultado | `lib/race-prediction.ts`, componente de previsão | Riegel com resultado real recente, intervalos de entrada e avisos; não apresentado como VDOT. |
| Operação na hospedagem sem procedimento reproduzível | Falta de preparação de banco, conta inicial e saúde | `scripts/bootstrap-coach.mjs`, `app/api/health/route.ts`, `railway.json`, `package.json` | Migração e bootstrap idempotente privado antes do deploy, inicialização e verificação do banco. |
| Operações de prova exigiam proteção adicional por proprietário | Identificador de prova sem verificação suficiente do usuário | `app/api/races/route.ts`, testes de autorização | Validação de propriedade nas operações; regressões incluídas na bateria global. |
| Alteração parcial de FC podia ignorar dados já salvos | Consistência conferida sem combinar os valores persistidos e enviados | Validação e APIs de perfil/triagem | Conferência do perfil resultante antes de gravar FC máxima, de repouso e limiar. |
| Duração automática e objetivos não tinham efeito completo no plano | Horizonte e preferências não eram aplicados de ponta a ponta | API de geração, motor, alvos, resumo e telas de plano/planilha | Auto até prova mais duas semanas, escolha explícita de 1–52 semanas, objetivo e modo da corrida efetivamente aplicados e revisão visível. |

### Plano de alterações e preservação

A relação de módulos foi apresentada antes das alterações. A execução seguiu acesso/recuperação, PWA/mobile, triagem/treinos e funcionalidades complementares, mantendo os contratos existentes quando possível. A migração `20261114010000_endurance` acrescenta campos; não apaga registros. Treinos novos recebem `Workout.structure` e planos recebem `TrainingPlan.summary`. A nomenclatura JSON, as faixas e as decisões de produto estão na [metodologia](METODOLOGIA_TREINOS.md).

O usuário autorizou remover somente AppShell, AuthLayout, ThemeToggle e a pasta de exemplos de visualização sem uso. Essa aprovação não se estende a outras telas. Não foram encontrados ranking público nem feed social no aplicativo. A execução da limpeza deve ser conferida no diff final. As opções de identidade permanecem em [OPCOES_IDENTIDADE.md](OPCOES_IDENTIDADE.md), sem troca automática da marca.

### Verificações observadas em 16 de novembro de 2026

| Escopo | Evidência |
| --- | --- |
| Bateria global automatizada | 130 de 130 testes passaram, incluindo regressões de autenticação, autorização, treinos, exportação, PWA, apresentação e alertas. |
| Tipos e lint global | Passaram; nenhum erro ou aviso de lint. |
| Build final de produção | Passou. |
| Auditoria de dependências | Zero vulnerabilidades após atualização do transporte SMTP para Nodemailer 10.6.0 por alias, preservando a compatibilidade da dependência opcional de Auth.js. |
| Verificação de segredos | 236 arquivos examinados, sem ocorrências. |
| Integração local em produção | 21 de 21 cenários HTTP/PostgreSQL passaram. |
| Recuperação com SMTP TLS de teste | 10 de 10 cenários passaram. Não é evidência de entrega por provedor real. |
| Autenticação sem SMTP | 10 de 10 cenários passaram, incluindo a indisponibilidade explícita da recuperação. |
| Revisão no Chrome disponível | Login por identificador com conta temporária; menu, planilha e blocos a 390 px, sem transbordamento horizontal da página observado. |
| Contrato OpenAPI | Novas rotas e estrutura de geração documentadas; JSON e referências internas conferidos, preservadas as 23 rotas legadas. |
| Chrome disponível | Login por identificador com conta temporária funcionou; menu, planilha e blocos conferidos a 390 px sem transbordamento horizontal da página. |
| Build final e publicação | Compilação final em andamento; deploy do aplicativo ainda sem confirmação funcional. |

Os 130 testes são a bateria global; os testes HTTP/SMTP são execuções separadas. O deploy público ainda precisa de confirmação. O [checklist](CHECKLIST_ENDURANCE.md) distingue verificações automáticas, testes reais de dispositivo, serviços externos e publicação. Nenhum resultado de Safari físico foi presumido a partir de testes HTTP ou do Chrome, e nenhuma identidade privada de teste foi incluída neste documento.

## Diagnóstico inicial e histórico da primeira publicação

- Linguagem principal: TypeScript, com componentes React em TSX e utilitários JavaScript.
- Framework: Next.js 16 com App Router, páginas de servidor e rotas HTTP em `app/api`.
- Banco: PostgreSQL com Prisma 6.
- Autenticação: Auth.js/NextAuth com credenciais, sessões JWT e usuários persistidos no banco.
- Gerenciador adotado: npm. O ZIP continha `package.json` e configuração Yarn vinculada a outro ambiente, mas não continha arquivo de versões travadas.
- Entrada: `app/page.tsx`, `app/layout.tsx` e as convenções de roteamento do Next.js; comandos de execução em `package.json`.
- Finalidade: gestão de atletas e planos de treinos de triatlo, calendário, registro de execução, evolução e exportação de treinos.

O ZIP não continha README nem migrações de banco. Continha um `.env` preenchido e uma conta de teste com senha literal no seed original. Esses valores não fazem parte da documentação nem devem ser incluídos no histórico Git. A validação local utiliza banco separado do ambiente original.

### Problemas e soluções da base inicial

| Problema | Causa | Arquivos principais | Solução aplicada |
| --- | --- | --- | --- |
| Instalação interrompida por conflito de dependências | Bibliotecas declaravam suporte apenas a versões anteriores do React | `package.json`, `package-lock.json` | Atualização das bibliotecas compatíveis com React 19 e registro da árvore resolvida, sem utilizar `--force` ou `--legacy-peer-deps`. |
| Prisma dependente de um caminho Linux específico | Saída do gerador configurada com caminho absoluto do ambiente de origem | `prisma/schema.prisma` | Saída explícita relativa `../node_modules/.prisma/client`, portável e sem o aviso de saída implícita. |
| Banco sem histórico de criação reproduzível | Ausência de arquivos de migração no ZIP | `prisma/migrations/` | Criação de migração inicial a partir do schema e aplicação no PostgreSQL local isolado. |
| Configuração de desenvolvimento presa ao ambiente anterior | Raiz de rastreamento, cache Yarn e hosts fixos do ambiente de origem | `next.config.js`, `.yarnrc.yml` | Configuração local portável e lista de hosts adicionais controlada por ambiente. |
| Compilação falhava por exportação ausente de animações | O npm ignorava `resolutions` do Yarn e instalava `motion-dom` 12.43, incompatível com a exportação `activeAnimations` esperada | `package.json`, `package-lock.json` | Inclusão dos mesmos limites em `overrides` do npm: `motion-dom` 12.23.12 e `motion-utils` 12.23.6. |
| Falhas TypeScript podiam passar despercebidas no build | `ignoreBuildErrors` estava habilitado | `next.config.js`, `package.json` | Remoção da opção e adição de `typecheck` explícito. |
| Atleta podia alterar treino ou registro de outro usuário | Operações por identificador sem verificar proprietário | `app/api/workouts/route.ts`, `app/api/workouts/log/route.ts`, `app/api/workouts/create/route.ts`, `app/api/workouts/update/route.ts` | Verificação de usuário e vínculo do plano antes de gravar; registro e conclusão em transação. |
| Definição de senha por conhecimento do e-mail | Primeiro acesso de convidado não exigia prova de posse do convite | `app/api/auth/set-password/route.ts`, `app/api/athlete/create/route.ts`, `lib/invitations.ts`, telas de primeiro acesso e gestão de atletas | Convite aleatório de 256 bits, hash SHA-256 no banco, expiração em 48 horas e consumo único em transação; link renovável pelo treinador. |
| E-mail de convite podia receber conteúdo HTML não escapado | Nome e link eram interpolados no conteúdo da notificação | `lib/invitations.ts`, `app/api/athlete/create/route.ts` | Escape do conteúdo inserido no e-mail. |
| Privilégio de treinador podia vir de e-mail autodeclarado | Comparação com lista `COACH_EMAILS` no login, sem comprovação de propriedade do endereço | `auth.ts`, `lib/auth-policy.ts` | Perfil confiável vem do banco; sessões revalidam o papel atual. |
| Conta oculta e senha fixa no seed | Conta de teste incluída diretamente no código original | `scripts/seed.ts`, `scripts/safe-seed.ts`, `lib/seed-config.ts` | Criação explícita por `SEED_*`, validação de configuração e interrupção sem alterar usuários existentes. |
| Chave Intervals.icu enviada ao navegador | Serialização de perfil completo em respostas e propriedades de páginas | `lib/profile-public.ts`, APIs de perfil e páginas de servidor | Remoção da credencial antes de serializar; exposição somente do indicador `hasIntervalsKey`. |
| Fluxo mobile podia enviar credenciais a origem manipulada | Origem interna derivada de cabeçalhos e autorização ampla de esquemas de retorno | `lib/mobile-auth.ts`, `lib/auth-policy.ts` | Origem configurada explicitamente, validação de formato, exigência em produção e listas exatas de esquemas e origens permitidas. |
| Assinatura de links sem segredo configurado | Fallback para segredo vazio | `lib/mobile-auth.ts`, `lib/auth-policy.ts` | Interrupção do fluxo se o segredo não estiver configurado. |
| Erros de hooks e risco de divergência na hidratação | Cópia síncrona de estado em efeitos, relógio impuro no render e acesso inadequado a refs | `hooks/use-browser-state.ts`, componentes de páginas, `components/client-only.tsx`, componentes de carrossel e visualização | Assinaturas com `useSyncExternalStore`, estado de servidor consistente e atualização de refs após o commit. |
| HTML inválido em guias | Botão dentro de outro botão | `app/(app)/guias/_components/guias-client.tsx` | Ajuste da estrutura mantendo as ações disponíveis. |
| Script externo síncrono no layout | Tag de script bloqueante | `app/layout.tsx` | Uso de `next/script` com carregamento após a interatividade. |
| Exportação TCX podia gerar XML inválido | Limite do nome aplicado depois do escape, cortando entidades como `&amp;` | `lib/export-builders.ts`, `tests/treinos.test.ts` | Limite aplicado aos caracteres originais antes do escape XML; teste de regressão adicionado. |
| Arquivos de terceiros geravam milhares de ocorrências irrelevantes no lint | Recursos distribuídos/minificados eram tratados como código-fonte próprio | `eslint.config.mjs` | Exclusão do diretório estático de terceiros; regras mantidas para o código da aplicação. |
| Dependências com alertas de segurança | Versões antigas de bibliotecas diretas e transitivas | `package.json`, `package-lock.json` | Atualizações aplicadas, preservadas as compatibilidades exigidas, e auditoria final com zero vulnerabilidades. |
| Sete alertas moderados restantes em ferramentas de análise | Versões transitivas de `minimatch` entre 7 e 11.0.0 atingidas por negação de serviço na amplificação de globparts | `package.json`, `package-lock.json` | Override seletivo para `minimatch` 11.0.1 nas faixas afetadas; auditoria [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) atendida e verificações de código reexecutadas. |
| Regeneração do Prisma falhava com `EPERM` no Windows | O servidor do próprio projeto mantinha o mecanismo do Prisma aberto | Processo local do servidor e cliente Prisma gerado | Encerramento somente do servidor do projeto e nova execução de `prisma generate`, sem alterar permissões do sistema. |
| Documentação insuficiente e risco de versionar credenciais | README e `.gitignore` ausentes no ZIP | `README.md`, `.env.example`, `.gitignore` | Documentação de instalação/execução, modelo sem segredos e exclusão de configurações locais e artefatos. |

### Verificações históricas observadas na primeira publicação

| Verificação | Resultado observado |
| --- | --- |
| Extração e inventário do ZIP | Concluídos; estrutura e pontos de entrada identificados. |
| Instalação inicial | Falhou por conflito entre React 19 e `cmdk` antigo; outros conflitos foram identificados na árvore. |
| Instalação corrigida | Concluída. Atualizações adicionais de segurança também foram instaladas. |
| `prisma generate` | Concluído com Prisma 6.7.0 e caminho relativo explícito; aviso de saída implícita eliminado. |
| `prisma validate` | Schema válido. |
| Migração inicial no PostgreSQL isolado | Aplicada com sucesso. |
| `npm run typecheck` | `next typegen` e `tsc --noEmit` passaram. |
| Testes de segurança de rotas e convites | 13 testes passaram com sessão e banco controlados. |
| Testes de privacidade e configurações | 6 testes passaram. |
| Bateria completa de testes automatizados | 28 de 28 passaram. O teste TCX reproduziu o defeito antes da correção e passou após o ajuste. |
| Teste simples HTTP de autenticação | Cadastro, CSRF, login e sessão passaram com PostgreSQL local. |
| Teste integrado HTTP/PostgreSQL ampliado em desenvolvimento | 21 de 21 cenários passaram. |
| Teste integrado na versão de produção | 21 de 21 cenários passaram com `npm start` e a compilação `.build`. |
| Lint global | Passou com `--max-warnings 0`: nenhum erro ou aviso. |
| Auditoria npm inicial | 17 alertas: 2 críticos, 5 altos, 9 moderados e 1 baixo. |
| Auditoria após a primeira atualização de segurança | Restaram 7 moderados associados a ferramentas de análise, resolvidos pelo override seletivo de `minimatch`. |
| Auditoria npm final | Zero vulnerabilidades de qualquer severidade. |
| `npm ls --all` | Árvore de dependências sem erros na verificação observada. |
| Verificação dos arquivos rastreados | 216 arquivos examinados sem padrões de credenciais. A comparação exata com os segredos do `.env` original, a senha literal do seed recebido e os segredos do novo ambiente local também não encontrou ocorrências. |
| Compilação de produção | Passou com saída `.build`, por meio de `NEXT_DIST_DIR=.build`. |
| Preparação local do Git | Repositório iniciado na branch `main`, com identidade configurada apenas no projeto e e-mail de privacidade do GitHub. |
| Repositório público | Código enviado à branch `main` de [borgesrbj-oss/r10tri](https://github.com/borgesrbj-oss/r10tri), com três commits organizados em português na publicação inicial. |
| Workflow de verificação do projeto | [Execução 43639788897 aprovada](https://github.com/borgesrbj-oss/r10tri/actions/runs/43639788897): `npm ci` em Linux, verificação de segredos, migrações, lint, tipos, 28 testes, auditoria sem vulnerabilidades, compilação e 21 cenários de integração em produção. |
| Portfólio | 7 testes de busca, paginação, privacidade e fallback passaram. Snapshot atualizado com oito repositórios públicos e [deploy 43639849786 aprovado](https://github.com/borgesrbj-oss/borgesrbj-oss.github.io/actions/runs/43639849786). |
| README de perfil | [Perfil público atualizado](https://github.com/borgesrbj-oss/borgesrbj-oss) com os oito repositórios públicos. |
| Revisão visual | Portfólio conferido em computador e larguras de celular de 390 e 430 pixels no Chromium disponível, com busca e filtro dos oito repositórios. Login do R10 TRI revisado visualmente, sem erros no console observado. |

Os testes unitários de segurança executam os handlers reais com dependências controladas. O teste de integração é separado e deve ser executado com o servidor apontando para o mesmo PostgreSQL de testes. Aprovação de teste local não comprova configuração das integrações externas.

### Avisos e limites da base inicial

- A instalação inicial apontou pacotes descontinuados, incluindo Recharts 2, ESLint 9 e dependências antigas de visualização. As versões resolvidas estão no arquivo de dependências; a auditoria final não apontou vulnerabilidades.
- O ESLint 9.39.5 foi mantido porque o `eslint-plugin-react` 7.37.5 utilizado na árvore declara compatibilidade que ainda não inclui ESLint 10. O aviso de descontinuação é conhecido; a migração exige suporte dos plugins e nova validação.
- As bibliotecas Auth.js/NextAuth e Prisma mantêm as versões declaradas no projeto; o NextAuth utilizado é uma versão beta.
- A saída do gerador Prisma é explícita e relativa. Uma atualização principal do Prisma permanece uma alteração separada, com revisão das orientações de migração.
- O ZIP continha guias e exemplos técnicos herdados. Sua presença não constitui evidência de uma integração externa estar ativa; a limpeza posterior autorizada está descrita acima.
- A tela Strava não implementa conexão/sincronização. O usuário informou que fornecerá os arquivos faltantes; essa pendência não foi substituída por uma implementação inventada.
- AWS S3, Abacus e Intervals.icu dependem das configurações e acessos do ambiente definitivo. Nenhum segredo externo foi solicitado em texto aberto.
- Android e iPhone físicos e o navegador Safari não foram testados. A revisão responsiva utilizou o Chromium disponível nas dimensões descritas acima.

### Resultado histórico da primeira publicação

Na primeira publicação, os testes automatizados, a checagem de tipos, o linter global, a compilação e a auditoria de dependências foram concluídos com os resultados históricos acima. A integração passou tanto em desenvolvimento quanto em produção. A conferência dos arquivos rastreados passou pela busca por padrões e pela comparação exata com os segredos locais e os recebidos no ZIP, sem ocorrências. O Git foi inicialmente preparado na branch `main`; a revisão de endurance utiliza a branch indicada no início deste documento.

O [repositório R10 TRI](https://github.com/borgesrbj-oss/r10tri) foi publicado e seu [workflow anterior foi aprovado](https://github.com/borgesrbj-oss/r10tri/actions/runs/43639788897). O portfólio está publicado em [borgesrbj-oss.github.io](https://borgesrbj-oss.github.io/), com [deploy anterior aprovado](https://github.com/borgesrbj-oss/borgesrbj-oss.github.io/actions/runs/43639849786), e o [README de perfil](https://github.com/borgesrbj-oss/borgesrbj-oss) reuniu os oito projetos públicos daquele levantamento. O estado da revisão atual e suas pendências estão registrados no início deste documento.

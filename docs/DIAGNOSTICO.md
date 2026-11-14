# Diagnóstico e correções do R10 TRI

Consolidação iniciada em 14 de novembro de 2026 a partir do ZIP fornecido e das verificações locais. Este documento não contém valores de credenciais.

## Projeto identificado

- Linguagem principal: TypeScript, com componentes React em TSX e utilitários JavaScript.
- Framework: Next.js 16 com App Router, páginas de servidor e rotas HTTP em `app/api`.
- Banco: PostgreSQL com Prisma 6.
- Autenticação: Auth.js/NextAuth com credenciais, sessões JWT e usuários persistidos no banco.
- Gerenciador adotado: npm. O ZIP continha `package.json` e configuração Yarn vinculada a outro ambiente, mas não continha arquivo de versões travadas.
- Entrada: `app/page.tsx`, `app/layout.tsx` e as convenções de roteamento do Next.js; comandos de execução em `package.json`.
- Finalidade: gestão de atletas e planos de treinos de triatlo, calendário, registro de execução, evolução e exportação de treinos.

O ZIP não continha README nem migrações de banco. Continha um `.env` preenchido e uma conta de teste com senha literal no seed original. Esses valores não fazem parte da documentação nem devem ser incluídos no histórico Git. A validação local utiliza banco separado do ambiente original.

## Registro de problemas e soluções

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

## Verificações observadas

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
| Workflow de verificação do projeto | Preparado em `.github/workflows/verificar.yml`; resultado remoto aguardando o primeiro envio ao GitHub. |
| Portfólio | 7 testes de busca, paginação, privacidade e fallback passaram; página e JSON responderam HTTP 200 na revisão local. |

Os testes unitários de segurança executam os handlers reais com dependências controladas. O teste de integração é separado e deve ser executado com o servidor apontando para o mesmo PostgreSQL de testes. Aprovação de teste local não comprova configuração das integrações externas.

## Avisos e limites conhecidos

- A instalação inicial apontou pacotes descontinuados, incluindo Recharts 2, ESLint 9 e dependências antigas de visualização. As versões resolvidas estão no arquivo de dependências; a auditoria final não apontou vulnerabilidades.
- O ESLint 9.39.5 foi mantido porque o `eslint-plugin-react` 7.37.5 utilizado na árvore declara compatibilidade que ainda não inclui ESLint 10. O aviso de descontinuação é conhecido; a migração exige suporte dos plugins e nova validação.
- As bibliotecas Auth.js/NextAuth e Prisma mantêm as versões declaradas no projeto; o NextAuth utilizado é uma versão beta.
- A saída do gerador Prisma é explícita e relativa. Uma atualização principal do Prisma permanece uma alteração separada, com revisão das orientações de migração.
- O ZIP contém guias e exemplos técnicos herdados. Eles foram preservados e não constituem evidência de uma integração externa estar ativa.
- A tela Strava não implementa conexão/sincronização. O usuário informou que fornecerá os arquivos faltantes; essa pendência não foi substituída por uma implementação inventada.
- AWS S3, Abacus e Intervals.icu dependem das configurações e acessos do ambiente definitivo. Nenhum segredo externo foi solicitado em texto aberto.

## Encerramento da validação

Os testes automatizados, a checagem de tipos, o linter global, a compilação e a auditoria de dependências foram concluídos com os resultados acima. A integração passou tanto em desenvolvimento quanto em produção. A conferência dos arquivos rastreados passou pela busca por padrões e pela comparação exata com os segredos locais e os recebidos no ZIP, sem ocorrências. O Git local está preparado na branch `main`.

O workflow remoto e o envio do R10 TRI ainda aguardam confirmação. O portfólio está publicado em [borgesrbj-oss.github.io](https://borgesrbj-oss.github.io/). A pendência funcional continua sendo o recebimento dos arquivos da integração Strava e a configuração das integrações opcionais no ambiente definitivo.

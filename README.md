# R10 TRI

Aplicação web para organizar treinos de triatlo, natação, ciclismo e corrida. Atletas podem preencher seu perfil, cadastrar provas, gerar planos, acompanhar o calendário, registrar treinos e visualizar a evolução. Treinadores podem gerenciar atletas, criar planos e enviar mensagens.

O motor principal de planos é determinístico e funciona sem serviços pagos de inteligência artificial. Há exportações de treinos em FIT, TCX, ZWO, texto e outros formatos oferecidos pela interface. A integração com o Intervals.icu é opcional. A tela Strava foi preservada, mas a conexão e a sincronização **não estão implementadas no código recebido**; os arquivos complementares estão pendentes de fornecimento.

- Repositório: [borgesrbj-oss/r10tri](https://github.com/borgesrbj-oss/r10tri)
- Portfólio: [borgesrbj-oss.github.io](https://borgesrbj-oss.github.io/)
- Histórico de correções e verificações: [docs/DIAGNOSTICO.md](docs/DIAGNOSTICO.md)

## Requisitos e versões

| Componente | Versão definida ou utilizada |
| --- | --- |
| Node.js | Faixas aceitas: `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0`; ambiente validado: `24.14.0` |
| npm | `11.9.0`, registrado em `packageManager` |
| Next.js | `16.4.1`, com App Router |
| React / React DOM | `19.2.8` |
| TypeScript | `5.6.3` |
| Prisma / Prisma Client | `6.7.0` |
| PostgreSQL | Banco obrigatório; testes locais preparados com `18.6` |
| Auth.js / NextAuth | `5.0.0-beta.32` |
| Tailwind CSS | `3.4.0` |
| ESLint | `9.39.5` |

As demais dependências e suas versões estão em `package.json`. O `package-lock.json` registra a árvore resolvida para instalações reproduzíveis com `npm ci`.

## Instalação

Clone o repositório e entre na pasta:

```sh
git clone https://github.com/borgesrbj-oss/r10tri.git
cd r10tri
```

Crie o arquivo de configuração local. No PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```sh
cp .env.example .env
```

Edite `.env` localmente. Preencha `DATABASE_URL` com um PostgreSQL de desenvolvimento vazio, gere `AUTH_SECRET` e confirme a URL local da aplicação. Não envie essas credenciais pelo chat nem as inclua em commits.

Para gerar um segredo aleatório no seu computador:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copie o resultado somente para `AUTH_SECRET` no arquivo local. `NEXTAUTH_SECRET` é um alias legado opcional; se for utilizado junto de `AUTH_SECRET`, mantenha o mesmo valor.

Instale as dependências e aplique as migrações:

```sh
npm ci
npm run db:migrate
```

O `postinstall` executa `prisma generate` automaticamente. Para regenerar o cliente depois de alterar o schema, use `npm run db:generate`. `npm install` pode ser utilizado ao modificar dependências; registre as alterações correspondentes no arquivo de versões travadas.

### Banco de dados

O projeto usa PostgreSQL por meio de `prisma/schema.prisma`. O formato da conexão é:

```text
postgresql://<usuario>:<senha>@<host>:5432/<banco>?schema=public
```

Os campos entre `< >` são marcadores e devem ser substituídos apenas no `.env` local. Caracteres especiais do usuário ou da senha precisam ser codificados para uso em URL.

A migração inicial está em `prisma/migrations/20261113000000_inicial/`. O procedimento acima destina-se a um banco vazio. Uma base existente requer conferência do schema e preparação do histórico de migrações antes de aplicar essa migração inicial.

Não existe conta ou senha padrão. O banco utilizado nos testes é isolado da configuração original recebida no ZIP.

## Execução

Desenvolvimento:

```sh
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A entrada de navegação fica em `app/page.tsx`; o layout principal está em `app/layout.tsx`, e a tela de acesso está em `app/(auth)/login/page.tsx`.

Compilação e execução da versão de produção:

```sh
npm run build
npm start
```

O servidor de produção também precisa de PostgreSQL, origem pública e segredo de autenticação configurados. Esta aplicação possui rotas de servidor e acesso ao banco; o GitHub Pages é utilizado pelo portfólio estático separado.

## Variáveis de ambiente

O modelo completo fica em [.env.example](.env.example), sem segredos preenchidos.

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | Conexão com PostgreSQL. Obrigatória para operações persistentes. |
| `AUTH_SECRET` | Segredo de autenticação e assinatura de links. Configure antes de executar o fluxo de acesso. |
| `NEXTAUTH_SECRET` | Alias legado opcional de `AUTH_SECRET`. |
| `NEXTAUTH_URL` | Origem canônica da aplicação, por exemplo `http://localhost:3000`. Configure a origem HTTPS correta em produção. |
| `APP_ORIGIN` | Alternativa de origem para fluxos internos/mobile. Use a mesma origem canônica da aplicação. |
| `MOBILE_DEEP_LINK_SCHEMES` | Lista separada por vírgulas de esquemas exatos autorizados para retorno ao aplicativo mobile. Não inclua `://`. |
| `MOBILE_PREVIEW_ORIGINS` | Origens HTTP(S) exatas autorizadas para preview mobile em desenvolvimento, separadas por vírgulas. |
| `ABACUSAI_API_KEY` | Integração opcional para frase motivacional e envio de notificações. A geração de planos não depende dela. |
| `WEB_APP_ID` | Identificador utilizado no envio opcional de e-mail de boas-vindas. |
| `NOTIF_ID_BOASVINDAS_AO_ATLETA` | Identificador da notificação de boas-vindas do provedor. |
| `AWS_PROFILE` | Perfil de credenciais AWS já existente no computador, quando esse mecanismo for utilizado. |
| `AWS_REGION` | Região do armazenamento S3. |
| `AWS_BUCKET_NAME` | Bucket utilizado para imagens e arquivos. |
| `AWS_FOLDER_PREFIX` | Prefixo opcional dos objetos no bucket. |
| `SEED_EMAIL` | E-mail da conta inicial criada explicitamente pelo seed. |
| `SEED_PASSWORD` | Senha local da conta inicial: pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. |
| `SEED_ROLE` | Perfil explícito da conta inicial: `coach` ou `atleta`. |
| `SEED_NAME` | Nome opcional da conta inicial. |
| `DEV_ALLOWED_ORIGINS` | Hosts adicionais permitidos para acesso ao servidor de desenvolvimento. |
| `NEXT_DIST_DIR` | Diretório de compilação, com padrão `.next`. |
| `NEXT_OUTPUT_MODE` | Opção de saída do Next.js; mantenha sem definição se não precisar de uma configuração específica. |
| `AUTH_SMOKE_BASE` | URL do servidor usado pelo teste simples de autenticação. |
| `INTEGRATION_SMOKE_BASE` | URL local usada pelo teste de integração; padrão `http://localhost:3000`. |
| `PORT` | Porta de execução e referência dos fluxos locais; padrão `3000`. |

As origens devem conter apenas protocolo, host e porta, sem caminho, parâmetros ou credenciais. Em produção, os fluxos mobile exigem `NEXTAUTH_URL` ou `APP_ORIGIN` explicitamente configurada. Esquemas genéricos e origens de preview externas não são autorizados automaticamente.

`COACH_EMAILS` não concede mais permissões. O papel do usuário é obtido do banco e revalidado nas sessões.

## Primeiro treinador e convites

Para criar uma conta inicial, preencha localmente `SEED_EMAIL`, `SEED_PASSWORD`, `SEED_ROLE` e, opcionalmente, `SEED_NAME`. Execute:

```sh
npm run db:seed
```

O seed cria somente a conta informada. Se o e-mail já existir, ele interrompe sem alterar senha ou permissões. Ele não é executado automaticamente durante a instalação ou a compilação.

O cadastro público cria atletas. Um treinador pode cadastrar um atleta convidado pela interface de gestão e copiar seu link de primeiro acesso. O convite expira em 48 horas, pode ser renovado enquanto a conta não tiver senha e é consumido uma única vez. Somente seu hash é salvo no banco. O token do link fica no fragmento `#` da URL para evitar seu envio em navegações e no cabeçalho de referência.

O atleta precisa desse link para definir a senha. Conhecer apenas o e-mail não permite ativar a conta. O envio opcional por e-mail depende da configuração do provedor; o treinador também pode copiar o convite pela interface.

## Integrações

- **Intervals.icu:** cada atleta pode configurar sua chave pela interface. O servidor utiliza a chave para envio de treinos. Respostas de perfil e propriedades enviadas ao navegador expõem apenas `hasIntervalsKey`, sem devolver a credencial salva.
- **AWS S3:** necessário somente para o fluxo de upload. Configure bucket, região e um provedor válido de credenciais do SDK AWS. Não há credenciais de armazenamento incluídas no repositório.
- **Abacus:** opcional para frases motivacionais geradas pelo serviço e e-mails de boas-vindas. Sem a chave, a frase motivacional utiliza o conteúdo local. O motor de planos continua funcionando.
- **Strava:** a tela recebida é informativa. Não há implementação funcional de conexão e sincronização no ZIP; configurar `STRAVA_CLIENT_ID` e `STRAVA_CLIENT_SECRET` isoladamente não ativa a integração. Os arquivos faltantes serão analisados quando forem fornecidos.
- **Garmin e outros aplicativos:** o projeto gera arquivos de treino para importação. A exportação de um arquivo não equivale a uma sincronização automática com a conta do serviço.

## Testes e verificações

```sh
npm test
npm run typecheck
npm run lint -- --max-warnings 0
npx prisma validate
npm audit
npm run verificar:segredos
```

Os testes automatizados cobrem autorização de treinos, convites, privacidade de perfil, permissões, configurações mobile, geração de planos e exportações. Os testes FIT verificam integridade e leitura com o SDK da Garmin.

Com o servidor de desenvolvimento em execução, o teste simples de autenticação pode ser iniciado em outro terminal:

```sh
node scripts/auth-smoke.mjs
```

Esse teste cria uma conta temporária no banco configurado. Para a bateria de integração com PostgreSQL isolado:

```sh
npm run test:integracao
```

O teste integrado aceita somente servidor HTTP local e banco PostgreSQL em `127.0.0.1`, com nome `r10tri_test` ou `r10tri_ci`. Ele verifica se o servidor grava no mesmo banco e recusa a execução com o envio externo de e-mails configurado. Cria quatro contas aleatórias de teste, testa isolamento entre atletas, geração de plano, privacidade de chave e primeiro acesso por convite. Os registros permanecem no banco de testes; nenhuma conta preexistente é alterada.

`typecheck` gera primeiro os tipos do Next.js com `next typegen` e depois executa `tsc --noEmit`. A verificação de segredos examina os arquivos rastreados pelo Git e informa somente os caminhos com possíveis ocorrências; execute-a após preparar os arquivos que entrarão no commit. Essa busca por padrões complementa a revisão dos arquivos e do histórico.

O workflow [.github/workflows/verificar.yml](.github/workflows/verificar.yml) prepara PostgreSQL isolado com credenciais efêmeras, instala com `npm ci`, aplica as migrações, executa as verificações, compila e testa a aplicação em produção. O resultado remoto será registrado depois do primeiro envio ao GitHub.

Na validação local final, passaram os 28 testes automatizados, o linter global sem erros ou avisos, a geração e checagem de tipos e a compilação de produção. Os 21 cenários de integração passaram tanto em desenvolvimento quanto na versão de produção. A auditoria npm final não identificou vulnerabilidades, e `npm ls --all` confirmou a árvore de dependências sem erros. Os arquivos rastreados também passaram pela busca por padrões e pela comparação com os segredos dos ambientes locais, sem ocorrências.

O arquivo [docs/DIAGNOSTICO.md](docs/DIAGNOSTICO.md) distingue verificações já observadas de validações ainda pendentes.

## Estrutura de pastas

```text
r10tri/
├── app/
│   ├── (auth)/             Telas de acesso, cadastro e definição de senha
│   ├── (app)/              Painel, atletas, planos, calendário e evolução
│   ├── api/                Rotas HTTP de autenticação e recursos do domínio
│   ├── layout.tsx          Layout e metadados principais
│   └── page.tsx            Entrada da navegação
├── components/             Componentes visuais, layouts e visualizações
├── hooks/                  Hooks de interface e estado do navegador
├── lib/                    Banco, geração de planos, exportações e segurança
├── prisma/
│   ├── schema.prisma       Modelo de dados PostgreSQL
│   └── migrations/         Histórico de migrações
├── public/                 Ícones, imagens e recursos estáticos
├── scripts/                Seed, manutenção e testes integrados
├── tests/                  Testes automatizados
├── types/                  Declarações TypeScript
├── docs/                   Diagnóstico e registro de correções
├── .github/workflows/      Verificação automática no GitHub Actions
├── auth.ts                 Configuração de autenticação
├── proxy.ts                Ponte de acesso às APIs mobile
├── .env.example            Modelo de configuração sem segredos
├── .gitignore              Exclusão de credenciais, dependências e artefatos
├── package.json            Dependências e comandos
└── package-lock.json       Versões resolvidas
```

Os guias e exemplos técnicos recebidos foram preservados. A documentação acima descreve o comportamento efetivamente presente no código revisado.

## Proteção de credenciais

`.env`, dependências instaladas, compilações, caches, logs e arquivos de chaves ficam fora do versionamento conforme `.gitignore`. O exemplo de ambiente não contém segredos. O seed não inclui conta oculta ou senha fixa. Cookies de sessão, links de convite, chaves de integração e cópias do ambiente original não devem ser incluídos em commits, capturas ou relatórios públicos.

## Pendências conhecidas

- Receber e revisar os arquivos complementares da integração Strava.
- Configurar as integrações opcionais desejadas no ambiente definitivo, sem compartilhar segredos em texto aberto.
- Registrar o resultado do primeiro workflow remoto.

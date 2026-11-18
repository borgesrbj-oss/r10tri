# R10 TRI

Aplicação web para organizar treinos de triatlo, natação, ciclismo e corrida. Atletas podem preencher seu perfil, cadastrar provas, gerar planos, acompanhar o calendário, registrar treinos e visualizar a evolução. Treinadores podem gerenciar atletas, criar planos e enviar mensagens.

O motor principal de planos é determinístico e funciona sem serviços pagos de inteligência artificial. Há exportações de treinos em FIT, TCX, ZWO, texto e outros formatos oferecidos pela interface. A integração com o Intervals.icu é opcional. A tela Strava foi preservada, mas a conexão e a sincronização **não estão implementadas no código recebido**; os arquivos complementares estão pendentes de fornecimento.

- Repositório: [borgesrbj-oss/r10tri](https://github.com/borgesrbj-oss/r10tri)
- Portfólio: [borgesrbj-oss.github.io](https://borgesrbj-oss.github.io/)
- Aplicativo: [acessar R10 TRI](https://r10tri-production.up.railway.app/login)
- Auditoria científica, redesign e entregáveis de novembro: [docs/ENTREGA_AUDITORIA_2026.md](docs/ENTREGA_AUDITORIA_2026.md)
- Histórico de correções e verificações: [docs/DIAGNOSTICO.md](docs/DIAGNOSTICO.md)
- Metodologia, parâmetros e limites: [docs/METODOLOGIA_TREINOS.md](docs/METODOLOGIA_TREINOS.md)
- Testes por fluxo, navegador e dispositivo: [docs/CHECKLIST_ENDURANCE.md](docs/CHECKLIST_ENDURANCE.md)

## Ajustes de endurance

A revisão incremental acrescenta triagem orientada, alvos por limiar/FTP/CSS ou percepção, blocos completos de treino, resumo real do tempo 80/20, alertas para o coach, estimativa de corrida, compartilhamento por link de WhatsApp e check-in com sono, fadiga e dor. O calendário e os planos antigos continuam acessíveis. A estimativa de prova utiliza Riegel; o projeto não anuncia uma avaliação automática validada de VDOT.

O motor respeita dias e horas informados e identifica as situações que exigem revisão do treinador. Sem dados suficientes, solicita completar a triagem. Objetivo e modo da corrida influenciam os blocos: FC de limiar funcional no modo por zona, quando os dados e equipamento permitem, ou pace/percepção; distâncias auxiliares exigem pace válido. O horizonte pode ser automático até a prova mais duas semanas ou explícito de 1 a 52 semanas, com aviso quando o automático excede o limite.

A distribuição 80/20 é calculada pelos passos aeróbicos ativos; força e pausas passivas são mostradas separadamente. Adaptação, recuperação, prova, transição e restrições podem reduzir a intensidade com justificativa. Plano e planilha mostram blocos, avisos e necessidade de revisão; o PDF/CSV da planilha conserva essas orientações. Os [detalhes da metodologia](docs/METODOLOGIA_TREINOS.md) distinguem referências científicas de parâmetros operacionais do aplicativo.

## Requisitos e versões

| Componente | Versão definida ou utilizada |
| --- | --- |
| Node.js | Faixas aceitas: `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0`; ambiente validado: `24.14.0` |
| npm | `11.9.0`, registrado em `packageManager` |
| Next.js | `16.4.6`, com App Router |
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

A migração inicial está em `prisma/migrations/20261113000000_inicial/`; a migração aditiva de endurance está em `prisma/migrations/20261114010000_endurance/`. Um banco já mantido por estas migrações recebe as novas colunas com `npm run db:migrate`. Uma base legada sem histórico exige conferência e preparação do histórico antes de aplicar a migração inicial. Não utilize reset de banco para atualizar uma base com dados.

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
| `SEED_USERNAME` | Identificador opcional de acesso da conta inicial. |
| `SMTP_HOST`, `SMTP_PORT` | Servidor e porta para recuperação de senha por e-mail. |
| `SMTP_USER`, `SMTP_PASSWORD` | Autenticação SMTP; valores privados do ambiente. |
| `SMTP_FROM` | Endereço de e-mail remetente autorizado pelo serviço. |
| `SMTP_SECURE` | `true` para TLS implícito, normalmente na porta 465; `false` para STARTTLS, normalmente na 587. TLS permanece obrigatório. |
| `BOOTSTRAP_COACH_EMAIL`, `BOOTSTRAP_COACH_USERNAME`, `BOOTSTRAP_COACH_NAME` | Identificação privada da conta inicial na hospedagem, quando esse procedimento for utilizado. |
| `BOOTSTRAP_COACH_PASSWORD_HASH` | Hash bcrypt privado, com custo mínimo 12, para criação inicial na hospedagem. Nunca use uma senha literal neste campo nem versione o hash. |
| `DEV_ALLOWED_ORIGINS` | Hosts adicionais permitidos para acesso ao servidor de desenvolvimento. |
| `NEXT_DIST_DIR` | Diretório de compilação, com padrão `.next`. |
| `NEXT_OUTPUT_MODE` | Opção de saída do Next.js; mantenha sem definição se não precisar de uma configuração específica. |
| `AUTH_SMOKE_BASE` | URL do servidor usado pelo teste simples de autenticação. |
| `INTEGRATION_SMOKE_BASE` | URL local usada pelo teste de integração; padrão `http://localhost:3000`. |
| `PORT` | Porta de execução e referência dos fluxos locais; padrão `3000`. |

As origens devem conter apenas protocolo, host e porta, sem caminho, parâmetros ou credenciais. Em produção, os fluxos mobile exigem `NEXTAUTH_URL` ou `APP_ORIGIN` explicitamente configurada. Esquemas genéricos e origens de preview externas não são autorizados automaticamente.

`COACH_EMAILS` não concede mais permissões. O papel do usuário é obtido do banco e revalidado nas sessões.

## Login e recuperação de senha

O acesso aceita e-mail ou identificador de usuário realmente cadastrado. O identificador é comparado sem distinguir maiúsculas e com remoção de espaços externos; a senha é preservada integralmente, inclusive espaços e caracteres especiais. Não existe identificador universal ou conta padrão embutida. A interface usa Auth.js para abrir a sessão; a rota legada `/api/auth/login` apenas valida credenciais e não deve ser usada como substituta da criação de sessão.

O fluxo “Esqueci minha senha” exige SMTP configurado. O link expira em 30 minutos e funciona uma única vez; o banco guarda somente o hash do token. A solicitação tem intervalo mínimo de 60 segundos e resposta genérica quando o serviço está disponível. A redefinição invalida sessões anteriores. Sem SMTP, o serviço informa indisponibilidade por HTTP 503 e não publica token nem link de recuperação. Configuração de código não comprova entrega real de e-mail.

O usuário escolheu conectar o Resend. O [guia de configuração do remetente](docs/CONFIGURAR_EMAIL.md) explica as variáveis privadas e a verificação de domínio, sem incluir credenciais.

## Primeiro treinador e convites

Para criar uma conta inicial, preencha localmente `SEED_EMAIL`, `SEED_PASSWORD`, `SEED_ROLE` e, opcionalmente, `SEED_NAME`. Execute:

```sh
npm run db:seed
```

O seed cria somente a conta informada. Se o e-mail já existir, ele interrompe sem alterar senha ou permissões. Ele não é executado automaticamente durante a instalação ou a compilação.

Na hospedagem, `npm run db:prepare` aplica as migrações e executa `npm run db:bootstrap`. O bootstrap é opcional, depende exclusivamente das variáveis privadas `BOOTSTRAP_COACH_*` e não cria conta se estiverem ausentes. Ele é idempotente para a conta de coach correspondente e não redefine sua senha a cada deploy. Inconsistências de identidade ou permissões interrompem a criação para revisão, em vez de fundir contas automaticamente.

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

Para os cenários específicos de login e recuperação, com o mesmo ambiente local isolado:

```sh
npm run test:auth
```

Sem certificados de teste, esse script usa o servidor local existente e verifica também a resposta de SMTP indisponível. O modo de recuperação completa utiliza um servidor SMTP TLS de teste e uma instância própria da aplicação compilada, conforme as opções descritas no início de `scripts/auth-recovery-smoke.mjs`; ele não comprova entrega por um provedor real. Os scripts de integração criam contas aleatórias somente em banco de testes autorizado e não devem ser apontados para a produção.

O teste integrado aceita somente servidor HTTP local e banco PostgreSQL em `127.0.0.1`, com nome `r10tri_test` ou `r10tri_ci`. Ele verifica se o servidor grava no mesmo banco e recusa a execução com o envio externo de e-mails configurado. Cria quatro contas aleatórias de teste, testa isolamento entre atletas, geração de plano, privacidade de chave e primeiro acesso por convite. Os registros permanecem no banco de testes; nenhuma conta preexistente é alterada.

`typecheck` gera primeiro os tipos do Next.js com `next typegen` e depois executa `tsc --noEmit`. A verificação de segredos examina os arquivos rastreados pelo Git e informa somente os caminhos com possíveis ocorrências; execute-a após preparar os arquivos que entrarão no commit. Essa busca por padrões complementa a revisão dos arquivos e do histórico.

O workflow [.github/workflows/verificar.yml](.github/workflows/verificar.yml) prepara PostgreSQL isolado com credenciais efêmeras, instala com `npm ci`, aplica as migrações, executa as verificações, compila e testa a aplicação em produção. A [execução 43639788897](https://github.com/borgesrbj-oss/r10tri/actions/runs/43639788897) aprovou a publicação anterior em Linux, com 28 testes e 21 cenários de integração em produção. Esse resultado é histórico e não substitui uma nova execução das alterações de endurance.

Em 16 de novembro de 2026, passaram os 130 testes automatizados, a checagem de tipos, o build final de produção e o lint global sem erros ou avisos. A auditoria npm não identificou vulnerabilidades e a verificação de segredos examinou 236 arquivos sem ocorrências. Na execução local em modo de produção, passaram os 21 cenários de integração HTTP/PostgreSQL, os 10 cenários de recuperação com SMTP TLS de teste e os 10 cenários de autenticação sem SMTP. O provedor real de e-mail e a publicação ainda precisam de validação; os detalhes ficam no [checklist](docs/CHECKLIST_ENDURANCE.md).

O acesso por identificador foi conferido no Chrome com conta temporária de teste. Menu, planilha e blocos foram verificados em largura de 390 pixels, sem transbordamento horizontal da página observado. O portfólio já havia sido conferido no Chromium em computador e larguras de 390 e 430 pixels. Essas verificações não substituem testes em Android/iPhone físicos ou Safari, ainda pendentes.

O arquivo [docs/DIAGNOSTICO.md](docs/DIAGNOSTICO.md) distingue verificações já observadas de validações ainda pendentes.

O contrato [openapi.json](openapi.json) documenta as novas rotas de saúde, recuperação, alertas e exportação individual, além da geração com duração automática, objetivos e estruturas versionadas. As rotas legadas foram preservadas.

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

Os guias técnicos úteis ao funcionamento foram preservados. A limpeza anterior foi autorizada somente para componentes ociosos e exemplos. A auditoria atual não removeu funcionalidades. As 20 novas sugestões e cinco finalistas estão em [docs/BENCHMARK_E_MARCA_2026.md](docs/BENCHMARK_E_MARCA_2026.md); R10 TRI permanece provisoriamente, sem mudança automática da marca.

## Publicação do aplicativo

O aplicativo precisa de uma hospedagem com Node.js e PostgreSQL. `railway.json` descreve a compilação, a preparação do banco, a inicialização e a verificação de saúde em `/api/health`. As variáveis do ambiente definitivo devem ser preenchidas no painel privado da hospedagem, com origem HTTPS consistente.

O aplicativo está hospedado no Railway, com PostgreSQL e HTTPS, no endereço acima. O portfólio estático do GitHub Pages permanece independente do servidor do app. A auditoria nova usa migração aditiva; não execute reset do banco. O motor incorpora limites por dia, afastamento, prioridade de prova e feedback recente, sem alterar planos antigos silenciosamente.

## Proteção de credenciais

`.env`, dependências instaladas, compilações, caches, logs e arquivos de chaves ficam fora do versionamento conforme `.gitignore`. O exemplo de ambiente não contém segredos. O seed não inclui conta oculta ou senha fixa. Cookies de sessão, links de convite, chaves de integração e cópias do ambiente original não devem ser incluídos em commits, capturas ou relatórios públicos.

## Pendências conhecidas

- Receber e revisar os arquivos complementares da integração Strava.
- Configurar as integrações opcionais desejadas no ambiente definitivo, sem compartilhar segredos em texto aberto.
- Verificar entrega real de recuperação: Resend está configurado sem domínio próprio, limitado ao e-mail associado à conta. Envio geral a atletas requer remetente autorizado, conforme [guia de e-mail](docs/CONFIGURAR_EMAIL.md).
- Aprovar nome definitivo; nenhuma sugestão equivale a liberação jurídica de marca.
- Executar o checklist no Safari e em aparelhos Android/iPhone reais; esses ambientes não estavam disponíveis para validação física.

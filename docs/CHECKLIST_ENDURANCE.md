# Checklist de validação do R10 TRI

Registro atualizado em 16 de novembro de 2026. Uma caixa marcada indica evidência observada nesta revisão; caixas abertas indicam trabalho pendente ou dependência externa. Testes automatizados, simulação de largura e uso em dispositivo real são evidências diferentes.

## Evidências já observadas

- [x] Bateria global automatizada: 130 de 130 testes passaram.
- [x] Checagem de tipos e lint global passaram, sem erros ou avisos de lint.
- [x] Auditoria npm: zero vulnerabilidades.
- [x] Verificação de segredos: 236 arquivos examinados, sem ocorrências.
- [x] Integração local em modo de produção: 21 de 21 cenários HTTP/PostgreSQL passaram.
- [x] Recuperação com servidor SMTP TLS de teste: 10 de 10 cenários passaram.
- [x] Autenticação sem SMTP: 10 de 10 cenários passaram.
- [x] Chrome disponível: acesso por identificador com conta temporária; menu, planilha e blocos a 390 px sem transbordamento horizontal da página observado.
- [x] Build final de produção passou.
- [ ] Validar o aplicativo publicado e registrar a URL confirmada.

Os 130 testes são a bateria global; os cenários HTTP e SMTP foram executados separadamente. O SMTP de teste não comprova entrega pelo provedor definitivo. O histórico de publicação anterior, com 28 testes e 21 cenários de integração, permanece no [diagnóstico](DIAGNOSTICO.md).

## Acesso e recuperação

- [x] Entrar com e-mail cadastrado, incluindo espaços externos e variação de maiúsculas, nos testes HTTP locais.
- [x] Entrar com identificador de usuário cadastrado no Chrome, usando conta temporária de teste.
- [x] Confirmar nos testes automatizados/HTTP que senha incorreta não abre sessão e recebe tratamento de erro.
- [x] Confirmar nos testes HTTP que senha válida mantém espaços e caracteres especiais sem transformação.
- [ ] Confirmar persistência da sessão após atualizar a página e encerrar a sessão pelo menu.
- [ ] Solicitar recuperação com SMTP real e receber mensagem no endereço esperado.
- [x] Validar token expirado/adulterado e uso único nos testes de recuperação; a validade configurada de 30 minutos é coberta por testes automatizados.
- [x] Confirmar por HTTP que a senha anterior e as sessões anteriores deixam de funcionar após a redefinição.
- [x] Repetir a solicitação com SMTP TLS de teste e conferir intervalo mínimo de 60 segundos, com resposta sem indicação de existência da conta.
- [x] Sem SMTP, confirmar resposta de serviço indisponível, sem token ou link na resposta pública, nos testes HTTP.

## Matriz de navegador e dispositivo

| Ambiente | Evidência disponível | Validação que falta |
| --- | --- | --- |
| Chrome disponível no computador | Login por identificador; menu, planilha e blocos a 390 px sem transbordamento horizontal da página | Conferir os demais fluxos na origem publicada |
| Chrome em Android físico | Nenhuma execução física registrada nesta revisão | Login, sessão, recuperação, calendário, triagem, downloads e instalação |
| Chrome em iPhone físico | Nenhuma execução física registrada nesta revisão | Login, sessão, recuperação, teclado, navegação e downloads |
| Safari em macOS | Navegador indisponível no ambiente de trabalho | Login, cookies, navegação e recuperação |
| Safari em iPhone físico | Aparelho/navegador indisponíveis no ambiente de trabalho | Fluxos acima, áreas seguras, instalação pela tela inicial e retorno do app |

Larguras simuladas em Chromium ajudam a encontrar problemas de layout, mas não comprovam o comportamento do Safari, de um aparelho físico ou de um aplicativo instalado.

## PWA, responsividade e privacidade

- [x] Manifesto, ícones e página offline neutra presentes.
- [x] Registro do service worker restrito à produção em contexto seguro.
- [x] Política de cache exclui APIs, autenticação, HTML privado e recursos com parâmetros; arquivos públicos são explicitamente permitidos.
- [x] Layout inclui `100dvh`, áreas seguras, texto de inputs adequado no iOS e preferência por movimento reduzido.
- [x] Conferir no Chrome disponível menu, planilha e blocos a 390 px sem transbordamento horizontal da página observado.
- [ ] Conferir navegação e ausência de rolagem horizontal em 320, 375, 390, 430, 768 e 1.280 px, com teclado aberto.
- [ ] Instalar em Android pelo navegador e abrir pela tela inicial.
- [ ] Instalar em iPhone pelo Safari e abrir pela tela inicial.
- [ ] Abrir offline e confirmar que aparece somente a orientação neutra, sem dados pessoais de outro acesso.
- [ ] Atualizar a versão e conferir troca do service worker e limpeza do cache anterior.
- [ ] Confirmar funcionamento online ao alternar entre Wi-Fi e dados móveis.
- [ ] Validar notificações somente quando houver serviço de push configurado; instalação não equivale a push habilitado.

A instalação depende de contexto seguro e suporte do navegador. Consulte a [orientação de instalação PWA da MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable). O suporte de Web Push no iOS tem requisitos próprios de versão, instalação e permissão do usuário, descritos pelo [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); o projeto não declara um serviço de push ativo.

## Triagem, planos e acompanhamento

- [ ] Salvar triagem incompleta e visualizar exatamente os campos que faltam antes de gerar.
- [ ] Gerar com triagem válida e confirmar os dias e o teto de horas informados.
- [ ] Conferir aquecimento, principal, recuperação e desaquecimento, alvos e soma de duração em cada modalidade.
- [ ] Conferir semanas de adaptação/recuperação e a justificativa para menos de 20% intenso.
- [ ] Comparar a distribuição exibida com os segundos dos passos; força e descanso passivo devem aparecer separados.
- [ ] Confirmar que lesão ou condição relatada sinaliza revisão do coach.
- [ ] Abrir plano antigo sem estrutura e confirmar a identificação de informações parciais.
- [ ] Confirmar que a previsão de prova recusa dados ausentes, futuros, antigos ou fora do intervalo suportado.
- [ ] Conferir que objetivo escolhido modifica os blocos/alocação e aparece no resumo salvo.
- [ ] Gerar por zona com FC de limiar e monitor; conferir bpm, teto de FC máxima e aviso sobre atraso da FC.
- [ ] Gerar por zona sem limiar/monitor e conferir fallback explícito para pace ou percepção.
- [ ] Gerar por distância com e sem limiar de pace; sem ele, confirmar aviso e blocos por tempo, sem distância inventada.
- [ ] Usar duração automática com prova e confirmar cobertura até prova mais duas semanas; além de 52 semanas, exigir escolha explícita.
- [ ] Abrir a planilha e conferir banner de revisão, avisos, distribuição real e detalhes dos blocos; PDF/CSV devem conservar as orientações.
- [ ] Registrar check-in com valores zero, limites válidos e inválidos; conferir atualização dos alertas.
- [ ] Confirmar que um atleta não acessa os alertas do coach nem dados de outro atleta.
- [ ] Abrir link de WhatsApp e revisar o texto, sem envio automático.

## Exportação, serviços e publicação

- [ ] Baixar o treino selecionado em cada formato oferecido e verificar duração, passos e alvo no arquivo.
- [ ] Importar FIT em equipamento ou aplicativo Garmin compatível; exportação não comprova sincronização de conta.
- [ ] Importar os formatos de ciclismo em Zwift, Rouvy ou MyWhoosh, conforme o formato aceito por cada serviço.
- [ ] Conferir PDF com blocos longos, caracteres acentuados e várias páginas.
- [ ] Validar Intervals.icu com configuração privada autorizada.
- [ ] Receber os arquivos complementares da integração Strava e validar antes de anunciar conexão disponível.
- [ ] Confirmar deploy do app, migrações aditivas, resposta de `/api/health` e sessão pela origem HTTPS definitiva.
- [ ] Configurar SMTP real pelo painel privado da hospedagem e validar entrega e recuperação.

Nenhuma chave, cookie, link de recuperação, senha ou conteúdo de `.env` deve entrar em capturas, relatórios públicos ou commits de evidência.

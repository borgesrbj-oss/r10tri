# PWA e compatibilidade móvel

## O que foi ajustado

O R10 TRI mantém as páginas, a identidade visual e as funções existentes. O manifesto recebeu identidade estável, idioma, escopo e ponto de entrada. Os ícones PNG existentes de 192 e 512 pixels foram preservados e tiveram suas dimensões verificadas. Eles são declarados como ícones comuns; não há promessa de área segura para recorte de ícone maskable.

O componente `components/pwa-manager.tsx` registra `public/sw.js` em produção quando o navegador oferece service worker e o contexto é seguro. O botão Instalar aplicativo utiliza a solicitação nativa quando ela está disponível e oferece instruções acessíveis nos demais casos. A instalação não é forçada e nenhuma permissão de notificação é pedida automaticamente.

O service worker guarda apenas uma lista fixa de arquivos públicos: a página neutra de reconexão e os ícones. Não armazena páginas autenticadas, respostas da API, rotas de autenticação, arquivos de treinos, avatares ou recursos externos. Requisições de escrita e carregamentos internos do Next.js seguem pela rede. Navegações bem-sucedidas também seguem pela rede e não são persistidas no Cache Storage. Falhas HTTP continuam visíveis; somente falhas de conexão levam à tela neutra de reconexão.

Os cabeçalhos de `/sw.js` impedem a reutilização de uma cópia HTTP antiga e limitam o escopo à aplicação. A ativação remove apenas versões antigas do cache público com o prefixo `r10tri-publico-`, sem tocar em caches de outros aplicativos. O modo offline não permite consultar ou gravar dados de atletas.

O layout usa altura dinâmica `100dvh`, com alternativa `100vh`. Foram incluídos os espaços seguros de tela em navegação, conteúdo, formulários e rodapé. Controles em telas estreitas usam texto de 16 pixels, mantendo permitido o zoom de acessibilidade. O menu móvel permanece disponível até 1279 pixels; a navegação de computador admite rolagem horizontal dentro do próprio menu, sem estourar a largura da página. O botão Sair permanece separado dessa faixa no computador. Links não contêm botões aninhados, e o menu oferece rótulos acessíveis, estado expandido e fechamento por Escape.

O script externo herdado foi limitado à área autenticada. Ele não é carregado nas telas de login, recuperação ou primeiro acesso, nas quais podem existir senhas e links sensíveis. Seu recurso foi preservado dentro da área de aplicação.

## Requisitos de acesso

- Em produção, use um endereço público HTTPS e a mesma origem canônica configurada no servidor. O endereço HTTP privado de um computador da rede não equivale a HTTPS no celular.
- `localhost` e loopback são exceções aceitas para desenvolvimento no próprio aparelho. `localhost` no iPhone aponta para o iPhone, não para o computador que executa o servidor.
- O registro do service worker ocorre na versão de produção. Valide a instalação depois de `npm run build` e `npm start`, ou no ambiente HTTPS publicado.
- No iPhone/iPad, use Compartilhar → Adicionar à Tela de Início. Quando aparecer Abrir como App da Web, mantenha a opção ativada. No Safari do Mac, a opção pode aparecer em Arquivo → Adicionar ao Dock.
- No Chrome/Android, a promoção nativa de instalação depende do navegador. Caso não apareça, consulte seu menu de instalação/tela inicial.
- Em navegação privada, com armazenamento bloqueado ou sem APIs disponíveis, o app continua funcionando online, mas a instalação ou o service worker podem não estar disponíveis.

## Notificações

A interface detecta as APIs de push e notificações, mas não apresenta o recebimento de push como uma função já configurada. O envio depende de um serviço no servidor, chaves próprias e assinatura do aparelho. No iPhone, Web Push exige uma aplicação adicionada à tela inicial e solicitação de permissão em resposta à interação do usuário. Não existe pedido automático de permissão.

## Verificações já executadas

`node --test tests/pwa.test.mjs` executa o código real do service worker em ambiente controlado. A bateria verifica a lista pública, omissão de credenciais ao preparar esse cache, isolamento de caches, passagem das APIs/autenticação/mutações, ausência de persistência de HTML privado, fallback neutro, preservação de erros HTTP, recursos externos/chunks fora do cache e dimensões reais dos ícones.

O lint dos arquivos desta alteração passou sem erros ou avisos. Testes em sandbox não comprovam instalação nativa, permissões, teclado ou cookies em dispositivos reais.

## Checklist por navegador e dispositivo

| Cenário | Chrome no computador | Chrome no Android real | Safari no Mac real | Safari no iPhone real |
| --- | --- | --- | --- | --- |
| Abrir o endereço HTTPS e verificar certificado | A validar no ambiente publicado | A validar | A validar | A validar |
| Entrar, recarregar e manter a sessão | A validar com o fluxo de autenticação revisado | A validar | A validar | A validar no navegador e no app instalado |
| Login inválido e recuperação de senha | A validar com o fluxo revisado | A validar | A validar | A validar |
| Manifesto e ícones corretos | Dimensões e contrato verificados automaticamente | Conferir ícone após instalar | Conferir ícone no Dock | Conferir ícone na tela inicial |
| Instalação / abertura standalone | A validar no navegador | A validar | A validar com Adicionar ao Dock | A validar com Adicionar à Tela de Início |
| Navegação em 390, 430, 768 e 1440 pixels | QA visual a registrar pelo responsável | Conferir retrato e paisagem | Conferir redimensionamento | Conferir retrato e paisagem com notch |
| Teclado não encobre os campos e ações | A validar | A validar | Não se aplica ao teclado móvel | A validar com sugestões de senha e zoom |
| Menu completo e botão Sair acessíveis | A validar por mouse e teclado | A validar por toque | A validar por teclado | A validar por toque e VoiceOver |
| Navegar sem rede mostra orientação neutra | Política verificada em teste; validar navegador | A validar no app instalado | A validar | A validar no app instalado |
| Nenhum dado de atleta no Cache Storage | Verificado em sandbox; conferir armazenamento real | A validar | A validar no Web Inspector | A validar no Web Inspector remoto |
| Retomar a rede e salvar sem duplicar | A validar | A validar | A validar | A validar |
| Push | Dependente de serviço configurado; não simulado | Dependente do serviço | Dependente do serviço | Dependente do serviço + tela inicial + gesto do usuário |

Safari real, Android físico e iPhone físico não estão disponíveis nesta estação de validação. Não foram declarados como testados. A conferência de Chromium e de larguras de tela deve ser registrada separadamente pelo responsável pela revisão visual.

## Fontes técnicas

- [MDN — requisitos e diferenças de instalação de PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
- [MDN — service workers, contexto seguro e ciclo de atualização](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
- [WebKit — Web Push para aplicações na tela inicial do iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
- [WebKit — mudanças das aplicações web no Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
- [WebKit — unidades dinâmicas de viewport no Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/).
- [MDN — variáveis CSS de áreas seguras](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env).
- A implementação de metadados também segue os guias `generate-viewport.md` e `manifest.md` distribuídos com a versão instalada do Next.js.

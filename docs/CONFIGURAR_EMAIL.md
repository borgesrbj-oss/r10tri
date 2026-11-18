# Ativar recuperação de senha com Resend

O fluxo foi testado com SMTP local TLS. A conta Resend foi conectada e as credenciais foram configuradas no painel privado da hospedagem. Por escolha do usuário, o remetente atual é `onboarding@resend.dev`, sem domínio próprio. **Nesse modo o Resend permite enviar somente ao endereço associado à conta Resend.** A recuperação para outros atletas exige futuramente um domínio verificado ou outro provedor que autorize um remetente adequado; não há contorno dessa restrição no código.

Com `SMTP_HOST=smtp.resend.com`, o app usa a API HTTPS oficial do Resend e reutiliza a credencial privada de `SMTP_PASSWORD`. Isso evita depender da liberação de portas SMTP na hospedagem. Para outros hosts, mantém SMTP com TLS. O transporte HTTP recusa redirecionamentos e tem tempo limite; não registra a chave. Testes locais não comprovam entrega final em uma caixa postal real.

1. Para testes sem domínio, mantenha `onboarding@resend.dev` e use somente o endereço associado à conta. Para abrir envio a atletas, entre no [Resend](https://resend.com/) e verifique um domínio em **Domains**, seguindo os registros DNS do serviço. Não houve compra ou contratação de domínio.
2. Crie uma chave de envio em **API Keys**, com o menor acesso necessário. Guarde-a no gerenciador de senhas e no painel privado da hospedagem.
3. Abra o [projeto R10 TRI no Railway](https://railway.com/project/c9cd8b46-f23b-45e2-af82-5ea9884a2981), selecione o serviço **r10tri**, na produção, e abra **Variables**.
4. Preencha as variáveis abaixo. A senha SMTP é a chave criada no Resend; não publique a chave no Git, em prints ou no chat.

| Variável | Valor |
| --- | --- |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `resend` |
| `SMTP_PASSWORD` | Sua chave privada de envio, inserida apenas no painel |
| `SMTP_FROM` | `onboarding@resend.dev` para teste restrito; endereço do domínio verificado para envio geral |

5. Aplique a configuração e aguarde a republicação. Na tela de acesso, use **Esqueci minha senha** com uma conta que você controla. Confira a mensagem recebida e a origem HTTPS do link. A API responde de forma genérica para não revelar se uma conta existe.
6. O link funciona uma única vez por 30 minutos. Depois de redefinir, a senha anterior e as sessões antigas são invalidadas. Se houver falha no envio, confira o painel do provedor; não cole logs com links, credenciais ou destinatários privados em relatórios públicos.

Enquanto essas variáveis estiverem ausentes, o login normal continua disponível e a recuperação retorna uma mensagem clara de indisponibilidade. O app não informa que enviou uma mensagem quando o transporte não está configurado.

Referências oficiais consultadas em 16/11/2026: [SMTP](https://resend.com/docs/send-with-smtp), [API de envio](https://resend.com/docs/api-reference/emails/send-email) e [restrição do domínio resend.dev](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

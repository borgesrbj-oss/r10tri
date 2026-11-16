# Ativar recuperação de senha com Resend

O fluxo foi testado com SMTP local TLS. O envio para caixas de e-mail reais depende de uma conta de envio e de um domínio verificado. O usuário escolheu criar ou conectar uma conta Resend; não há chave ou remetente fictício instalado na produção.

1. Entre no [Resend](https://resend.com/) e verifique um domínio em **Domains**. Siga os registros DNS apresentados pelo serviço. Um endereço Gmail pessoal não substitui um domínio de envio verificado.
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
| `SMTP_FROM` | Um endereço simples do domínio verificado, sem nome de exibição |

5. Aplique a configuração e aguarde a republicação. Na tela de acesso, use **Esqueci minha senha** com uma conta que você controla. Confira a mensagem recebida e a origem HTTPS do link. A API responde de forma genérica para não revelar se uma conta existe.
6. O link funciona uma única vez por 30 minutos. Depois de redefinir, a senha anterior e as sessões antigas são invalidadas. Se houver falha no envio, confira o painel do provedor; não cole logs com links, credenciais ou destinatários privados em relatórios públicos.

Enquanto essas variáveis estiverem ausentes, o login normal continua disponível e a recuperação retorna uma mensagem clara de indisponibilidade. O app não informa que enviou uma mensagem quando o transporte não está configurado.

As configurações de host, autenticação, portas e domínio exigido vêm da [documentação oficial SMTP do Resend](https://resend.com/docs/send-with-smtp).

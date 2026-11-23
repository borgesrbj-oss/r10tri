# Validação do gerador e da memória de cálculo — 23/11/2026

## Cobertura executada

| Grupo | Cobertura |
|---|---|
| Testes automatizados de regras | 193 casos: triagem, autenticação, permissões, treino por km/zona, periodização, limiares, distribuição, alertas, datas, PWA, privacidade e formatos de exportação |
| Integração HTTP geral | 32 cenários: cadastro/login, triagem persistida, geração e listagem, isolamento entre atletas, check-in, adaptação, FTP, preferências, exportações FIT/TCX/ZWO/TXT/ZIP e renderização de 12 telas do atleta |
| Integração do coach | 22 cenários: dois coaches e atletas distintos, vínculo/aceite, acesso cruzado negado, rascunho privado, brick, FTP, conflitos, publicação e preservação de realizado |
| Recuperação de senha local | 10 cenários HTTP; o GitHub Actions também executa a variante SMTP local TLS |
| Qualidade | Linter sem avisos, verificação de tipos, build, auditoria de dependências e busca de credenciais |

Os testes são executados em PostgreSQL local isolado com contas fictícias. Nenhum teste gera, substitui ou publica o plano de um atleta real.

## Casos novos específicos

- Preferência km salva na triagem, reutilizada na geração e exibida em listas, blocos, calendário e exportação.
- Sem pace necessário, falha com campo identificado; não trocar silenciosamente para minutos.
- Corrida por km preservada ao encurtar e ao editar pelo coach; referência de FTP atualizada somente em sessões futuras elegíveis.
- Base específica de corrida/ciclismo/natação; identificação de limite diário zero em conflito com modalidade marcada.
- Maratona exige dia/mês/ano e longão recente; longão padrão no fim de semana, preferência explícita respeitada.
- Longão progressivo quando há evidência de tolerância, redução na recuperação/taper e respeito aos limites; sem compensar intensidade diante de restrições.
- Tiros, ritmo e fartlek com diferenças reais nos blocos, mantendo soma das durações e recuperações.
- Minutos abaixo/no/acima do limiar por alvo efetivo; pausas passivas e força excluídas; faixa que cruza limiar classificada como indeterminada.
- Memória de cálculo salva no plano e no rascunho gerado do coach; publicação preserva autor/histórico e a base de cálculo original.

## Limites da validação

Não são testes clínicos com atletas. Não houve validação física em iPhone/Safari ou relógios Garmin, sincronização real com contas Garmin/Strava, envio real de WhatsApp ou calibração dos limiares por exames. Renderizar a tela de integração não comprova que um serviço externo esteja conectado. Os testes de e-mail usam infraestrutura local fictícia; a entrega real depende do provedor configurado.

Planos antigos continuam históricos e não recebem retroativamente referências de limiar ou dados de cálculo inventados. A melhoria é aplicada a novas gerações; alterar disponibilidade ou triagem não significa autorização para substituir um plano publicado do coach.

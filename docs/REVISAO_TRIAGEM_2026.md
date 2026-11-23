# Revisão dos campos ao gerar planos

A geração agora devolve pendências com identificador do campo, nome legível e etapa da triagem. O aviso vermelho oferece **Revisar triagem: nome do campo**. O botão abre a etapa do atleta ou a ficha esportiva do coach, rola até o controle e coloca o foco nele. A navegação não salva nem gera um plano automaticamente.

Campos obrigatórios ausentes e erros de validação ao salvar mantêm o campo identificado. Quando a disponibilidade não permite nenhuma sessão, o aviso indica horas, dias e limites diários para revisão, sem presumir qual limite o usuário deseja alterar. Erros de conexão, opções de geração e conflitos de publicação mantêm suas mensagens próprias.

A avaliação permanece aberta durante a geração: uma falha não descarta as respostas locais. Na ficha do coach, modalidade e experiência vazias aparecem como seleções pendentes, sem valores presumidos.

Validação: 180 testes automatizados; 22 cenários de integração da área do coach com contas fictícias; tipos, linter e compilação. Conferência visual em navegador Chromium com largura de celular: falta de nascimento na geração do coach e do atleta, abertura da etapa correta, foco em birthDate e destaque vermelho. Safari/iPhone físico não verificados nesta alteração.

Nenhuma migração ou mudança nos treinos publicados/realizados.

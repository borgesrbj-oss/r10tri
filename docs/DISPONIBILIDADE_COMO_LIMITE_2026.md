# Horário como restrição, não como prescrição

A disponibilidade estava misturada ao orçamento de carga: o gerador podia preencher o tempo livre e redistribuir minutos quando um dia tinha limite. Agora são duas etapas independentes:

1. Prescrever a carga por modalidade a partir do volume recente, objetivo, fase, experiência, longão recente, restrições e feedback de recuperação.
2. Aplicar os limites opcionais da agenda, por sessão, dia agregado e semana. Um corte não aumenta outro dia e não modifica a base histórica usada para propor as semanas seguintes. Limites de segurança por experiência e os critérios de revisão continuam ativos.

A interface da triagem, da agenda e do coach usa opções de duração como **45 min** e **1 h 30 min**. Vazio significa **Sem limite de horário informado**. O teto semanal deixa de ser obrigatório. Dias sem possibilidade de treino devem ser desmarcados; um limite zero existente permanece identificado como sem tempo naquele dia.

O relatório distingue a prescrição inicial pelo histórico do limite de horário opcional. Se uma sessão precisar ser encurtada, sua descrição mostra os minutos prescritos e os minutos após o ajuste. Há aviso para revisão do encaixe. Não se preenche o restante da disponibilidade por obrigação nem se transfere a sobra para outras sessões.

Exemplo de comportamento verificado: manter a mesma base, objetivo, fase e dias, alterando o limite de 10 h para 20 h ou deixando-o vazio, gera a mesma prescrição quando nenhum teto limita o plano. Se uma terça de 40 min recebe teto de 30 min, os 10 min cortados não são adicionados à quarta ou ao longão.

Validação: 197 testes automatizados, incluindo invariância às horas livres nas quatro modalidades e aplicação isolada de limites. Integração HTTP também verifica geração sem teto semanal. Nenhuma migração e nenhum recálculo automático de planos já publicados.

A página de configuração também foi unificada: havia dois formulários que editavam a mesma disponibilidade com salvamentos independentes. Agora dias, limites e preferências são enviados juntos por **Salvar configuração**, preservando os dados esportivos já informados. A conferência visual em Chromium com largura de 390 px validou o teto semanal vazio, terça com 45 min e preservação do longão/base de corrida em conta fictícia.

# Validação dos vídeos de natação

Em 27/11/2026, os dez arquivos de vídeo, as dez páginas de origem e as duas páginas de licença responderam com HTTP 200. Os créditos e as licenças vieram das páginas de origem e dos metadados do Wikimedia Commons. O catálogo exibe a página original, a autoria, a licença e uma descrição em português do que observar. O Gotri associa os dois primeiros vídeos aos treinos com bloco de respiração e alinhamento.

A amostra editorial incluiu todos os dez vídeos. As observações abaixo foram confirmadas em pelo menos três quadros extraídos de cada arquivo. A reprodução em um iPhone físico não foi verificada.

| Referência | Conteúdo observado |
|---|---|
| Crawl visto de cima | Nadador em crawl, filmado da superfície. |
| Crawl visto de lado, sob a água | Alternância dos braços e posição do corpo na vista lateral subaquática. |
| Braçada de crawl — Ceci | Passagem em crawl por uma câmera subaquática posicionada na raia. |
| Alinhamento — Debbie | Aproximação e passagem em crawl pela câmera. |
| Virada — Kari | Aproximação junto à parede e saída da virada. |
| Crawl — Kari | Aproximação frontal seguida de passagem subaquática. |
| Saída de virada — Kirsten | Virada junto à parede e extensão após o impulso. |
| Crawl — Mary | Nado livre filmado na direção da raia. |
| Virada — Mary | Rotação junto à parede e saída em posição alongada. |
| Crawl rápido visto de lado | Trecho rápido de crawl em vista subaquática. |

Os dez vídeos são referências de técnica. O protocolo do teste de CSS permanece no guia escrito. Para adicionar ou substituir um vídeo, confira a correspondência com o exercício e a autorização de uso, registre a atribuição no catálogo e revise o conteúdo após a atualização. A checagem HTTP pode ser repetida com o comando abaixo, que usa o `curl` do sistema.

```bash
node --import tsx scripts/verificar-videos-natacao.ts
```

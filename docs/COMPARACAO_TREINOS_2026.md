# Comparação reproduzível de planejamentos fictícios

Referência: commit 929e690; nova versão: cópia de trabalho desta auditoria. Dados sintéticos, início 16/11/2026. A ausência de check-ins não autoriza progressão automática na versão nova. Mesma triagem e horizonte em cada comparação. Minutos são da primeira semana; intensidade é a soma em segundos de todo o ciclo comparado. Não é ensaio de eficácia clínica.

| Perfil | Antes min/semana 1 | Depois min/semana 1 | Intenso antes (s) | Intenso depois (s) | Revisão | Caminhada | Técnica |
|---|---:|---:|---:|---:|---|---|---|
| Sedentário iniciante | 72 | 72 | 0 | 0 | Não | Sim | Não |
| Primeiros 5 km | 60 | 60 | 0 | 0 | Não | Não | Não |
| Intermediário 10 km | 240 | 240 | 14940 | 13980 | Não | Não | Não |
| Meia maratona | 360 | 360 | 30240 | 28140 | Não | Não | Não |
| Maratonista experiente | 600 | 600 | 30240 | 30240 | Não | Não | Não |
| Ciclista iniciante | 60 | 60 | 0 | 0 | Não | Não | Não |
| Nadador pouco experiente | 60 | 60 | 0 | 0 | Não | Não | Sim |
| Triatleta iniciante | 180 | 180 | 6750 | 5310 | Não | Não | Sim |
| Triatleta longa distância | 600 | 600 | 37800 | 37800 | Não | Não | Não |
| Histórico de lesão no joelho | 240 | 240 | 14940 | 13980 | Não | Não | Não |
| Disponibilidade limitada | 30 | 15 | 0 | 0 | Não | Não | Não |
| Objetivo incompatível com prazo | 45 | 45 | 0 | 0 | Sim | Não | Não |

Reproduzir: `npx tsx scripts/comparar-planos.ts`. Resultados exatos também em COMPARACAO_TREINOS_2026.json. Os testes adicionais verificam limites diários somando modalidades, falta de dados, afastamento, competições próximas, FC incompatível, fadiga, faltas e edição de blocos. Resultados individuais diferem porque os perfis diferem; nenhuma melhoria de desempenho humano foi medida.

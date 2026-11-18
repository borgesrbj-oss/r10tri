# Entrega da auditoria científica e redesign — 16/11/2026

[Acessar o aplicativo](https://r10tri-production.up.railway.app/login) · [Código-fonte](https://github.com/borgesrbj-oss/r10tri)

Implementação incremental na aplicação existente. A marca permanece R10 TRI; nenhum nome novo, domínio pago ou integração sem acesso autorizado foi aplicado. Nenhuma funcionalidade foi excluída nesta rodada.

## Entregáveis

1. [Diagnóstico, correções, inventário de funções/botões, segurança, algoritmo e manutenção](RELATORIO_TECNICO_2026.md).
2. [Revisão científica: referências, datas, qualidade e decisões](AUDITORIA_CIENTIFICA_2026.md).
3. [Comparação reproduzível dos 12 perfis antes/depois](COMPARACAO_TREINOS_2026.md), com [dados completos](COMPARACAO_TREINOS_2026.json).
4. [Benchmark de dez plataformas, requisitos de integração, 20 nomes e cinco finalistas](BENCHMARK_E_MARCA_2026.md). Cadorya é recomendação criativa provisória; aprovação e pesquisa jurídica continuam necessárias.
5. [Três direções visuais e design system claro/escuro](DESIGN_SYSTEM_2026.md).
6. [Resultados e checklist de testes, com limites de cobertura](VALIDACAO_2026.md).
7. [Plano de trabalho e arquivos previstos antes das alterações](PLANO_AUDITORIA_2026.md).
8. [Recuperação por e-mail sem domínio: configuração e restrições](CONFIGURAR_EMAIL.md).

## Resumo das 14 etapas

| Etapa | Resultado |
|---|---|
| 1. Diagnóstico | Arquitetura, APIs, banco, autenticação, telas e integrações existentes inventariados; checkpoint de código e preservação aditiva. |
| 2. Pesquisa | Sínteses, estudos e consensos comparados; 80/20 tratado como política ajustável, sem alegação de superioridade universal. |
| 3. Triagem | Altura opcional, afastamento, força, minutos por dia e prioridade de prova; dados desconhecidos continuam opcionais. |
| 4. Algoritmos | Rastreado o percurso triagem → alvo → carga → fases → blocos → registros → revisão. |
| 5. Correções | Limites agregados por dia, iniciação, técnica, retorno, edição coerente, alertas de meta/prazo e prova prioritária. |
| 6. Perfis | Doze casos sintéticos e extremos com comparação real contra o commit-base; testes de regressão. |
| 7. Benchmark | Dez plataformas e formatos de exportação; integração real diferenciada de download de arquivo. |
| 8. Naming | Vinte opções, cinco finalistas, consultas preliminares e riscos; nome definitivo aguarda decisão. |
| 9. Identidade | Três direções avaliadas, Mineral escolhida, tokens e critérios documentados. |
| 10. Redesign | Login, painel e elementos compartilhados com lilás/laranja suave e tema claro/escuro. |
| 11. Navegação | Cinco destinos primários, menu secundário preservado, barra inferior móvel e acesso por teclado. |
| 12. Funções prioritárias | Próximo treino, resumo semanal, sugestão de recuperação, agenda diária/semanal/mensal e prescrição explicada. |
| 13. Testes | Suítes automatizadas, build, integração com banco isolado e revisão de telas; ver cobertura real no relatório. |
| 14. Validação | Entrega com evidências, limites, código e instruções; não equivale a validação clínica ou certificação de acessibilidade. |

## Decisões e pendências

- **Nome:** aprovação antes de troca definitiva. Consulta de domínio não libera marca, rede social ou loja de aplicativos.
- **Dispositivos:** Chrome em larguras móveis não comprova Safari/iPhone físico; executar o checklist nesses aparelhos antes de anunciar cobertura integral.
- **E-mail:** Resend sem domínio envia somente ao endereço da própria conta do provedor. O app pode funcionar sem domínio próprio; a restrição de destinatários permanece.
- **Integrações:** Strava aguarda arquivos/acesso; sincronizações Garmin/TrainingPeaks/Zwift/MyWhoosh exigem autorização/documentação. Exportação de arquivo não é sincronização automática.
- **Esporte:** regras e testes técnicos não validam resultados humanos. Força, retorno com dor, águas abertas, metas agressivas e taper individual exigem coach/profissional competente. Nenhum diagnóstico é produzido.
- **Comercialização:** definir isolamento de assessorias, governança/retenção de saúde, testes de restauração/carga e avaliação especializada de LGPD. Não há promessa de plataforma clinicamente validada ou juridicamente liberada.

## Rodar localmente

Configure PostgreSQL e `.env` privado seguindo o [README](../README.md), sem copiar credenciais para o Git:

```sh
npm ci
npm run db:migrate
npm run dev
```

Em produção: `npm run build` e `npm start`. Testes: `npm test`, `npm run lint`, `npm run typecheck` e `npm run verificar:segredos`. Nunca redefina o banco para aplicar uma atualização.

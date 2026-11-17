# API — support

Atendimento: /api/support/tickets e /api/admin/support/tickets (algumas operações propostas).

Implementar chamadas usando `http` de `@/shared/lib/http`. Consultar `docs/API-INTEGRATION.md` e o `openapi.yaml` antes de definir tipos ou payloads. Não duplicar cliente HTTP nesta feature.

## Central de dúvidas (task #14 [FRONTEND]) — `support.api.ts`

| Tela                    | Fonte                                               | Situação no openapi        |
| ----------------------- | --------------------------------------------------- | -------------------------- |
| Perguntas frequentes    | conteúdo estático em `content/faq.ts`               | sem modelo na API (P-35)   |
| Busca por palavra-chave | filtro local (`lib/help-center.ts`)                 | —                          |
| Falar com a organização | `POST /api/support/tickets` (`supportCreateTicket`) | proposta (P-06, P-09–P-11) |

### Decisões

- **FAQ estático (P-35):** o RF44 cita um canal de dúvidas, mas não há tabela. Enquanto o back-end não decidir, as 8 perguntas do Figma ficam no front, agrupadas por assunto (`FAQ_TOPICS`).
- **Busca:** ignora acentos e maiúsculas, exige todas as palavras de um termo e aceita alternativas separadas por vírgula (`convites, entregas`). Palavras no plural também encontram o singular. Os totais ("8 respostas · 2 assuntos" e "4 perguntas e respostas") acompanham o filtro.
- **Falar com a organização:** o Figma só mostra o botão. O front abre um diálogo com os campos de `SupportTicketCreate` (`title` até 150 caracteres e `description`) e envia só esses dois campos.

### Pendências com o back-end

1. **P-06** — `POST /api/support/tickets` está como `proposed`. Hoje o contrato fala em "correção cadastral"; confirmar que o mesmo chamado serve para dúvidas gerais ("Falar com a organização").
2. **P-09** — se o "tipo de solicitação" for criado, o diálogo ganha um seletor (ex.: Dúvida, Correção cadastral, Erro no sistema).
3. **P-35** — se o canal de dúvidas for modelado, trocar `content/faq.ts` por uma consulta (ex.: `GET /api/public/faq`) mantendo o mesmo formato `FaqTopic[]`.

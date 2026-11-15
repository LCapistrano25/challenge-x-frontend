# API — teams

Equipes, convites e solicitações: /api/teams, /api/me/invitations, /api/me/join-requests e /api/teacher/leadership-requests.

Implementar chamadas usando `http` de `@/shared/lib/http`. Consultar `docs/API-INTEGRATION.md` e o `openapi.yaml` antes de definir tipos ou payloads. Não duplicar cliente HTTP nesta feature.

## Encontre sua equipe (task #10) — `teams.api.ts`

| Tela                  | Chamada                                                          | Situação no openapi       |
| --------------------- | ---------------------------------------------------------------- | ------------------------- |
| Criar uma equipe      | `POST /api/teams` (`teamsCreate`)                                | confirmada (só `name`)    |
| Equipes com vagas     | `GET /api/teams?search=&page=&page_size=` (`teamsListAvailable`) | confirmada                |
| Solicitar entrada     | `POST /api/teams/{team_id}/join-requests`                        | confirmada                |
| "Solicitação enviada" | `GET /api/me/join-requests?status=PENDING`                       | confirmada                |
| Prazo e equipe atual  | `GET /api/me/dashboard`                                          | proposta (P-23)           |
| Já tem um código?     | `GET /api/teams?search=<código>` + comparação exata do código    | supõe `search` no código  |
| Cancelar solicitação  | `POST /api/join-requests/{id}/cancel`                            | **proposta — não existe** |

### Propostas para o back-end (pendentes de aprovação)

O Figma pede dados que o contrato ainda não tem. A tela já trata a ausência deles:

1. **`TeamCreate.interest_area` e `TeamCreate.description`** — área de interesse (obrigatória) e apresentação (até 300 caracteres). Hoje o schema tem `additionalProperties: false`; o front já envia os dois campos.
2. **`TeamListing.description`, `TeamListing.interest_area` e `TeamListing.leader`** (`{ name, course }`) — apresentação, área e líder no cartão. Sem `leader`, o cartão mostra "Equipe <código>".
3. **Parâmetro `interest_area` em `GET /api/teams`** — filtro "Área de interesse". Lista de valores em `lib/team-formation.ts` (`InterestArea`), a confirmar.
4. **Cancelamento da solicitação pelo aluno** — `RequestStatus` já tem `CANCELLED`, mas não há rota. Sugestão: `POST /api/join-requests/{join_request_id}/cancel`, 409 `request_not_pending` se não estiver PENDING.
5. **Busca por código** — confirmar que `search` de `GET /api/teams` também procura em `Team.code` (ou criar uma rota de consulta por código).
6. **Ordenação de `GET /api/teams`** — o Figma mostra "Mais recentes primeiro"; definir a ordenação padrão (`-created_at`).
7. **Limite de nome** — o Figma limita o nome a 60 caracteres; o `TeamCreate.name` aceita 150.

### Erros tratados (409, schema `Error`)

`formation_closed`, `team_full`, `student_already_in_team`, `join_request_pending_exists`, `team_name_taken` (mostrado no campo nome), `no_current_edition`. As mensagens ficam em `describeTeamError` (`lib/team-formation.ts`).

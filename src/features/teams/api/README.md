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

## Minha equipe (task #11 [FRONTEND]) — `my-team.api.ts`

A tela tem três visões, decididas por `StudentDashboard.is_leader` e pela presença de um `LEADER` em `Team.members`: **líder** (gerencia), **participante** (consulta e pode sair) e **sem líder** (pode solicitar a liderança). Cada ação só é renderizada para quem tem permissão; a API continua sendo a autoridade (403/409).

| Tela                     | Chamada                                                       | Situação no openapi       |
| ------------------------ | ------------------------------------------------------------- | ------------------------- |
| Equipe, papel e prazo    | `GET /api/me/dashboard`                                       | proposta (P-23)           |
| Integrantes              | `GET /api/teams/{team_id}` (`teamsGet`)                       | confirmada                |
| Convidar estudante       | `POST /api/teams/{team_id}/invitations` (`{ email }`)         | confirmada                |
| Convites enviados        | `GET /api/teams/{team_id}/invitations?status=PENDING`         | confirmada                |
| Solicitações recebidas   | `GET /api/teams/{team_id}/join-requests?status=PENDING`       | confirmada                |
| Aprovar / Recusar        | `POST /api/join-requests/{id}/respond` (`APPROVED/REJECTED`)  | confirmada                |
| Transferir liderança     | `POST /api/teams/{team_id}/leadership-transfer` (`member_id`) | confirmada                |
| Sair da equipe           | `POST /api/teams/{team_id}/leave`                             | proposta (P-25)           |
| Solicitar liderança      | `POST /api/teams/{team_id}/leadership-requests`               | confirmada                |
| Solicitação de liderança | `GET /api/teams/{team_id}/leadership-requests`                | confirmada                |
| Editar informações       | `PATCH /api/teams/{team_id}` (`name`, `description`)          | **proposta — não existe** |
| Remover integrante       | `DELETE /api/teams/{team_id}/members/{member_id}`             | **proposta — não existe** |
| Cancelar convite         | `POST /api/invitations/{invitation_id}/cancel`                | **proposta — não existe** |

### Propostas para o back-end (pendentes de aprovação)

1. **Editar equipe** — `PATCH /api/teams/{team_id}` só para o LEADER, com as regras de `TeamCreate` (409 `team_name_taken`).
2. **Remover integrante** — `DELETE /api/teams/{team_id}/members/{member_id}` só para o LEADER e durante a formação; encerra o vínculo (`left_at`, `active=false`) como a saída do RF26. Não remove o próprio líder (400).
3. **Cancelar convite** — `InvitationStatus` já tem `CANCELLED`, mas não há rota. Sugestão: `POST /api/invitations/{id}/cancel`, 409 `invitation_not_pending`.
4. **`Team.description`** — a apresentação enviada no cadastro aparece no cartão da equipe.
5. **`Team.previous_leader`** (`{ name }`) — para o aviso "Ana Maria saiu da equipe sem transferir a liderança". Sem ele, a tela usa "O líder anterior".
6. **`JoinRequest.message`** — a mensagem do aluno ("Quero contribuir com…") exibida em "Pendências".

### Regras da tela

- Convites não reservam vagas: "Vagas disponíveis" = `max_members` − integrantes ativos.
- O líder não sai sem transferir a liderança (RF27): "Sair da equipe" abre o aviso que leva a "Transferir liderança"; a API responde 409 `leader_must_transfer`.
- Remover e sair exigem confirmação (botão Danger). Fora da formação, convidar, aprovar, remover e sair ficam bloqueados.
- Depois de cada ação a equipe, as pendências e o painel são recarregados, então integrantes, vagas e pendências se atualizam.

### Logins simulados (MSW)

`academico@exemplo.com` (líder), `participante@exemplo.com` (participante) e `sem-lider@exemplo.com` (equipe sem líder), todos com a senha `123456`.

## Home do acadêmico sem equipe

Tela: Figma › 03 - Acadêmico › "Home — sem equipe" (551:11696), rota `/academico` quando
`StudentDashboard.team` é `null`.

| Seção                                   | Chamada                                         | Situação no openapi |
| --------------------------------------- | ----------------------------------------------- | ------------------- |
| Prazo de formação                       | `GET /api/me/dashboard`                         | proposta (P-23)     |
| Convites recebidos (contagem e cartões) | `GET /api/me/invitations?status=PENDING`        | confirmada (RF23)   |
| Aceitar / recusar convite               | `POST /api/invitations/{invitation_id}/respond` | confirmada (RF23)   |
| Solicitação enviada                     | `GET /api/me/join-requests?status=PENDING`      | confirmada (RF24)   |
| Cancelar solicitação                    | `POST /api/join-requests/{id}/cancel`           | **proposta**        |
| Notificações                            | `GET /api/notifications`                        | confirmada          |

### Propostas

1. **Resumo da equipe no convite** — o cartão do Figma mostra quem convidou, os cursos da equipe e as vagas
   ("Marina Rocha · Convidou você · Agronomia e tecnologia", "2 vagas"). Hoje `Invitation` só traz o `TeamRef`.
   Sugestão: incluir `invited_by` (`{ name, course }`), `team_courses` e `available_slots` na resposta de
   `GET /api/me/invitations`. Sem esses campos, o cartão mostra só o nome da equipe.
2. **`Invitation.expires_at`** — validade do convite ("Expira em 15/03"). Enquanto não existir, o front usa o fim da
   etapa `FORMATION` (convites pendentes são cancelados ao fim da formação).

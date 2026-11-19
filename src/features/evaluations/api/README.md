# API — evaluations

Avaliações: /api/teacher/projects, /api/projects/{project_id}/stages/{stage_id}/evaluation e /api/evaluator/finalists.

Implementar chamadas usando `http` de `@/shared/lib/http`. Consultar `docs/API-INTEGRATION.md` e o `openapi.yaml` antes de definir tipos ou payloads. Não duplicar cliente HTTP nesta feature.

## Avaliação de membro (task #14 [FRONTEND]) — `member-evaluation.api.ts`

Tela exclusiva do líder (`StudentDashboard.is_leader`). Lista os integrantes ativos sem o próprio líder, com a situação **Não iniciada**, **Em preenchimento** (rascunho local, ainda não enviado) ou **Enviada**, e o formulário com 4 critérios de 1 a 5 e comentário.

| Tela                          | Chamada                                         | Situação no openapi       |
| ----------------------------- | ----------------------------------------------- | ------------------------- |
| Equipe, papel e limite        | `GET /api/me/dashboard`                         | proposta (P-23)           |
| Integrantes                   | `GET /api/teams/{team_id}` (`teamsGet`)         | confirmada                |
| Enviar avaliação              | `POST /api/teams/{team_id}/member-notes` (RF33) | confirmada                |
| Situação "Enviada" e contador | `GET /api/teams/{team_id}/member-notes/summary` | **proposta — não existe** |

### Como o formulário vira o contrato atual

`MemberNoteCreate` só tem `member_id` e `content` (texto, `additionalProperties: false`). O front envia apenas esses dois campos; as notas vão no `content`, uma por linha, seguidas do comentário:

```
Comprometimento: 4/5 (Boa)
Colaboração: 5/5 (Excelente)
Comunicação: 4/5 (Boa)
Contribuição para o projeto: 4/5 (Boa)

Comentário: João participou das discussões…
```

Assim o professor lê a avaliação em `GET /api/teams/{team_id}/member-notes` (RF39) sem nenhuma mudança no back-end.

### Propostas para o back-end (pendentes de aprovação)

1. **Resumo para o líder** — `GET /api/teams/{team_id}/member-notes/summary`, só para o LEADER ativo, respondendo `[{ member_id, created_at }]` (último envio por integrante), **sem** o conteúdo (RF33). Sem essa rota, o líder não sabe quem já avaliou e o contador "X de Y avaliações enviadas" só reflete os envios da sessão. A tela mostra um aviso quando a consulta falha e continua permitindo enviar.
2. **Notas estruturadas** — se os critérios forem confirmados, incluir em `MemberNoteCreate` um campo opcional `scores: [{ criterion, value }]` (1 a 5), para relatórios sem depender do texto. Os códigos usados no front estão em `MemberCriterionId` (`COMMITMENT`, `COLLABORATION`, `COMMUNICATION`, `CONTRIBUTION`).
3. **Reenvio** — definir se o líder pode enviar uma nova observação para quem já foi avaliado. Hoje a tela trata a avaliação enviada como concluída (só leitura, sem o conteúdo).

### Regras da tela

- Os critérios e a escala são **exemplos do protótipo** (Figma: "Sobre este formulário") — confirmar com a equipe de requisitos. Ficam em `lib/member-evaluation.ts` (`MEMBER_CRITERIA`, `SCORE_LABEL`).
- "Enviar avaliação" só habilita com os 4 critérios preenchidos; o comentário é opcional.
- Depois do envio, o resumo em cache é atualizado na hora (contador e situação) e a tela segue para o próximo integrante pendente.
- Rascunhos ficam só na memória da página: trocar de integrante não perde o que foi preenchido, mas recarregar a página sim.

### Erros tratados (schema `Error`)

`403` (não é o líder), `404` (integrante fora da equipe) e `400` (validação). Mensagens em `describeMemberNoteError`.

## Notas (`/academico/notas`)

Ainda não há tela no Figma; o layout segue os cartões de "Projeto da equipe".

| Seção                                  | Chamada                            | Situação no openapi |
| -------------------------------------- | ---------------------------------- | ------------------- |
| Equipe                                 | `GET /api/me/dashboard`            | proposta (P-23)     |
| Projeto da equipe                      | `GET /api/teams/{team_id}/project` | confirmada          |
| Notas, médias por critério e pareceres | `GET /api/projects/{id}/scores`    | confirmada (RF32)   |

Regras aplicadas no front (RF32): a nota só aparece quando `status = FINALIZED`; `PENDING` e `PARTIAL` aparecem como
"Pendente" e sem valor (P-33); `deliverable_status = NOT_DELIVERED` mostra o aviso de nota zero. O resumo soma as
notas definitivas sobre o total de pontos das etapas pontuadas (a fórmula da nota final ainda está em aberto, P-30).

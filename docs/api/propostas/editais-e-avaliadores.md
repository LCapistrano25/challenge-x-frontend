# Proposta de contrato — Editais e avaliadores externos (task #24)

As telas de **Editais** e **Avaliadores externos** do protótipo (Figma › 04 - Administrador)
precisam de dados que o `docs/api/openapi.yaml` ainda não tem. O frontend já usa o contrato
abaixo, simulado no MSW (`src/mocks/handlers.ts`). Os códigos P-E e P-A são desta proposta, para
o backend avaliar e numerar em `api-pendencias.md`.

## O que já existe e é usado sem mudança

| Endpoint                                                                                                 | Uso no frontend                                        |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GET /api/admin/editions`                                                                                | Edições e situação (seletor do cabeçalho, formulários) |
| `GET /api/admin/editions/{edition_id}/stages` e `/criteria`, `GET /api/admin/stages/{stage_id}/criteria` | Checklist de publicação                                |
| `GET /api/admin/editions/{edition_id}/evaluators`                                                        | Listagem de avaliadores                                |
| `POST /api/admin/editions/{edition_id}/evaluators`                                                       | "Vincular avaliador existente"                         |
| `PATCH /api/admin/editions/{edition_id}/evaluators/{evaluator_id}` (`course_id`)                         | "Revisar vínculo" (abrangência)                        |
| `GET /api/admin/external-evaluators?search=&active=true`                                                 | Catálogo para vincular                                 |
| `GET /api/admin/teams?edition_id=`                                                                       | Equipes na atribuição                                  |
| `GET /api/admin/courses?active=true`                                                                     | Abrangência do vínculo                                 |

## Editais (RF09)

Hoje a edição guarda apenas `regulation_url`, e `POST /api/admin/editions/{edition_id}/publish`
publica a edição inteira. O protótipo pede **versões**: minuta editável, versão publicada
preservada e histórico de versões substituídas.

Schema `Regulation`:

```yaml
Regulation:
  id: integer
  edition: EditionSummary          # id, year, semester, name, status
  title: string (≤150)
  description: string (≤1000)
  version: integer                 # 1, 2, 3… por edição; definida pelo servidor
  status: DRAFT | PUBLISHED | SUPERSEDED
  file: { name: string, size_bytes: integer, url: string }
  created_at, updated_at: date-time
  published_at: date-time | null
  published_by: { id, name } | null
```

| Código | Endpoint                                                                                                    | Regras                                                                                                                                                                                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-E1   | `GET /api/admin/regulations?edition_id=&status=&search=` e `GET /api/admin/regulations/{regulation_id}`     | Lista simples (poucas versões), mais recentes primeiro.                                                                                                                                                                                                                                                                 |
| P-E2   | `POST /api/admin/editions/{edition_id}/regulations` (`multipart/form-data`: `title`, `description`, `file`) | Cria minuta na próxima versão; uma minuta em aberto por edição (`409 draft_exists`). Só PDF (assinatura `%PDF-`), até 10 MB: `415 unsupported_file_type`, `413 file_too_large`. `409 edition_closed`.                                                                                                                   |
| P-E3   | `PATCH /api/admin/regulations/{regulation_id}` (multipart; `file` opcional)                                 | Só minutas: `409 regulation_published`. Mudar um documento publicado = criar nova versão (P-E2).                                                                                                                                                                                                                        |
| P-E4   | `GET /api/admin/regulations/{regulation_id}/file`                                                           | Download autenticado do PDF (`application/pdf`).                                                                                                                                                                                                                                                                        |
| P-E5   | `POST /api/admin/regulations/{regulation_id}/publish`                                                       | Só minutas (`409 regulation_not_draft`). A versão publicada anterior da edição vira `SUPERSEDED` (o arquivo é mantido). Se a edição está em `SETUP`, aplica as validações de `/editions/{id}/publish` (cronologia, total 10,0, critérios) e publica a edição, gravando `regulation_url`; senão `409 edition_not_ready`. |

Pontos para decidir: se `/editions/{id}/publish` continua existindo ou passa a ser chamado por
P-E5; se a exigência de avaliadores com convite aceito entra nas validações de publicação (o
checklist do protótipo mostra "Avaliadores confirmados e vinculados").

## Avaliadores externos (RF11)

O protótipo trata o vínculo como **convite**: o administrador cadastra o profissional, o convite
é enviado e equipes/etapas só podem ser atribuídas depois do aceite.

Campos novos em `EditionEvaluator` (todos opcionais para não quebrar o contrato atual; sem
`invitation`, o frontend considera o vínculo aceito):

```yaml
EditionEvaluator:
  evaluator: { ..., phone: string|null, role_title: string|null }
  specialty: string | null          # área de atuação
  active: boolean                   # status do vínculo (Ativo/Inativo)
  invitation:
    status: PENDING | ACCEPTED | DECLINED
    sent_at: date-time
    responded_at: date-time | null
    sent_by: { id, name } | null
  assignments: EvaluatorAssignment[]
EvaluatorAssignment:
  id: integer
  team: { id, name }
  project: { id, title } | null
  stage: { id, name }
```

| Código | Endpoint                                                                                                                                      | Regras                                                                                                                                                                                                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P-A1   | `POST /api/admin/editions/{edition_id}/evaluator-invitations` (`name`, `email`, `phone`, `institution`, `role_title`, `specialty`, `message`) | Cria o usuário `EXTERNAL_EVALUATOR` (como `POST /api/admin/external-evaluators`), vincula à edição com `invitation.status = PENDING` e envia o e-mail com a mensagem. `409 email_taken` (o frontend orienta a vincular o existente), `409 edition_closed`. O `POST .../evaluators` atual também deve criar o convite pendente. |
| P-A2   | `POST /api/admin/editions/{edition_id}/evaluators/{evaluator_id}/invitation/resend`                                                           | Reenvia o convite (`PENDING`/`DECLINED` → `PENDING`, novo `sent_at`) ou, se aceito, reenvia as informações da participação.                                                                                                                                                                                                    |
| P-A3   | `PATCH .../evaluators/{evaluator_id}` aceita também `specialty` e `active`                                                                    | `course_id` deixa de ser obrigatório no PATCH (envio parcial).                                                                                                                                                                                                                                                                 |
| P-A4   | `PUT /api/admin/editions/{edition_id}/evaluators/{evaluator_id}/assignments` (`{items: [{team_id, stage_id}]}`)                               | Substitui as atribuições. `409 invitation_not_accepted` antes do aceite; equipe e etapa da mesma edição; etapa pontuada. Sugestão: `409 assignment_conflict` quando o avaliador tiver vínculo com a equipe.                                                                                                                    |

Falta também o lado do avaliador: aceitar ou recusar o convite (ex.:
`POST /api/evaluator/invitations/{id}/accept` e `/decline`), fora do escopo desta tela.

A lista de especialidades está fixa no frontend (`EVALUATOR_SPECIALTIES` em
`src/features/admin/lib/evaluators.ts`) até a API definir um catálogo.

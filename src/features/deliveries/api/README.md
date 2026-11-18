# API — deliveries

Entregas: /api/projects/{project_id}/stages/{stage_id}/versions (proposto; confirmar pendências antes da integração).

Implementar chamadas usando `http` de `@/shared/lib/http`. Consultar `docs/API-INTEGRATION.md` e o `openapi.yaml` antes de definir tipos ou payloads. Não duplicar cliente HTTP nesta feature.

## Enviar entrega e confirmação (task #13)

Telas: Figma › 03 - Acadêmico › "Enviar entrega" e "Entrega da etapa realizada!".
Rotas: `/academico/projeto/entrega?etapa={stage_id}` e `/academico/projeto/entrega/confirmacao?etapa={stage_id}&versao={version_id}`.

| Tela                         | Chamada                                                      | Situação no openapi   |
| ---------------------------- | ------------------------------------------------------------ | --------------------- |
| Campos, prazo e versões      | `GET /api/projects/{project_id}/deliverables`                | proposta              |
| Enviar entrega / nova versão | `POST /api/projects/{project_id}/stages/{stage_id}/versions` | proposta (P-23, P-43) |
| Confirmação e comprovante    | resposta do `POST` + cache de `…/deliverables`               | —                     |

### Corpo enviado (P-43)

`multipart/form-data` com `items` (JSON `[{field_id, file_index}]` para FILE e `[{field_id, link}]` para LINK),
`files` (na ordem de `file_index`) e `notes`. O formulário é montado a partir de `fields`
(`accepted_formats`, `max_size_mb`, `required`). O cliente envia o cabeçalho `Content-Type: multipart/form-data`
explicitamente para o axios não serializar o `FormData` como JSON.

### Validações no front (`lib/submission.ts`)

- Formato pelo `accepted_formats` do campo (ex.: "Formato não aceito. Envie um arquivo PDF ou ZIP.").
- Tamanho pelo `max_size_mb` (ex.: "O arquivo tem 24,3 MB. O limite é 20 MB.").
- Link precisa começar com `https://` e ser uma URL válida.
- Etapa em breve, aprovada ou com prazo encerrado não abre o formulário.

### Regras

- Enviar não aprova: a versão nova fica "Aguardando avaliação" até o parecer.
- Cada envio cria uma versão nova; o histórico anterior é mantido.

### Divergências e propostas

1. **Quem envia** — o contrato diz "somente o LEADER ativo"; a task #13 diz que qualquer integrante envia arquivos (só o líder edita o cadastro). O front e o mock seguem a task; o back-end precisa alterar a autorização.
2. **409 `stage_not_open`** — novo código para envio em etapa que ainda não abriu (hoje só existe `stage_deadline_closed`).

### Erros tratados

`stage_deadline_closed` e `stage_not_open` (409), `team_disqualified` e `team_incomplete` (409), 400 de validação
(mensagem no campo) e 403. Mensagens em `describeDeliveryError`.

### Mock (MSW)

| Login                            | Senha    | Papel                                 |
| -------------------------------- | -------- | ------------------------------------- |
| `lider.projeto@exemplo.com`      | `123456` | líder da equipe "Conexão Verde" (Ana) |
| `integrante.projeto@exemplo.com` | `123456` | integrante da mesma equipe (João)     |

Etapas do mock: Pesquisa (aprovada), Proposta (ajustes solicitados), Protótipo (aberta, PDF/ZIP até 20 MB + link)
e Apresentação final (em breve).

## Painel do professor (tela inicial)

Proposta de contrato (confirmar no `openapi.yaml`): `GET /api/teacher/dashboard`, só para `TEACHER`
(`403` para os demais), devolve `TeacherDashboard` (ver `../types.ts`):
`{ semester, stage_label, evaluation_deadline (AAAA-MM-DD), courses[], deliveries[] }`.
Cada entrega traz `id`, `project_name`, `team_name`, `course`, `stage`, `submitted_at` (ISO 8601) e
`status` (`PENDING_EVALUATION` | `SUBMITTED` | `EVALUATED`). A lista deve vir **já ordenada por
prioridade de avaliação**: o botão "Avaliar próximo projeto" leva à primeira pendente.
Totais, progresso e filtros são calculados no front a partir dessa lista.

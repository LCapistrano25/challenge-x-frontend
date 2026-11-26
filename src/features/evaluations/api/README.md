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

## Avaliador externo — Projetos finalistas e detalhe (task #17 [FRONTEND])

Telas: `/avaliador` (`FinalistProjectsPage`) e `/avaliador/projetos/:projectId`
(`FinalistProjectDetailPage`). O avaliador só vê os projetos atribuídos a ele: o filtro é do
back-end (abrangência do `edition_evaluator`, P-32).

| Tela                                  | Chamada                                     | Situação no openapi       |
| ------------------------------------- | ------------------------------------------- | ------------------------- |
| Lista, contadores e filtros           | `GET /api/evaluator/finalists` (RF42)       | proposta (P-29, P-32)     |
| Detalhe: sobre, integrantes, arquivos | `GET /api/evaluator/finalists/{project_id}` | **proposta — não existe** |
| Edição no título ("EDIÇÃO 2026.2")    | `GET /api/public/editions/current`          | confirmada                |

- A tela pede `page_size=100` (máximo da API) e faz busca, filtro de curso e de status na página:
  a banca é pequena e assim os contadores (atribuídos, pendentes, enviadas) refletem a banca toda.
- "Pendentes" = `PENDING` + `IN_PROGRESS`. Ordem: em preenchimento, pendentes (pelo prazo) e enviadas.
- Ação por status: `PENDING` → "Ver projeto", `IN_PROGRESS` → "Continuar" (formulário),
  `FINALIZED` → "Ver avaliação". Datas sempre no horário de Brasília.
- `409 final_form_not_published` mostra o aviso de formulário ainda não publicado.

### Propostas para o back-end (pendentes de aprovação)

1. **Campos extras em `FinalistRow`** (todos opcionais/anuláveis): `evaluation_deadline` (prazo da
   banca, coluna "Prazo / nota"), `my_total_score` e `max_total_score` (nota "86 / 100" quando
   `FINALIZED`) e `finalized_at` (data do envio, usada em "Minhas avaliações").
2. **`GET /api/evaluator/finalists/{project_id}`** → `FinalistProjectDetail`: o `FinalistRow` mais
   `code`, `description`, `objective`, `advisor`, `technologies[]`,
   `team_members[{ name, course, role, responsibility }]`,
   `materials[{ id, name, kind: FILE|LINK, url, format, size_bytes }]` e `submitted_at`. O
   `PublicProject` atual só tem título e resumo. As URLs dos arquivos seguem a P-43 (assinadas e
   com validade), e os links abrem em nova aba.

Mocks: `avaliador@exemplo.com` (6 projetos do Figma) e `avaliador.sem-banca@exemplo.com`
(estado "Sem projetos atribuídos"), senha `123456`.

## Avaliador externo — Formulário, revisão e confirmação de envio (task #18 [FRONTEND])

Tela: `/avaliador/projetos/:projectId/avaliar` (`EvaluationFormPage`), em três passos na mesma
rota: preencher → revisar e confirmar → confirmação com protocolo.

| Passo                        | Chamada                                                      | Situação no openapi |
| ---------------------------- | ------------------------------------------------------------ | ------------------- |
| Formulário e avaliação salva | `GET /api/evaluator/finalists/{project_id}/final-evaluation` | confirmada (RF43)   |
| Ao abrir a revisão           | `PUT .../final-evaluation` com `status: IN_PROGRESS`         | proposta (P-30)     |
| Confirmar e enviar           | `PUT .../final-evaluation` com `status: FINALIZED`           | proposta (P-30)     |
| Equipe e arquivos entregues  | `GET /api/evaluator/finalists/{project_id}` (task #17)       | proposta            |

### Como o formulário vira o contrato

- Cada critério é uma pergunta `SCORE` do formulário publicado: nota em `value`, **justificativa**
  (obrigatória na tela) em `answer_text` e comentário opcional em `comment` (proposta abaixo).
- Perguntas `TEXT`, se existirem, aparecem como resposta obrigatória (`answer_text`).
- **Parecer final** (mínimo de 50 caracteres) vai em `comment` da avaliação.
- **Modelo de nota (0–10 ou 0–20):** a tela não fixa a escala. Limites, referência ("0 = não
  atende · 10 = parcialmente · 20 = plenamente") e o total máximo vêm do `max_score` de cada
  pergunta. A nota aceita até duas casas decimais, como o decimal da API; se a regra final for
  "só inteiros", basta trocar `parseScore` em `lib/final-evaluation.ts`.

### Regras da tela

- "Revisar avaliação" valida tudo; com erro, mostra "Revise N campos…", marca os campos, troca o
  resumo por "Total indisponível" e fica bloqueado até a correção. Nada do que foi digitado é perdido.
- O envio exige o checkbox de confirmação; o botão fica bloqueado enquanto envia (sem duplo envio).
- Falha de conexão: a revisão continua com os dados e o botão vira "Tentar enviar novamente".
  `409 final_evaluation_already_finalized` avisa que a avaliação já foi enviada.
- Avaliação já `FINALIZED` não abre o formulário: vai direto para a consulta (somente leitura).

### Propostas para o back-end (pendentes de aprovação)

1. `FinalQuestion.description` — descrição do critério exibida no cartão.
2. `FinalAnswer.comment` / `FinalAnswerWrite.comment` — comentário opcional à equipe por critério.
3. `FinalEvaluation.protocol` — protocolo gerado no envio definitivo (tela de sucesso e consulta).
   Sem ele, a tela mostra o `id` da avaliação.

Mock: o primeiro envio definitivo do "Mapa de Acessibilidade" falha de propósito, para conferir o
estado "Revisão · Erro de envio".

## Avaliador externo — Minhas avaliações e Ver avaliação (task #19 [FRONTEND])

Telas: `/avaliador/avaliacoes` (`MyEvaluationsPage`) e `/avaliador/avaliacoes/:projectId`
(`EvaluationViewPage`), somente leitura.

| Tela                                   | Chamada                                                      | Situação no openapi |
| -------------------------------------- | ------------------------------------------------------------ | ------------------- |
| Histórico, contadores e filtros        | `GET /api/evaluator/finalists` (só `FINALIZED`)              | proposta (P-29)     |
| Notas, comentários, parecer, protocolo | `GET /api/evaluator/finalists/{project_id}/final-evaluation` | confirmada (RF43)   |
| Equipe do projeto                      | `GET /api/evaluator/finalists/{project_id}` (task #17)       | proposta            |

- O histórico usa a mesma listagem de finalistas: os contadores de enviadas e pendentes são sempre
  os mesmos da tela "Projetos finalistas". Envio e nota vêm de `finalized_at` e `my_total_score`
  (propostas da task #17). Não é preciso um endpoint novo.
- Edição: o avaliador só acessa a edição vigente (RF41); o filtro lista as edições presentes no
  histórico. Etapa: o avaliador externo só avalia a etapa final.
- A consulta não tem nenhum campo editável. Avaliação ainda não enviada não é exibida: a tela
  orienta a concluir o envio no formulário.

# API — projects

Projetos e entregas: /api/teams/{team_id}/project, /api/projects/{project_id}/deliverables e /api/projects/{project_id}/scores.

Implementar chamadas usando `http` de `@/shared/lib/http`. Consultar `docs/API-INTEGRATION.md` e o `openapi.yaml` antes de definir tipos ou payloads. Não duplicar cliente HTTP nesta feature.

## Cadastro do projeto (task #12 [FRONTEND]) — `project.api.ts`

Tela: Figma › 03 - Acadêmico › "Projeto — cadastro" (551:12196), rota `/academico/projeto/novo`.
Só o líder (`StudentDashboard.is_leader`) vê o formulário; os demais veem "Acesso restrito". O
cadastro respeita o prazo da etapa `FORMATION` e, ao concluir, a equipe vai para `/academico/projeto`.

| Tela                                | Chamada                                          | Situação no openapi       |
| ----------------------------------- | ------------------------------------------------ | ------------------------- |
| Equipe, papel e prazo               | `GET /api/me/dashboard`                          | proposta (P-23)           |
| Projeto já cadastrado? (404 = não)  | `GET /api/teams/{team_id}/project`               | confirmada                |
| Eixo temático e ODS                 | `GET /api/teams/{team_id}/project/options`       | confirmada                |
| Cadastrar projeto                   | `PUT /api/teams/{team_id}/project`               | proposta (P-25)           |
| Salvar rascunho / carregar rascunho | `PUT` / `GET /api/teams/{team_id}/project/draft` | **proposta — não existe** |

### Mapeamento Figma → contrato

| Campo no Figma                            | Campo enviado            | Situação                                                                                                              |
| ----------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Título do projeto * (até 100)             | `title`                  | contrato aceita 200; Figma limita a 100                                                                               |
| Eixo temático *                           | `category_id`            | categorias ativas da edição                                                                                           |
| Objetivo de Desenvolvimento Sustentável * | `challenge_id`           | a ODS vem do desafio (RF29); a opção mostra "ODS n · título" e, se dois desafios têm a mesma ODS, o título do desafio |
| Resumo da proposta * (até 1.000)          | `summary`                | confirmado (sem limite no contrato)                                                                                   |
| Objetivo geral *                          | `objective`              | confirmado (opcional no contrato)                                                                                     |
| Problema identificado *                   | `problem`                | **proposta**                                                                                                          |
| Metodologia e plano de desenvolvimento *  | `methodology`            | **proposta**                                                                                                          |
| Público beneficiado *                     | `target_audience`        | **proposta**                                                                                                          |
| Local de aplicação *                      | `location`               | **proposta**                                                                                                          |
| Docente orientadora (opcional)            | `advisor_name`           | **proposta**                                                                                                          |
| E-mail da orientadora                     | `advisor_email`          | **proposta**                                                                                                          |
| Link de referência (opcional)             | `reference_url`          | **proposta**                                                                                                          |
| Declaração de aceite                      | — (validada só no front) | avaliar se o back-end deve registrar o aceite                                                                         |

### Propostas para o back-end (pendentes de aprovação)

1. **Campos descritivos em `ProjectWrite` e `Project`** — os sete campos marcados como proposta acima. Hoje `ProjectWrite` tem `additionalProperties: false`; o front já envia os campos.
2. **Rascunho** — `PUT /api/teams/{team_id}/project/draft` (somente o LEADER, durante a formação) guarda o preenchimento sem validar obrigatórios e devolve `saved_at`; `GET` devolve o rascunho ou 404. Ao cadastrar (`PUT …/project`), o rascunho é descartado. Atende ao critério "o rascunho não conclui a inscrição". Alternativa: a P-25 resolvida (título/resumo em branco até o RF30) permitiria gravar o rascunho no próprio `project` com um campo `registered_at`.
3. **Limites** — confirmar 100 caracteres para `title` e 1.000 para `summary` (fixados no Figma). O front também limita `problem`, `objective` e `methodology` a 1.000 caracteres (sem definição no Figma; mesmo limite do resumo).
4. **`GET /api/teams/{team_id}/project` antes do cadastro** — confirmar que responde 404 enquanto não houver projeto (o front trata 404 como "ainda não cadastrado").

### Erros tratados

`formation_closed` (409, bloqueia o formulário), `project_title_taken` (409, no campo título), `challenge_not_eligible` (400, no campo ODS), `category_not_available` (400, no campo eixo) e 403. Mensagens em `describeProjectError` (`lib/project-registration.ts`).

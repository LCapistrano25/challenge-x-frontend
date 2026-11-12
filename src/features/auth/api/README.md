# API — auth

Autenticação: sessões Microsoft/senha e conclusão de perfis. Confira as pendências de sessão no docs/API-INTEGRATION.md.

Implementar chamadas usando `http` de `@/shared/lib/http`. Consultar `docs/API-INTEGRATION.md` e o `openapi.yaml` antes de definir tipos ou payloads. Não duplicar cliente HTTP nesta feature.

## Primeiro acesso (aluno e professor via Microsoft)

Quem entra pela Microsoft pela primeira vez precisa preencher dados complementares **uma única vez**.
O front trata `User.profileComplete === false` como "cadastro pendente": toda área do perfil
redireciona para `/cadastro`, e quem já concluiu é mandado de volta para a home do perfil.
Os contratos abaixo são **propostas** para alinhar com o back-end (conferir no `openapi.yaml`).

| Endpoint                            | Uso                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `GET /auth/me` e `POST /auth/login` | Devem incluir `profileComplete` (`false` até concluir). Campo ausente = completo. |
| `GET /courses`                      | Lista `[{ id, name }]` para os selects de curso.                                  |
| `POST /auth/complete-profile`       | Conclui o cadastro e devolve o `User` atualizado com `profileComplete: true`.     |

Corpo do aluno: `{ role: 'STUDENT', courseId, registration, period, acceptedTerms: true }`.
Corpo do professor: `{ role: 'TEACHER', courseIds: string[], acceptedTerms: true }`.

Respostas esperadas: `401` sem sessão, `409` cadastro já concluído, `422` dados inválidos
(ex.: matrícula já usada). Se vier `message` no corpo do erro, o front a exibe ao usuário.

Pontos a confirmar: formato da matrícula (hoje 6 a 15 dígitos, em `profile-validation.ts`),
quantidade de períodos (hoje 1º a 10º) e onde registrar data/versão do aceite dos termos
(sugestão: o back-end grava no momento do `POST`).

### Regras de acesso

- **Aluno e professor** entram **somente** pela Microsoft. `POST /auth/login` deve responder `403`
  para esses perfis (o front também derruba a sessão se isso falhar).
- **Avaliador externo** (conta criada pelo admin) e **admin** entram por e-mail e senha.
- Fluxo Microsoft: o botão navega para `GET {API}/auth/microsoft/login?returnTo=...` (página
  inteira). O back-end valida a conta, abre a sessão (cookie) e redireciona ao front. Em caso de
  falha, redirecionar para `/login?error=<código>`; o front entende `microsoft_denied` e
  `account_not_allowed` (qualquer outro código mostra uma mensagem genérica).

### Testando sem back-end (MSW)

Com `VITE_ENABLE_MOCKS=true` e `npm run dev`, em `/login` clique em **Entrar com a Microsoft**.
Em vez da tela da Microsoft, aparece um seletor de contas simuladas:

| Conta simulada              | Resultado                                        |
| --------------------------- | ------------------------------------------------ |
| Aluno — primeiro acesso     | vai para `/cadastro` (Curso, Matrícula, Período) |
| Professor — primeiro acesso | vai para `/cadastro` (seleção de cursos)         |
| Aluno — já cadastrado       | vai direto para `/academico`                     |
| Professor — já cadastrado   | vai direto para `/professor`                     |

A sessão e os cadastros do mock ficam em memória: recarregar a página zera tudo. O seletor só
existe em desenvolvimento com mocks ligados; em produção o botão redireciona para o back-end.
Avaliador externo e admin entram pelo formulário (`avaliador@exemplo.com` e `admin@exemplo.com`,
senha `123456`).

# Como contribuir

## Fluxo de branches

```
feat/NN-descricao  ──PR──▶  dev  ──PR──▶  main
```

- `main`: produção. Só recebe PR vindo da `dev`, após validação.
- `dev`: integração. Recebe os PRs das features.
- Toda branch de trabalho nasce da `dev` atualizada, com o número da task: `feat/12-cadastro-projeto`, `fix/31-erro-login`.
- Mantenha a branch atualizada com a `dev` antes de abrir o PR (`git fetch origin && git rebase origin/dev`) e resolva os conflitos localmente.
- Merge de feature para `dev`: **squash**. De `dev` para `main`: **merge commit**, para manter o histórico da release.
- As duas branches, `dev` e `main`, devem ter proteção exigindo os checks do CI e ao menos 1 aprovação.

## Como abrir um PR

1. Faça commits pequenos, no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
2. Rode localmente o mesmo que o CI roda (próxima seção) antes do push.
3. Abra o PR para a `dev` usando o template, referenciando a task (`Closes #12`).
4. O CI precisa passar e é necessária ao menos 1 aprovação.

## Antes do commit

O Husky roda ESLint e Prettier nos arquivos alterados (`lint-staged`). Para rodar tudo manualmente:

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

## Convenções

- Componentes e páginas: `PascalCase.tsx`. Hooks: `useAlgo.ts`. Demais arquivos: `kebab-case` ou `camelCase`, mantendo o padrão da pasta.
- Uma feature exporta o que é público em `index.ts`. Veja as regras de fronteira no `README`.
- Lógica de negócio e transformação de dados fora dos componentes (funções puras e hooks), para facilitar os testes.
- Chamadas HTTP só nos `api/` das features, usando o cliente de `shared/lib/http.ts`.
- Textos da interface em português, com frases curtas, no tom de quem usa o sistema.

## Substituindo uma tela provisória

As telas criadas com `PagePlaceholder` indicam a task no texto ("task #12"). Ao implementar, troque o placeholder pelo conteúdo real e adicione os testes.

## Integração com a API

- Consulte `docs/API-INTEGRATION.md` e `docs/api/openapi.yaml` antes de criar chamadas HTTP.
- Coloque chamadas por domínio em `src/features/<feature>/api/` e reutilize `src/shared/lib/http.ts`.
- Não invente endpoints nem copie payloads de mocks como se fossem contrato aprovado.
- Operações `proposed` precisam de confirmação do Back-end antes de dependerem delas.
- Use os enums técnicos de perfil da API (`STUDENT`, `TEACHER`, `EXTERNAL_EVALUATOR`, `ADMIN`); traduza apenas os rótulos exibidos na interface.

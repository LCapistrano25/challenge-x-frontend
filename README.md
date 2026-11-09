# Front-end

SPA em **React + TypeScript**, construída com **Vite**. O back-end é um repositório separado e será integrado por HTTP; enquanto isso, a API é simulada com **MSW**.

## Começando

Requisitos: Node.js 22.12 ou superior (veja `.nvmrc`) e npm.

```bash
npm install
cp .env.example .env.local   # opcional: ajuste a URL da API
npm run dev
```

Com `VITE_ENABLE_MOCKS=true` (padrão em desenvolvimento), a API simulada responde. Usuários de teste (senha `123456`):

| Perfil            | E-mail                  |
| ----------------- | ----------------------- |
| Acadêmico         | `academico@exemplo.com` |
| Professor         | `professor@exemplo.com` |
| Avaliador externo | `avaliador@exemplo.com` |
| Administrador     | `admin@exemplo.com`     |

## Scripts

| Comando                 | O que faz                               |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento             |
| `npm run build`         | Typecheck + build de produção (`dist/`) |
| `npm run lint`          | ESLint (inclui as regras de fronteira)  |
| `npm run typecheck`     | TypeScript sem emitir arquivos          |
| `npm run format`        | Prettier                                |
| `npm test`              | Testes (Vitest + Testing Library)       |
| `npm run test:coverage` | Testes com cobertura                    |

## Estrutura

```
src/
├── app/            # composição: providers, rotas por perfil, layouts, guards
│   ├── router/     # mapa de rotas (code splitting por rota)
│   ├── layouts/    # PublicLayout e AppLayout (menu por perfil)
│   ├── guards/     # RequireRole: proteção de rota por perfil
│   └── pages/      # páginas que só compõem features (ex.: home do Acadêmico)
├── features/       # um diretório por domínio de negócio
│   ├── auth/  public-panel/  projects/  teams/
│   └── deliveries/  evaluations/  support/  admin/
├── shared/         # reutilizável entre features
│   ├── ui/         # componentes base / Sistema de Design
│   ├── lib/        # cliente HTTP, query client
│   └── config/     # variáveis de ambiente tipadas
├── mocks/          # API simulada (MSW)
└── test/           # setup dos testes
```

### Regras (verificadas pelo ESLint e pelo CI)

1. Dependência em um só sentido: **`app → features → shared`**.
2. Uma feature é acessada só pelo `index.ts` (`@/features/auth`), nunca por arquivos internos (`@/features/auth/pages/...`). Dentro da própria feature, use imports relativos.
3. `shared/` não importa de `features/` nem de `app/`.
4. Só vai para `shared/` o que for usado por 2 ou mais features.
5. Testes ficam ao lado do código (`Foo.tsx` / `Foo.test.tsx`).

### Anatomia de uma feature

```
features/<nome>/
├── api/          # chamadas HTTP + hooks de dados (React Query)
├── components/   # componentes internos da feature
├── pages/        # telas
├── types.ts
└── index.ts      # API pública da feature
```

Crie as subpastas só quando precisar. Um exemplo completo está em `features/auth`.

## Perfis e rotas

| Perfil            | Prefixo      | Menu/layout                  |
| ----------------- | ------------ | ---------------------------- |
| Público           | `/`          | `PublicLayout`               |
| Acadêmico         | `/academico` | `AppLayout` (área Acadêmico) |
| Professor         | `/professor` | `AppLayout`                  |
| Avaliador externo | `/avaliador` | `AppLayout`                  |
| Administrador     | `/admin`     | `AppLayout`                  |

`RequireRole` só controla a navegação. **A autorização real deve ser validada pelo back-end.**

## Variáveis de ambiente

Variáveis `VITE_*` entram no bundle público. **Nunca coloque segredos aqui.**

| Variável            | Descrição                                      |
| ------------------- | ---------------------------------------------- |
| `VITE_API_URL`      | URL base da API                                |
| `VITE_ENABLE_MOCKS` | `true` ativa o MSW (apenas em desenvolvimento) |

## CI

`.github/workflows/ci.yml` roda em todo PR e em pushes para `main` e `dev`: lint + formatação + tipos, testes com cobertura, build e auditoria de dependências. Para o CI realmente proteger a `main`, ative a proteção de branch exigindo esses checks (_Settings → Branches / Rulesets_).

## Integração com o Back-end\n\nConsulte [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md) para o mapeamento das features com a API, convenções e pendências de contrato. A cópia do contrato recebido está em [`docs/api/openapi.yaml`](docs/api/openapi.yaml). Os perfis técnicos do Front-end seguem os enums da API: `STUDENT`, `TEACHER`, `EXTERNAL_EVALUATOR` e `ADMIN`.\n\n**Atenção:** o login MSW atual é somente demonstrativo e ainda não reproduz o contrato real de autenticação. Não conecte a tela de login à API real antes de alinhar recuperação de perfil, expiração/renovação e logout com o Back-end.\n\n## Decisões de arquitetura

Em `docs/decisions/`. O passo a passo para integrar o Design System está em `docs/integracao-design-system.md`.

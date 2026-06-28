# iclass-web

Frontend da plataforma iClass — interface para gestão de turmas, tarefas e submissões.

## Tecnologias

- **[Vue 3](https://vuejs.org/)** + **[TypeScript](https://www.typescriptlang.org/)** — Composition API com `<script setup>`
- **[Vite](https://vite.dev/)** — build tool e dev server
- **[TailwindCSS v4](https://tailwindcss.com/)** — utilitários CSS via plugin Vite (sem arquivo de config)
- **[shadcn-vue](https://www.shadcn-vue.com/)** — componentes de UI (style: `new-york`, baseColor: `zinc`)
- **[Zod](https://zod.dev/)** — schemas de validação e inferência de tipos
- **[Axios](https://axios-http.com/)** — cliente HTTP com interceptors de auth
- **[Pinia](https://pinia.vuejs.org/)** — gerenciamento de estado
- **[Vue Router](https://router.vuejs.org/)** — roteamento SPA

## Pré-requisitos

- Node.js `^22.18.0 || >=24.12.0`
- pnpm >= 10
- API [`iclass-api`](../iclass-api) rodando em `http://localhost:3000`

## Setup

### 1. Instale as dependências

```bash
pnpm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API iclass-api | `http://localhost:3000` |

### 3. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `pnpm dev` | Inicia o servidor de desenvolvimento com hot reload |
| `pnpm build` | Compila para produção (type-check + build) |
| `pnpm preview` | Serve o build de produção localmente |
| `pnpm type-check` | Verifica tipos com `vue-tsc` |
| `pnpm lint` | Executa oxlint + ESLint com auto-fix |
| `pnpm format` | Formata o código com Prettier |
| `pnpm test:unit` | Roda os testes unitários com Vitest |

## Estrutura de pastas

```
src/
├── assets/              # Arquivos estáticos (imagens, fontes)
├── components/
│   └── ui/              # Componentes shadcn-vue (gerados via CLI)
├── composables/         # Composables Vue reutilizáveis
├── lib/
│   └── utils.ts         # Utilitário cn() (clsx + tailwind-merge)
├── router/
│   └── index.ts         # Definição de rotas
├── schemas/
│   └── auth.schema.ts   # Schemas Zod + tipos inferidos
├── services/
│   ├── http.ts          # Instância Axios (interceptors de auth)
│   └── auth.ts          # Service de autenticação
├── stores/              # Stores Pinia
├── styles.css           # CSS global (variáveis shadcn-vue + TailwindCSS)
├── views/               # Componentes de página (mapeados pelo router)
├── App.vue              # Componente raiz
└── main.ts              # Bootstrap da aplicação
```

## Adicionando componentes shadcn-vue

```bash
pnpm shadcn-vue add <componente>
# Exemplos:
pnpm shadcn-vue add button
pnpm shadcn-vue add input
pnpm shadcn-vue add form
```

Os componentes são gerados em `src/components/ui/` e podem ser customizados diretamente.

## Autenticação

A autenticação usa JWT com refresh automático. O service `src/services/auth.ts` expõe:

```ts
authService.login({ email, password })       // salva tokens no localStorage
authService.refresh({ refreshToken })         // renova o accessToken
authService.forgotPassword({ email })         // solicita código de reset
authService.resetPassword({ email, code, newPassword })
authService.logout()                          // limpa os tokens
```

O interceptor de resposta em `src/services/http.ts` renova o `accessToken` automaticamente ao receber `401`, sem intervenção do código de negócio.

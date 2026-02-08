# Invisibility Cloak Studio Pro

Aplicacao fullstack para efeito de "manto da invisibilidade" em tempo real no navegador, com calibracao visual avancada, diagnostico de qualidade da sessao e backend para snapshots/metricas.

## Visao geral do projeto

### Proposito
Entregar uma experiencia de visao computacional interativa para demonstracoes, estudos e validacao tecnica de pipelines de mascaramento por cor.

### Publico-alvo
- Desenvolvedores frontend/fullstack interessados em Canvas e CV no browser
- Times de P&D e educacao que precisam de prototipos visuais de alta responsividade
- Profissionais que desejam auditar sessao via API (snapshots + metricas)

### Objetivos de negocio
- Baixa latencia local para melhor experiencia do usuario
- Reprodutibilidade de calibracao com presets salvos
- Observabilidade operacional com resumo e timeline de desempenho
- Base de codigo pronta para evoluir para ambientes de producao

## Melhorias implementadas nesta versao

### Arquitetura e engenharia
- Refatoracao de contratos de API com payloads mais consistentes
- Camada de configuracao com validacao de ambiente via `zod`
- Organizacao de estado no frontend com hooks reutilizaveis (`usePersistentState`)
- Separacao de responsabilidades entre UI, servicos de API e utilitarios de dominio

### UX/UI e frontend
- Redesign completo da interface com novo design system (tokens, componentes e hierarquia visual)
- Painel de diagnostico de sessao com score de qualidade + timeline local de FPS
- Presets persistentes de calibracao (salvos em `localStorage`)
- Atalhos de teclado para operacao rapida (`B`, `S`, `U`, `P`)
- Melhorias de acessibilidade: foco visivel, labels, status com `aria-live`, contraste consistente

### Backend, seguranca e dados
- Autenticacao por API key com comparacao segura (`timingSafeEqual`)
- Validacao mais estrita para snapshots/metricas
- Rate limiting com headers de cota e `Retry-After`
- Novos recursos de API:
  - filtros por `sessionId`
  - metadados de paginacao
  - `DELETE` de snapshot
  - timeline remota de metricas
  - resumo de qualidade media

### Qualidade e testes
- Suite de testes de integracao backend atualizada cobrindo:
  - health
  - autenticacao
  - ciclo de vida de snapshot (create/list/get/delete)
  - validacao de payload invalido
  - ingestao e analiticos de metricas (summary/recent/timeline)

## Arquitetura e decisoes tecnicas

### Frontend
- `React + TypeScript + Vite`
- Processamento de imagem no `Canvas` com captura da camera via `getUserMedia`
- Calculo de score de qualidade combinando FPS e metricas visuais da cena
- Persistencia local de presets para repetibilidade operacional

### Backend
- `Fastify + TypeScript + Zod`
- Persistencia em arquivo JSON (baixo atrito para setup local)
- Endpoints versionados em `/api/v1`
- Hooks de seguranca (CORS, hardening headers, rate limiting, API key)

### Principios adotados
- `DRY`: centralizacao de utilitarios (validacao, score, cliente API)
- Separacao de responsabilidades (UI x logica x integracao)
- Contratos explicitos e validacao forte nas bordas da aplicacao

## Stack e tecnologias

- Frontend: `React 19`, `TypeScript`, `Vite`, `Canvas API`
- Backend: `Node.js`, `Fastify`, `Zod`, `TypeScript`
- Testes backend: `node:test`

## Estrutura do projeto

```txt
.
|- App.tsx
|- components/
|  |- CloakCanvas.tsx
|  |- ControlPanel.tsx
|  |- Assistant.tsx
|  |- PresetManager.tsx
|  |- PerformancePanel.tsx
|  |- ServerPanel.tsx
|- hooks/
|  |- usePersistentState.ts
|- services/
|  |- apiClient.ts
|  |- sceneAdvisor.ts
|- utils/
|  |- colorUtils.ts
|  |- sceneAnalysis.ts
|  |- qualityScore.ts
|- backend/
|  |- src/
|  |  |- app.ts
|  |  |- config.ts
|  |  |- db/
|  |  |- plugins/
|  |  |- routes/
|  |  |- tests/
```

## Instalacao e execucao

### 1) Frontend

```bash
npm install
npm run dev
```

Frontend default: `http://localhost:3000`

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend default: `http://localhost:4000`

## Scripts disponiveis

### Raiz do projeto
- `npm run dev` / `npm run dev:frontend`: inicia frontend
- `npm run dev:backend`: inicia backend
- `npm run build`: build frontend
- `npm run build:backend`: build backend
- `npm run test:backend`: testes backend

### Backend
- `npm run dev`: watch mode
- `npm run build`: compilacao TS
- `npm run start`: executa `dist`
- `npm run test`: build + testes de integracao

## Variaveis de ambiente

### Frontend (`.env`)

```env
VITE_ENABLE_API=false
VITE_API_URL=http://localhost:4000
VITE_API_KEY=change-me
```

### Backend (`backend/.env`)

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=4000
CORS_ORIGIN=http://localhost:3000
API_KEY=change-me
BODY_LIMIT=5242880
STORAGE_DIR=./storage
DATABASE_PATH=./data/app.json
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
```

## API (resumo)

### Publico
- `GET /health`
- `GET /`

### Protegido por `X-API-Key` (`/api/v1`)
- `GET /api/v1`
- `POST /api/v1/snapshots`
- `GET /api/v1/snapshots?limit=&offset=&sessionId=`
- `GET /api/v1/snapshots/:id`
- `DELETE /api/v1/snapshots/:id`
- `POST /api/v1/metrics`
- `GET /api/v1/metrics/summary?sessionId=`
- `GET /api/v1/metrics/recent?limit=&offset=&sessionId=`
- `GET /api/v1/metrics/timeline?limit=&sessionId=`

## Deploy (visao pratica)

### Frontend
- Build: `npm run build`
- Publicar pasta `dist` em CDN/static host (Vercel, Netlify, Nginx)
- Configurar `VITE_API_URL` para URL publica do backend

### Backend
- Build: `cd backend && npm run build`
- Run: `npm run start`
- Recomenda-se:
  - reverse proxy (Nginx/Caddy)
  - API key forte por ambiente
  - backup do arquivo de dados ou migracao para banco transacional

## Boas praticas aplicadas

- Validacao de entrada com `zod`
- Contratos de API previsiveis (paginacao/filtros/metadados)
- Autenticacao por API key com comparacao segura
- Rate limiting com feedback explicito por header
- Tratamento padronizado de erro com `requestId`
- UX focada em feedback imediato e operacao assistida

## Possiveis melhorias futuras

- Migrar persistencia para PostgreSQL com repositorio dedicado
- WebSocket/SSE para dashboard em tempo real multi-sessao
- Auth robusta (JWT/OAuth2 + RBAC)
- Testes automatizados de frontend (unitarios e e2e)
- Pipeline CI/CD com checks de seguranca e performance budget

Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/

# Capa da Invisibilidade

Efeito de invisibilidade em tempo real no navegador com ajustes finos de cor e mascaramento. Projeto fullstack com frontend performatico e backend opcional para armazenamento de snapshots e metricas.

## Visao Geral
O frontend processa a camera localmente via Canvas, mantendo baixa latencia e privacidade. O backend (opcional) disponibiliza uma API REST para registrar resultados e metricas de desempenho, facilitando auditoria e analise.

## Diferenciais
- Processamento local de video para privacidade e baixa latencia
- Controles visuais para calibracao precisa do efeito
- Backend modular e pronto para evolucao
- Setup simples para demonstracoes e estudos

## Arquitetura
- Frontend: loop de video no Canvas, estado em React
- Backend: API REST em Fastify com validacao e seguranca
- Persistencia: JSON em arquivo para facilitar o setup local

## Stack e Tecnologias
- Frontend: React, TypeScript, Vite, Canvas API
- Backend: Node.js, Fastify, Zod
- Testes: Node test runner (backend)

## Estrutura do Projeto
- `App.tsx`: orquestracao do frontend
- `components/`: UI e controles
- `services/`: regras de negocio e integracao com API
- `utils/`: conversoes de cor e analise de cena
- `backend/src/app.ts`: composicao do servidor
- `backend/src/routes/`: endpoints REST
- `backend/src/plugins/`: seguranca e middlewares
- `backend/src/db/`: persistencia em arquivo
- `backend/src/tests/`: testes automatizados

## Instalacao e Execucao
Frontend:
- `npm install`
- `npm run dev`

Backend (opcional):
- `cd backend`
- `npm install`
- `cp .env.example .env`
- `npm run dev`

## Variaveis de Ambiente
Frontend (`.env`):
- `VITE_ENABLE_API=false`
- `VITE_API_URL=http://localhost:4000`
- `VITE_API_KEY=change-me`

Backend (`backend/.env`):
- `HOST=0.0.0.0`
- `PORT=4000`
- `CORS_ORIGIN=http://localhost:3000`
- `API_KEY=change-me`
- `STORAGE_DIR=./storage`
- `DATABASE_PATH=./data/app.json`

## API (Resumo)
- `GET /health`
- `POST /api/v1/snapshots`
- `GET /api/v1/snapshots`
- `GET /api/v1/snapshots/:id`
- `POST /api/v1/metrics`
- `GET /api/v1/metrics/summary`
- `GET /api/v1/metrics/recent`

## Testes
Backend:
- `cd backend`
- `npm run test`

## Boas Praticas Aplicadas
- Validacao de dados com Zod
- Autenticacao via API key
- Rate limiting por IP
- CORS configuravel por ambiente
- Processamento local de video
- Design system com tokens e foco em acessibilidade

## Roadmap
- Persistencia em PostgreSQL para alta escala
- Exportacao de video e streaming
- Dashboard em tempo real com WebSockets
- Autenticacao OAuth2 e RBAC

## Autoria
Matheus Siqueira

Portfolio: www.matheussiqueira.dev

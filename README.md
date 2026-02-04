# Web Invisibility Cloak

## Visao Geral
Sistema fullstack que simula o efeito de manto da invisibilidade no navegador. O frontend processa a camera em tempo real e permite ajustes finos de matiz e mascaramento. O backend opcional armazena snapshots e metricas de performance para auditoria e analise.

## Objetivo e Publico-Alvo
- Criadores, estudantes e equipes que precisam demonstrar efeitos de visao computacional com baixa latencia.
- Times que desejam registrar resultados e metricas sem depender de servicos externos.

## Arquitetura e Decisoes Tecnicas
- Frontend: processamento local em Canvas, sem servidores para o loop de video.
- Backend: API REST modular em Fastify com autenticacao por API key.
- Persistencia: armazenamento JSON em arquivo para facilitar setup local e facilitar migracao futura.
- Observabilidade: endpoints de metricas e logs estruturados.

## Stack e Tecnologias
- Frontend: React, TypeScript, Vite, Canvas API, CSS com tokens de design
- Backend: Node.js, Fastify, Zod, armazenamento JSON
- Testes: Node test runner (backend)

## Estrutura do Projeto
- `App.tsx`: orquestracao do frontend, estado e integracoes
- `components/`: UI e controles do efeito
- `services/`: regras de negocio e integracao com API
- `utils/`: conversoes de cor e analise de cena
- `backend/src/app.ts`: composicao do servidor
- `backend/src/routes/`: endpoints REST
- `backend/src/plugins/`: seguranca e middlewares
- `backend/src/db/`: persistencia em arquivo
- `backend/src/tests/`: testes automatizados

## Setup e Execucao
Frontend:
- `npm install`
- `npm run dev`

Backend:
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
- Processamento local de video para privacidade
- Design system com tokens e foco em acessibilidade

## Possiveis Melhorias Futuras
- Persistencia em PostgreSQL para alta escala
- Exportacao de video e streaming
- Dashboard em tempo real com WebSockets
- Autenticacao OAuth2 e RBAC

Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/

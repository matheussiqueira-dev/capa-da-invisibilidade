# Web Invisibility Cloak

## Visao Geral
Aplicacao web que cria o efeito de manto da invisibilidade usando a camera do navegador. O processamento de imagem acontece no frontend, enquanto o backend opcional fornece persistencia de snapshots, metricas e observabilidade.

## Visao Geral do Backend
API REST modular para registrar snapshots do efeito, armazenar metricas de sessao e oferecer endpoints de consulta com foco em seguranca, desempenho e manutencao.

## Arquitetura Adotada
Monolito modular em Fastify, com camadas de rotas, plugins de seguranca, validacao e persistencia em arquivo JSON (facil de migrar para banco relacional).

## Tecnologias Utilizadas
- Backend: Node.js, Fastify, Zod, armazenamento JSON
- Frontend: React, TypeScript, Vite, Canvas API

## Setup e Execucao
Frontend:
- `npm install`
- `npm run dev`

Backend:
- `cd backend`
- `npm install`
- `cp .env.example .env`
- `npm run dev`

## Estrutura do Projeto
- `App.tsx`: Layout e estado principal do frontend
- `components/`: UI e controle do efeito
- `utils/`: Conversoes de cor e analise de cena
- `backend/src/app.ts`: Composicao do servidor
- `backend/src/routes/`: Endpoints REST
- `backend/src/plugins/`: Seguranca, auth e rate limit
- `backend/src/db/`: Inicializacao SQLite

## Boas Praticas e Padroes
- Validacao de payload com Zod
- Autenticacao via API key
- CORS controlado por ambiente
- Rate limiting in-memory por IP
- Erros padronizados e logs estruturados

## Endpoints Principais
- `GET /health`
- `POST /api/v1/snapshots`
- `GET /api/v1/snapshots`
- `GET /api/v1/snapshots/:id`
- `POST /api/v1/metrics`
- `GET /api/v1/metrics/summary`
- `GET /api/v1/metrics/recent`

## Melhorias Futuras
- Exportacao de video e streaming de snapshots
- Persistencia em PostgreSQL para alta escala
- Dashboard de metricas em tempo real
- Autenticacao OAuth2 e RBAC

Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/

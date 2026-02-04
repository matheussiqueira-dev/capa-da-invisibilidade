# Web Invisibility Cloak

## Visao Geral
Aplicacao web que simula o efeito de manto da invisibilidade em tempo real usando a camera do navegador. O recorte e a troca de pixels ocorrem localmente no Canvas, sem servidores externos, garantindo baixa latencia e privacidade.

## Tecnologias Utilizadas
- React
- TypeScript
- Vite
- HTML5 Canvas API
- CSS moderno com variaveis e tipografia customizada

## Funcionalidades Principais
- Captura de fundo em tempo real para efeito de substituicao de pixels
- Ajuste preciso de matiz, saturacao e brilho
- Suavizacao de bordas para reduzir artefatos
- Captura de cor diretamente na tela
- Presets de cores e recomendacao automatica de contraste
- Snapshot instantaneo do efeito atual

## Instalacao e Uso
1. Instale as dependencias:
   `npm install`
2. Inicie o ambiente de desenvolvimento:
   `npm run dev`
3. Acesse o endereco exibido pelo Vite (ex: http://localhost:3000)

## Estrutura do Projeto
- `App.tsx`: Layout principal e orquestracao de estado
- `components/CloakCanvas.tsx`: Camera, processamento de frames e efeito do manto
- `components/ControlPanel.tsx`: Controles e acoes rapidas
- `components/Assistant.tsx`: Insights de cena e recomendacoes
- `services/sceneAdvisor.ts`: Regras de recomendacao e diagnostico
- `utils/colorUtils.ts`: Conversoes de cor e matching
- `utils/sceneAnalysis.ts`: Analise estatistica do fundo
- `styles.css`: Sistema visual e tokens de estilo

## Boas Praticas Aplicadas
- Processamento totalmente local para privacidade e performance
- Configuracao centralizada com tipos fortes
- Separacao clara entre UI, regras de negocio e utilitarios
- Acessibilidade com foco visivel e textos objetivos
- Controles desacoplados do loop de video para manter FPS estavel

## Possiveis Melhorias Futuras
- Exportacao de video curto em GIF ou MP4
- Auto ajuste dinamico da tolerancia com base em iluminacao
- Suporte a multiplas zonas de cor simultaneamente
- Modo de calibracao guiada com checklist visual

Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/

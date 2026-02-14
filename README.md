
<img src="https://res.cloudinary.com/limpeja/image/upload/v1770993671/swap_1_mvctri.png" alt="swap Logo" width="280">

## Swap buy and sell instans Cripto or Pix ↔ BRL com UX Instantânea
## Visão Executiva
Swappy financial é uma stack de on/off-ramp focada em “Sell” (usuário envia cripto, recebe PIX). Mantemos um backend enxuto (Express) endurecido e preparado para evoluir com workers e filas: API pública para criação/consulta de ordens, worker on-chain para detectar depósitos e worker PIX para liquidar payouts. Tudo validado com schema de ambiente, limites configuráveis e cache de preço.

## Capabilidades Principais
- **Fluxo Sell seguro**: status inicial `aguardando_deposito`, cotação travada com TTL, validação de endereço (BTC/ETH) e limites min/max configuráveis.
- **Validação robusta**: Zod em payloads e schema de ambiente; CORS restrito, rate limit e Helmet habilitados.
- **Cotações com cache**: worker de preço com TTL curto (CoinGecko).
- **Filas / eventos (stub)**: event bus em memória já publica `order.created` → `onchain.detected` → `payout.settled`, pronto para migrar para SQS/PubSub/Kafka.
- **Persistência preparada**: PostgreSQL com tabelas `orders`, `order_events`, `payouts` (schema incluso), fallback in-memory apenas para demo.
- **Workers stubs**: on-chain, payout e price-cache prontos para plugar lógica real.
- **Hardening inicial**: Helmet, rate limit geral e por rota de criação, CORS restrito, logger Pino; endpoints de depósito/payout com auditoria em DB.

## Arquitetura de Alto Nível
- **Frontend**: HTML/CSS/JS (Vite ou servidor estático).
- **Backend (monolito + workers)**:
  - API Express: cria/consulta ordens, trava cotação, valida inputs.
  - Worker on-chain (stub): consumirá fila, validará depósitos e confirmações.
  - Worker PIX (stub): consumirá payout.requested e chamará provedor PIX.
  - Worker price-cache: cacheia preço em memória (TTL curto).
- **Banco**: PostgreSQL (orders/eventos/payouts) + Redis/filas (a integrar) para cache/locks.
- **Segurança**: Helmet, rate limit configurável, CORS por domínio, webhook com segredo opcional, schema de env obrigatório.

## Como Rodar (Dev/Homologação)
1) Instale dependências  
   ```bash
   npm install
   ```
2) Configure `.env` a partir de `.env.example` (use RPC de testnet e chave sem fundos).
3) Inicialize o schema no Postgres (ajuste `DATABASE_URL`):  
   ```bash
   psql "$DATABASE_URL" -f server/schema.sql
   ```
4) Suba backend  
   ```bash
   node server/server.js
   ```
5) Suba frontend  
   - via Vite: `npm run dev`  
   - ou servidor estático: `npx http-server .` (ou Live Server do VS Code).

Frontend acessa `http://localhost:3000/api/price` por padrão; defina `window.API_BASE` no console se usar outra origem.

## Configuração (.env)
```
RPC_URL=...              # RPC da rede (use sepolia/goerli para testes)
HOT_WALLET_KEY=...       # Chave privada da hot wallet (NÃO usar fundos reais)
TOKEN_ADDRESS=...        # Contrato ERC-20 (ex.: WBTC em testnet)
TOKEN_DECIMALS=8         # Decimais do token (WBTC=8)
ALLOWED_ORIGINS=*        # Whitelist CORS (use domínios em produção)
WEBHOOK_SECRET=...       # Segredo para confirmar pagamentos
DATABASE_URL=postgres://user:pass@host:5432/db
ORDER_MIN_BRL=10
ORDER_MAX_BRL=100000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

## Fluxos de Usuário
- **Buy (BRL → Cripto)**  
  1) Usuário informa valor em BRL.  
  2) Seleciona método de pagamento (PIX/cartão).  
  3) Informa endereço cripto (ETH ou BTC).  
  4) Recebe ordem + QR/PIX; polling até `concluída`.

- **Sell (Cripto → BRL via PIX)**  
  1) Usuário informa valor em BTC/USDT (campo Pay).  
  2) Informa CPF e Chave PIX.  
  3) Etapa final exibe endereço de recebimento; após depósito confirmado (worker on-chain), backend liquida via PIX (worker payout) e marca `concluída`.

## Endpoints REST
- `GET /api/price` — retorna preço BTC em BRL (CoinGecko).
- `POST /api/order` — cria ordem `{ amountBRL, address, paymentMethod, pixCpf?, pixPhone? }` com trava de cotação e status `aguardando_deposito`.
- `GET /api/order/:id` — status da ordem.
- `POST /api/order/:id/confirm` — webhook/confirmador (requer `x-webhook-secret` se definido).

## Notas de Segurança (para produção)
- Usar KMS/HSM ou custodial para a chave; hot wallet exposta não é aceitável em prod.
- Restringir CORS, habilitar WAF e rate limiting; auth HMAC/JWT em webhooks internos.
- Confirmar apenas após valor ≥ esperado e confirmações on-chain configuráveis; decimais por ativo/rede.
- Segredos em Vault/Secrets Manager; TLS end-to-end; logs estruturados e métricas.

## Roadmap Sugerido
- Conectar fila gerenciada (SQS/PubSub/Kafka) e Redis para cache/locks.
- Worker on-chain real (BTC/ETH/USDT) e integração PIX oficial com webhooks assinados.
- SSE/WebSocket para status (substituir polling).
- Painel operacional + alertas (saldo hot wallet, divergência, filas).
- Testes unit/integration + E2E em testnet (depósito → confirmações → payout sandbox).

## Time-to-Value
- Em modo demo (testnet) a jornada completa roda em minutos.
- Em produção, basta plugar provedor PIX e monitor on-chain para ter um on/off-ramp auditável.

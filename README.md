# NexSwap — On/Off-Ramp Cripto ↔ BRL com UX Instantânea

## Visão Executiva
NexSwap é uma stack de on/off-ramp pensada para operação enterprise no mercado brasileiro. O frontend entrega uma experiência de compra/venda “instant swap”, enquanto o backend integra cotação, geração de ordens e liquidação via PIX e tokens on-chain. O projeto está pronto para prova de conceito em testnet e foi isolado para evitar exposição de chaves em produção.

## Capabilidades Principais
- **Swap Buy/Sell**: fluxo dual BRL ↔ BTC/USDT com UI única; modo Sell coleta dados PIX e instrui depósito on-chain.
- **Cotações em tempo real**: CoinGecko com fallback direto no frontend.
- **Orquestração de ordens**: criação de ordem, travamento de cotação e status polling.
- **PIX-first**: pagamentos direcionados a PIX, com placeholders para integração de provedor.
- **Autoconfirmação opcional**: modo demo para homologação (`AUTO_CONFIRM_MS`).

## Arquitetura de Alto Nível
- **Frontend**: HTML/CSS/JS (Vite para dev, mas roda estático), componente único de swap com steps.
- **Backend**: Node.js + Express + ethers. API REST simples; entrega tokens ERC-20 a partir de hot wallet (testnet recomendada).
- **Integradores externos**: CoinGecko para preço. Espaço reservado para provedor PIX e monitoramento on-chain.

## Como Rodar (Dev/Homologação)
1) Instale dependências  
   ```bash
   npm install
   ```
2) Configure `.env` a partir de `.env.example` (use RPC de testnet e chave sem fundos).
3) Suba backend  
   ```bash
   node server/server.js
   ```
4) Suba frontend  
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
AUTO_CONFIRM_MS=8000     # Opcional: confirmar e enviar tokens automaticamente (homologação)
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
  3) Etapa final exibe endereço de recebimento da operação; após depósito confirmado, backend liquida via PIX (placeholder) e marca `concluída`.

## Endpoints REST
- `GET /api/price` — retorna preço BTC em BRL (CoinGecko).
- `POST /api/order` — cria ordem `{ amountBRL, amountBTC, address, paymentMethod, pixCpf?, pixPhone? }`.
- `GET /api/order/:id` — status da ordem.
- `POST /api/order/:id/confirm` — webhook/confirmador (requer `x-webhook-secret` se definido).

## Notas de Segurança (para produção)
- Remover `AUTO_CONFIRM_MS`; usar webhook real de provedor PIX e monitor on-chain.
- Manter chaves e RPC apenas em `.env`; usar cofres (AWS/GCP/Azure Vault).
- Restringir CORS (`ALLOWED_ORIGINS`) e aplicar rate limiting/auth.
- Corrigir decimais conforme o token alvo; preferir testnet até completar auditoria.

## Roadmap Sugerido
- Integração PIX oficial (Gerencianet/StarkBank) com callback assinado.
- Monitoramento on-chain para depósitos (BTC/USDT) e reconciliação automática.
- Múltiplos pares (ETH, USDT ERC20/TRC20) com validação de endereço por chain.
- Painel operacional para risco e reconciliação.
- Testes automatizados: conversão, validação de endereços, cálculo de fee/slippage.

## Time-to-Value
- Em modo demo (AUTO_CONFIRM + testnet) a jornada completa roda em minutos.
- Em produção, basta plugar provedor PIX e monitor on-chain para ter um on/off-ramp básico e auditável.

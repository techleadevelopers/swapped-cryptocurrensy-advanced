💱 NexSwap — Swap Real com PIX & Entrega Instantânea de Tokens ERC-20

📌 Visão Geral
NexSwap é uma aplicação de swap de reais (BRL) para criptomoedas utilizando PIX como meio de pagamento, com entrega automática de tokens ERC-20 diretamente na carteira do usuário. O projeto já opera com WBTC na Ethereum Mainnet, realizando transferências reais por meio de uma hot wallet integrada ao sistema.

🚀 Funcionalidades
✅ Conversão de BRL para Bitcoin usando cotação em tempo real da CoinGecko.
✅ Emissão de ordens via PIX com QR Code.
✅ Monitoramento e simulação de pagamento via webhook interno.
✅ Entrega de WBTC automaticamente após confirmação.
✅ Backend com Express.js + ethers.js.
✅ Frontend Vite + HTML/CSS moderno e funcional.

🛠️ Tecnologias Utilizadas
Frontend: HTML5, CSS3
Backend: Node.js, Express.js
Blockchain: Ethereum Mainnet via Infura
Token: WBTC (ERC-20)
API de Preço: CoinGecko
Outros: UUID, Axios, ethers.js

📁 Estrutura do Projeto
bash
Copiar
Editar
nexswap/
│
├── index.html         # Interface web (cliente)
├── style.css          # Estilo da página
├── server.js          # Servidor Node.js com lógica de swap
├── images/
│   └── qrcode.png     # QR Code estático do PIX (simulado)
└── README.md          # (Você está aqui)

⚙️ Como Funciona
Usuário informa o valor em BRL e endereço de carteira.
Sistema calcula quanto de BTC será entregue usando a cotação atual.
Gera uma ordem com chave PIX e QR Code.
Simula pagamento após 10 segundos.
Envia automaticamente o WBTC para a carteira fornecida.

💻 Instalação e Execução

1. Clone o repositório

git clone https://github.com/seuusuario/nexswap.git
cd nexswap

2. Instale as dependências

npm install

3. Execute o servidor

node server.js
Servidor disponível em: http://localhost:3000

🔐 Segurança
⚠️ ATENÇÃO: Este projeto utiliza uma hot wallet real com chave privada exposta no código. Para ambientes de produção:
Nunca versionar ou deixar exposta a privateKey.
Utilize .env para variáveis sensíveis.
Implemente autenticação e segurança de rede.

Substitua o QR Code e webhook por integrações reais com um provedor de PIX (ex: Gerencianet, StarkBank, etc).

📡 API Endpoints
GET /api/price
Retorna o preço atual do Bitcoin em BRL.

{ "brl": 352000 }
POST /api/order
Cria uma nova ordem com base no valor em BRL e endereço da carteira.

Requisição:

json
Copiar
Editar
{
  "amountBRL": 100,
  "address": "0x123...abc"
}
{
  "orderId": "uuid",
  "btcAmount": 0.00028,
  "status": "aguardando_pagamento",
  "pixKey": "chavepix@nexswap.com",
  "qrCodeUrl": "/images/qrcode.png"
}
GET /api/order/:id
Retorna os dados e status da ordem.

🔄 Webhook Simulado
O sistema simula o pagamento após 10 segundos de criação da ordem. Uma vez "paga", o backend envia o token automaticamente via contrato ERC-20.

🪙 Parâmetros do Token
Token: WBTC
Rede: Ethereum Mainnet
Precisão: 18 casas decimais
Você pode substituir esse contrato por qualquer outro token ERC-20 na Ethereum (ou outro chain, com ajustes no provider).

📸 Interface

A interface web é simples e direta, permitindo:
Inserção do valor em reais
Endereço da carteira
Geração e exibição do QR Code
Atualização do status da ordem em tempo real

📦 Futuras Melhorias

Integração real com provedor de PIX via webhook
Suporte a múltiplos tokens (USDT, ETH, etc)
Painel administrativo para gestão de ordens
Dashboard do usuário com histórico de swaps
Integração com corretoras para hedge automático
Autenticação por JWT e KYC opcional

🧠 Conceito
Este projeto tem como objetivo ser um gateway simples e rápido de entrada para cripto via moeda local, priorizando UX e automação.

Ideal para integrar em:
Marketplaces cripto
Plataformas P2P
ATMs de cripto
Aplicações DeFi que queiram entrada/saída em reais

👨‍💻 Desenvolvido por Techleadevelopers
Equipe NexSwap
Contato: dev@nexswap.com
quivo README.md para você baixar?
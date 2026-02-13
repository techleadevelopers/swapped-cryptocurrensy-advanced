import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { ethers, Wallet, Contract, JsonRpcProvider, parseUnits } from 'ethers';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Simulando banco de dados em memória
const orders = {};

// --- Configuração segura via .env ---
const {
  RPC_URL,
  HOT_WALLET_KEY,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS = '8', // WBTC usa 8 casas
  ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000',
  WEBHOOK_SECRET = '',
  AUTO_CONFIRM_MS = '0' // modo demo: confirma sozinho depois de X ms
} = process.env;

if (!RPC_URL || !HOT_WALLET_KEY || !TOKEN_ADDRESS) {
  throw new Error('Faltam variáveis de ambiente: defina RPC_URL, HOT_WALLET_KEY e TOKEN_ADDRESS no .env');
}

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(HOT_WALLET_KEY, provider);

const tokenAbi = ['function transfer(address to, uint256 amount) public returns (bool)'];
const tokenContract = new Contract(TOKEN_ADDRESS, tokenAbi, wallet);

// CORS restrito (lista separada por vírgula no .env)
const allowed = ALLOWED_ORIGINS === '*'
  ? ['*']
  : ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (allowed.includes('*')) return cb(null, true);
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed'));
  }
}));

// Endpoint para obter a taxa de câmbio atual do Bitcoin
app.get('/api/price', async (_req, res) => {
  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=brl,usd'
    );
    res.json({ brl: data.bitcoin.brl });
  } catch (err) {
    res.status(500).json({ error: 'API error' });
  }
});

// Criar uma nova ordem de compra com PIX
app.post('/api/order', async (req, res) => {
  const { amountBRL, address } = req.body;
  if (!amountBRL || !address) {
    return res.status(400).json({ error: 'Parâmetros ausentes' });
  }

  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=brl,usd'
  );
  const btcRate = data.bitcoin.brl;
  const btcAmount = amountBRL / btcRate;
  const id = uuidv4();

  const order = {
    id,
    status: 'aguardando_pagamento',
    amountBRL,
    btcAmount,
    address,
    rateLocked: btcRate,
    createdAt: new Date(),
    pixKey: 'chavepix@nexswap.com',
    qrCodeUrl: '/images/qrcode.png',
  };

  orders[id] = order;

  res.json({
    orderId: id,
    btcAmount,
    rate: btcRate,
    status: order.status,
    pixKey: order.pixKey,
    qrCodeUrl: order.qrCodeUrl
  });
});

// Consultar status da ordem
app.get('/api/order/:id', (req, res) => {
  const order = orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'Ordem não encontrada' });
  res.json(order);
});

// Simulador de confirmação do pagamento (como se fosse um webhook do PIX)
// Agora exige um header de autenticação simples para evitar abuso.
app.post('/api/order/:id/confirm', async (req, res) => {
  const order = orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'Ordem não encontrada' });
  if (WEBHOOK_SECRET && req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Webhook não autorizado' });
  }

  if (order.status !== 'aguardando_pagamento') {
    return res.status(400).json({ error: `Status atual não permite confirmação: ${order.status}` });
  }

  order.status = 'pago';

  try {
    const amountToSend = parseUnits(order.btcAmount.toFixed(8), Number(TOKEN_DECIMALS));
    const tx = await tokenContract.transfer(order.address, amountToSend);
    await tx.wait();

    order.status = 'concluída';
    order.txHash = tx.hash;
    console.log(`Token enviado para ${order.address}, txHash: ${tx.hash}`);
  } catch (err) {
    order.status = 'erro';
    order.error = err.message;
    console.error('Erro ao enviar token:', err);
  }

  res.json(order);
});

// Modo demo: confirma e envia tokens automaticamente após AUTO_CONFIRM_MS
const autoMs = Number(AUTO_CONFIRM_MS);
if (autoMs > 0) {
  setInterval(async () => {
    for (const order of Object.values(orders)) {
      if (order.status === 'aguardando_pagamento') {
        order.status = 'pago';
        try {
          const amountToSend = parseUnits(order.btcAmount.toFixed(8), Number(TOKEN_DECIMALS));
          const tx = await tokenContract.transfer(order.address, amountToSend);
          await tx.wait();
          order.status = 'concluída';
          order.txHash = tx.hash;
        } catch (err) {
          order.status = 'erro';
          order.error = err.message;
        }
      }
    }
  }, autoMs);
}

app.use('/images', express.static('images'));

app.listen(3000, () => console.log('Server on http://localhost:3000'));



import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { ethers, Wallet, Contract, JsonRpcProvider, parseUnits } from 'ethers';
import { z } from 'zod';
import { config } from './config.js';
import { publish } from './queue.js';
import { getCachedPrice } from './workers/priceWorker.js';
import { initSchema, createOrder, getOrder, updateOrderStatus } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Simulando banco de dados em memória
const ordersMemory = {}; // fallback apenas para demo

const provider = new JsonRpcProvider(config.rpcUrl);
const wallet = new Wallet(config.hotWalletKey, provider);

const tokenAbi = ['function transfer(address to, uint256 amount) public returns (bool)'];
const tokenContract = new Contract(config.tokenAddress, tokenAbi, wallet);

// CORS restrito (lista separada por vírgula no .env)
const allowed = config.allowedOrigins.includes('*')
  ? ['*']
  : config.allowedOrigins;
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
  const OrderSchema = z.object({
    amountBRL: z.number().positive(),
    address: z.string().min(1),
    paymentMethod: z.string().optional(),
    network: z.string().optional(),
  });

  const parseResult = OrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Parâmetros inválidos', details: parseResult.error.issues });
  }
  const { amountBRL, address } = parseResult.data;

  const btcRate = await getCachedPrice();
  const btcAmount = amountBRL / btcRate;
  const id = uuidv4();

  const order = {
    id,
    status: 'aguardando_deposito',
    amountBRL,
    btcAmount,
    address,
    rateLocked: btcRate,
    rateLockExpiresAt: new Date(Date.now() + config.rateLockSec * 1000),
    createdAt: new Date(),
    pixKey: 'chavepix@nexswap.com',
    qrCodeUrl: '/images/qrcode.png',
  };

  ordersMemory[id] = order;
  await createOrder(order);

  publish('order.created', order);

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
  getOrder(req.params.id)
    .then(order => {
      if (!order) return res.status(404).json({ error: 'Ordem não encontrada' });
      res.json(order);
    })
    .catch(err => {
      console.error('Erro ao buscar ordem:', err);
      res.status(500).json({ error: 'Erro ao buscar ordem' });
    });
});

// Simulador de confirmação do pagamento (como se fosse um webhook do PIX)
// Agora exige um header de autenticação simples para evitar abuso.
app.post('/api/order/:id/confirm', async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Ordem não encontrada' });
  if (config.webhookSecret && req.headers['x-webhook-secret'] !== config.webhookSecret) {
    return res.status(401).json({ error: 'Webhook não autorizado' });
  }

  if (order.status !== 'aguardando_deposito') {
    return res.status(400).json({ error: `Status atual não permite confirmação: ${order.status}` });
  }

  order.status = 'pago';

  try {
    const amountToSend = parseUnits(order.btcAmount.toFixed(8), Number(config.tokenDecimals));
    const tx = await tokenContract.transfer(order.address, amountToSend);
    await tx.wait();

    order.status = 'concluída';
    order.txHash = tx.hash;
    await updateOrderStatus(order.id, 'concluída', { txHash: tx.hash });
    console.log(`Token enviado para ${order.address}, txHash: ${tx.hash}`);
  } catch (err) {
    order.status = 'erro';
    order.error = err.message;
    await updateOrderStatus(order.id, 'erro', { error: err.message });
    console.error('Erro ao enviar token:', err);
  }

  res.json(order);
});

app.use('/images', express.static('images'));

(async () => {
  await initSchema();
  app.listen(3000, () => console.log('Server on http://localhost:3000'));
})();



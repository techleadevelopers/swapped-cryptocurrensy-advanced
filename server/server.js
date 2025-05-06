import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { ethers, Wallet, Contract, JsonRpcProvider, parseUnits } from 'ethers';

const app = express();
app.use(cors());
app.use(express.json());

// Simulando banco de dados em memória
const orders = {};

// ✅ Provider com Infura usando sua API Key (Mainnet)
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/beb24965872749b88aacb58b113bedd6');


// ✅ Hot wallet conectada ao provider (carteira real - cuidado com fundos reais)
const hotWalletPrivateKey = '0x4ca56a2834174c6cb4d5dec9e3ed10932ffab4b42d76834a9778f3a082a43250';
const wallet = new Wallet(hotWalletPrivateKey, provider);

// ✅ Contrato ERC20 real na Mainnet — substitua pelo contrato real do token
const tokenAddress = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'; // WBTC na Ethereum mainnet
const tokenAbi = [
  'function transfer(address to, uint amount) public returns (bool)'
];
const tokenContract = new Contract(tokenAddress, tokenAbi, wallet);

// Endpoint para obter a taxa de câmbio atual do Bitcoin
app.get('/api/price', async (req, res) => {
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
    createdAt: new Date(),
    pixKey: 'chavepix@nexswap.com',
    qrCodeUrl: '/images/qrcode.png',
};

  orders[id] = order;

  res.json({
    orderId: id,
    btcAmount,
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
setInterval(async () => {
  for (const order of Object.values(orders)) {
    if (order.status === 'aguardando_pagamento') {
      const elapsed = (new Date() - new Date(order.createdAt)) / 1000;
      if (elapsed > 10) {
        order.status = 'pago';

        try {
          const amountToSend = parseUnits(order.btcAmount.toFixed(6), 18); // Ajuste a precisão conforme o token
          const tx = await tokenContract.transfer(order.address, amountToSend);
          await tx.wait();

          order.status = 'concluida';
          order.txHash = tx.hash;
          console.log(`Token enviado para ${order.address}, txHash: ${tx.hash}`);
        } catch (err) {
          order.status = 'erro';
          order.error = err.message;
          console.error('Erro ao enviar token:', err);
        }
      }
    }
  }
}, 5000);

app.use('/images', express.static('images'));

app.listen(3000, () => console.log('Server on http://localhost:3000'));



import { subscribe, publish } from '../queue.js';

// Placeholder: aqui entrarão watchers on-chain reais
// Consome order.created e simula detecção de depósito
export function startOnchainWorker() {
  subscribe('order.created', (order) => {
    // Em produção: monitorar tx/endereços, validar valor e confirmações
    // Quando detectado, emitir payout.requested
    publish('onchain.detected', {
      orderId: order.id,
      txHash: 'simulated',
      amount: order.btcAmount
    });
  });
}

import { subscribe, publish } from '../queue.js';

// Placeholder: integra provedor PIX real
export function startPayoutWorker() {
  subscribe('onchain.detected', (evt) => {
    // Em produção: chamar provedor PIX, validar resposta, assinar webhook
    publish('payout.settled', {
      orderId: evt.orderId,
      pixStatus: 'simulado'
    });
  });
}

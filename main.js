const state = {
  action: 'buy',
  payAmount: 0,
  payCurrency: 'BRL',
  receiveCurrency: 'BTC',
  selectedPaymentMethod: null,
  exchangeRate: 250000,
  currentStep: 1,
  walletAddress: '',
  connected: false,
  transactionFee: 0.015,
  walletBalance: {
    BTC: 0,
    ETH: 0,
    BRL: 100000
  },
  transactionHistory: []
};

const LIQUIDITY_POOLS = {
  BTC: { reserve: 100, price: 250000 },
  ETH: { reserve: 1000, price: 15000 }
};

const steps = {
  1: 'Amount',
  2: 'Connect Wallet',
  3: 'Payment Method',
  4: 'Confirm'
};

const validateWalletAddress = (address) => {
  return address.length === 42 && address.startsWith('0x');
};

const calculateFees = (amount) => amount * state.transactionFee;

const connectWallet = async () => {
  state.connected = true;
  state.walletAddress = '0x' + Math.random().toString(16).slice(2, 12);
  return state.walletAddress;
};

const getExchangeRate = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return state.exchangeRate;
};

const executeTransaction = async () => {
  const amount = parseFloat(document.getElementById('payAmount').value);
  const fee = calculateFees(amount);
  const total = state.action === 'buy' ? amount + fee : amount - fee;
  const pool = LIQUIDITY_POOLS[state.receiveCurrency];

  if (!pool || pool.reserve < (amount / pool.price)) {
    throw new Error('Insufficient liquidity');
  }

  const slippage = amount > 10000 ? 0.01 : 0.005;
  const finalPrice = pool.price * (1 + slippage);

  if (state.action === 'buy') {
    if (state.walletBalance[state.payCurrency] < total) {
      throw new Error('Insufficient balance');
    }

    state.walletBalance[state.payCurrency] -= total;
    state.walletBalance[state.receiveCurrency] += amount / finalPrice;
    pool.reserve -= amount / finalPrice;
  } else {
    if (state.walletBalance[state.receiveCurrency] < amount) {
      throw new Error('Insufficient crypto balance');
    }

    state.walletBalance[state.receiveCurrency] -= amount;
    state.walletBalance[state.payCurrency] += total;
    pool.reserve += amount / finalPrice;
  }

  const receipt = {
    txHash: '0x' + Math.random().toString(16).slice(2),
    amount,
    fee,
    total,
    price: finalPrice,
    timestamp: Date.now(),
    status: 'completed'
  };

  state.transactionHistory.push(receipt);
  return receipt;
};

const generatePixCode = async (paymentDetails) => {
  return `PIX${paymentDetails.id}${Math.random().toString(36).substr(2, 9)}`;
};

const showPixPaymentModal = (paymentDetails) => {
  const modal = document.createElement('div');
  modal.className = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-content">
      <h3>PIX Payment</h3>
      <div class="qr-code-placeholder">${paymentDetails.pixCode}</div>
      <p>Scan or copy the PIX code</p>
      <p>Amount: ${paymentDetails.amount} ${paymentDetails.currency}</p>
      <p>ID: ${paymentDetails.id}</p>
      <div class="payment-status">Waiting for payment...</div>
    </div>
  `;
  document.body.appendChild(modal);
};

const showCardPaymentModal = (paymentDetails) => {
  const modal = document.createElement('div');
  modal.className = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-content">
      <h3>Card Payment</h3>
      <form id="cardPaymentForm">
        <input type="text" placeholder="Card Number" required>
        <input type="text" placeholder="MM/YY" required>
        <input type="text" placeholder="CVC" required>
        <button type="submit">Pay ${paymentDetails.amount} ${paymentDetails.currency}</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
};

const handlePaymentMethod = async (paymentDetails) => {
  switch (paymentDetails.method) {
    case 'pix':
      paymentDetails.pixCode = await generatePixCode(paymentDetails);
      showPixPaymentModal(paymentDetails);
      break;
    case 'card':
      showCardPaymentModal(paymentDetails);
      break;
    default:
      throw new Error('Unsupported payment method');
  }
};

const checkPaymentStatus = async (paymentId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() > 0.2 ? 'completed' : 'pending');
    }, 2000);
  });
};

const verifyPayment = async (paymentId) => {
  let attempts = 0;
  const verifyLoop = async () => {
    if (attempts >= 60) throw new Error('Timeout');
    const status = await checkPaymentStatus(paymentId);
    if (status === 'completed') {
      const tx = await executeTransaction();
      showSuccessNotification(tx);
    } else if (status === 'failed') {
      throw new Error('Payment failed');
    } else {
      attempts++;
      setTimeout(verifyLoop, 5000);
    }
  };
  await verifyLoop();
};

const showSuccessNotification = (tx) => {
  const div = document.createElement('div');
  div.className = 'transaction-notification success';
  div.innerHTML = `
    <div class="notification-content">
      <span class="check-icon">✓</span>
      <div>
        <h4>Payment Confirmed & Crypto Sent!</h4>
        <p>Hash: ${tx.txHash}</p>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 5000);
};

const processTransaction = async () => {
  document.querySelector('.loading-spinner').classList.remove('hidden');
  try {
    if (!state.walletAddress || !validateWalletAddress(state.walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const amount = parseFloat(document.getElementById('payAmount').value);
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

    if (!state.selectedPaymentMethod) throw new Error('Select payment method');

    const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const paymentDetails = {
      id: paymentId,
      amount,
      currency: state.payCurrency,
      method: state.selectedPaymentMethod.dataset.method,
      status: 'pending',
      timestamp: Date.now()
    };

    await handlePaymentMethod(paymentDetails);
    await verifyPayment(paymentId);
  } catch (err) {
    alert(err.message);
  } finally {
    document.querySelector('.loading-spinner').classList.add('hidden');
  }
};

const updateReceiveAmount = async () => {
  const payAmount = document.getElementById('payAmount').value;
  const receiveInput = document.getElementById('receiveAmount');
  if (!payAmount || isNaN(payAmount)) {
    receiveInput.value = '';
    return;
  }
  const rate = await getExchangeRate();
  receiveInput.value = (parseFloat(payAmount) / rate).toFixed(8);
};

document.addEventListener('DOMContentLoaded', () => {
  const continueBtn = document.getElementById('continueBtn');
  const step2 = document.getElementById('step2');
  
  // Initially hide the step 2 section
  step2.classList.add('hidden');

  continueBtn.addEventListener('click', () => {
      // Show the wallet address and payment method sections
      step2.classList.remove('hidden');
  });
});

  document.getElementById('payAmount').addEventListener('input', updateReceiveAmount);

  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(m => m.style.borderColor = '');
      method.style.borderColor = 'var(--primary-color)';
      state.selectedPaymentMethod = method;
    });
  });

  const updateStep = (step) => {
    state.currentStep = step;
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    document.querySelector(`.step-${step}`).classList.remove('hidden');
    document.querySelector('.steps-indicator').innerText = `Step ${step} of 4: ${steps[step]}`;
};

  document.getElementById('continueBtn').addEventListener('click', async () => {
    const payInput = document.getElementById('payAmount');
    switch (state.currentStep) {
        case 1:
            if (!payInput.value || isNaN(payInput.value)) {
                alert('Enter a valid amount');
                return;
            }
            updateStep(2);
            break;
        case 2:
            if (!state.connected) {
                const address = await connectWallet();
                document.getElementById('walletAddress').value = address; // Update the input field
            }
            updateStep(3); // Move to step 3 to show wallet input and payment methods
            break;
        case 3:
            if (!state.selectedPaymentMethod) {
                alert('Select a payment method');
                return;
            }
            updateStep(4); // Move to step 4 for transaction confirmation
            break;
        case 4:
            await processTransaction();
            updateStep(1); // Reset to step 1 after transaction
            state.selectedPaymentMethod = null;
            payInput.value = '';
            document.getElementById('receiveAmount').value = '';
            break;
    }
});

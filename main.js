
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
  }
};

const validateWalletAddress = (address) => {
  return address.length === 42 && address.startsWith('0x');
};

const calculateFees = (amount) => {
  return amount * state.transactionFee;
};

const LIQUIDITY_POOLS = {
  BTC: { reserve: 100, price: 250000 },
  ETH: { reserve: 1000, price: 15000 }
};

const executeTransaction = async () => {
  const amount = parseFloat(document.getElementById('payAmount').value);
  const fee = calculateFees(amount);
  const total = state.action === 'buy' ? amount + fee : amount - fee;
  
  // Check liquidity pool
  const pool = LIQUIDITY_POOLS[state.receiveCurrency];
  if (!pool || pool.reserve < (amount / pool.price)) {
    throw new Error('Insufficient liquidity');
  }

  // Calculate slippage
  const slippage = amount > 10000 ? 0.01 : 0.005;
  const finalPrice = pool.price * (1 + slippage);
  
  if (state.action === 'buy') {
    if (state.walletBalance[state.payCurrency] < total) {
      throw new Error('Insufficient balance');
    }
    state.walletBalance[state.payCurrency] -= total;
    state.walletBalance[state.receiveCurrency] += amount / state.exchangeRate;
  } else {
    if (state.walletBalance[state.receiveCurrency] < amount) {
      throw new Error('Insufficient crypto balance');
    }
    state.walletBalance[state.receiveCurrency] -= amount;
    state.walletBalance[state.payCurrency] += total;
  }
  
  // Process transaction through liquidity pool
  if (state.action === 'buy') {
    // Update pool reserves
    pool.reserve -= (amount / finalPrice);
    
    // Generate transaction receipt
    const receipt = {
      txHash: '0x' + Math.random().toString(16).slice(2),
      amount,
      fee,
      total,
      price: finalPrice,
      timestamp: Date.now(),
      status: 'completed'
    };

    // Store transaction in history
    if (!state.transactionHistory) {
      state.transactionHistory = [];
    }
    state.transactionHistory.push(receipt);

    return receipt;
  } else {
    // Handle sell logic
    pool.reserve += (amount / finalPrice);
    return {
      txHash: '0x' + Math.random().toString(16).slice(2),
      amount,
      fee,
      total,
      price: finalPrice,
      timestamp: Date.now(),
      status: 'completed'
    };
  }
};

const getWalletBalance = async (address) => {
  if (!validateWalletAddress(address)) {
    throw new Error('Invalid wallet address');
  }
  return state.walletBalance;
};

const updateLiquidityPool = async (currency, amount, action) => {
  const pool = LIQUIDITY_POOLS[currency];
  if (action === 'add') {
    pool.reserve += amount;
  } else {
    pool.reserve -= amount;
  }
  return pool;
};

const steps = {
  1: 'Amount',
  2: 'Connect Wallet',
  3: 'Payment Method',
  4: 'Confirm'
};

// Mock wallet connection
const connectWallet = async () => {
  state.connected = true;
  state.walletAddress = '0x' + Math.random().toString(16).slice(2, 12);
  return state.walletAddress;
};

// Mock transaction processing
const processTransaction = async () => {
  const spinner = document.querySelector('.loading-spinner');
  spinner.classList.remove('hidden');
  
  try {
    // Step 1: Validate amount and wallet
    if (!state.walletAddress || !validateWalletAddress(state.walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const amount = parseFloat(document.getElementById('payAmount').value);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!state.selectedPaymentMethod) {
      throw new Error('Payment method not selected');
    }

    // Generate payment ID and details
    const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const paymentDetails = {
      id: paymentId,
      amount: amount,
      currency: state.payCurrency,
      method: state.selectedPaymentMethod.dataset.method,
      status: 'pending',
      timestamp: Date.now()
    };

    // Initialize payment based on method
    switch(paymentDetails.method) {
      case 'pix':
        // Generate PIX code
        paymentDetails.pixCode = await generatePixCode(paymentDetails);
        showPixPaymentModal(paymentDetails);
        break;
      case 'card':
        // Show card payment form
        showCardPaymentModal(paymentDetails);
        break;
      default:
        throw new Error('Unsupported payment method');
    }

    // Start payment verification loop
    let verificationAttempts = 0;
    const verifyPayment = async () => {
      if (verificationAttempts >= 60) { // 5 minutes timeout
        throw new Error('Payment verification timeout');
      }

      const paymentStatus = await checkPaymentStatus(paymentId);
      if (paymentStatus === 'completed') {
        // Execute crypto transfer
        const transaction = await executeTransaction();
    
    // Step 3: Update UI
    spinner.classList.add('hidden');
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'transaction-notification success';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="check-icon">✓</span>
        <div>
          <h4>Payment Confirmed & Crypto Transferred!</h4>
          <p>Transaction Hash: ${transaction.txHash}</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
    
    return transaction;
      } else if (paymentStatus === 'failed') {
        throw new Error('Payment failed');
      } else {
        verificationAttempts++;
        setTimeout(verifyPayment, 5000); // Check every 5 seconds
      }
    };

    // Start verification process
    await verifyPayment();
      <div class="notification-content">
        <span class="check-icon">✓</span>
        <div>
          <h4>Transaction Successful!</h4>
          <p>Hash: ${txHash}</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
    
    return { success: true, txHash, fee };
  } catch (error) {
    spinner.classList.add('hidden');
    throw error;
  }
};

// Mock API call to get exchange rate
const getExchangeRate = async (from, to) => {
  const spinner = document.querySelector('.loading-spinner');
  spinner.classList.remove('hidden');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  spinner.classList.add('hidden');
  return state.exchangeRate;
};

// Update receive amount based on pay amount
const updateReceiveAmount = async () => {
  const payAmount = document.getElementById('payAmount').value;
  const receiveAmount = document.getElementById('receiveAmount');
  
  if (!payAmount || isNaN(payAmount)) {
    receiveAmount.value = '';
    return;
  }

  const rate = await getExchangeRate(state.payCurrency, state.receiveCurrency);
  receiveAmount.value = (parseFloat(payAmount) / rate).toFixed(8);
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Toggle buy/sell buttons
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.action = btn.dataset.action;
    });
  });

  // Pay amount input handler
  const payAmount = document.getElementById('payAmount');
  payAmount.addEventListener('input', updateReceiveAmount);

  // Payment method selection
  const paymentMethods = document.querySelectorAll('.payment-method');
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.style.borderColor = '');
      method.style.borderColor = 'var(--primary-color)';
      state.selectedPaymentMethod = method;
    });
  });

  // Steps navigation
  const updateStep = (step) => {
    state.currentStep = step;
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    document.querySelector(`.step-${step}`).classList.remove('hidden');
    document.querySelector('.steps-indicator').innerHTML = `Step ${step} of 4: ${steps[step]}`;
  };

  // Continue button handler
  const continueBtn = document.getElementById('continueBtn');
  continueBtn.addEventListener('click', async () => {
    switch(state.currentStep) {
      case 1:
        if (!payAmount.value || isNaN(payAmount.value)) {
          alert('Please enter a valid amount');
          return;
        }
        updateStep(2);
        break;
      case 2:
        if (!state.connected) {
          const address = await connectWallet();
          document.getElementById('walletAddress').textContent = address;
        }
        updateStep(3);
        break;
      case 3:
        if (!state.selectedPaymentMethod) {
          alert('Please select a payment method');
          return;
        }
        updateStep(4);
        break;
      case 4:
        const result = await processTransaction();
        if (result.success) {
          alert(`Transaction successful! Hash: ${result.txHash}`);
          updateStep(1);
          state.selectedPaymentMethod = null;
          payAmount.value = '';
          document.getElementById('receiveAmount').value = '';
        }
        break;
    }
  });
});
// Payment processing helper functions
const generatePixCode = async (paymentDetails) => {
  // In production, integrate with PIX API
  return `PIX${paymentDetails.id}${Math.random().toString(36).substr(2, 9)}`;
};

const showPixPaymentModal = (paymentDetails) => {
  const modal = document.createElement('div');
  modal.className = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-content">
      <h3>PIX Payment</h3>
      <div class="qr-code-placeholder">
        ${paymentDetails.pixCode}
      </div>
      <p>Scan the QR code or copy the PIX code above</p>
      <p>Amount: ${paymentDetails.amount} ${paymentDetails.currency}</p>
      <p>Payment ID: ${paymentDetails.id}</p>
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

const checkPaymentStatus = async (paymentId) => {
  // In production, integrate with payment processor API
  // This is a mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() > 0.2 ? 'completed' : 'pending');
    }, 2000);
  });
};

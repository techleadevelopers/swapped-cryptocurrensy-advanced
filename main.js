
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

const executeTransaction = async () => {
  const amount = parseFloat(document.getElementById('payAmount').value);
  const fee = calculateFees(amount);
  const total = state.action === 'buy' ? amount + fee : amount - fee;
  
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
  
  return {
    txHash: '0x' + Math.random().toString(16).slice(2),
    amount,
    fee,
    total
  };
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

    // Step 2: Execute transaction
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


const state = {
  action: 'buy',
  payAmount: 0,
  payCurrency: 'BRL',
  receiveCurrency: 'BTC',
  selectedPaymentMethod: null,
  exchangeRate: 250000, // Mock exchange rate BRL/BTC
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

  // Continue button handler
  const continueBtn = document.getElementById('continueBtn');
  continueBtn.addEventListener('click', () => {
    if (!state.selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    if (!payAmount.value || isNaN(payAmount.value)) {
      alert('Please enter a valid amount');
      return;
    }
    alert('Transaction initiated! This is a demo.');
  });
});

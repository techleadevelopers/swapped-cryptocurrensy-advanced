// --- State Management and Core Logic (from second block, slightly adapted) ---
const state = {
  action: 'buy',
  payAmount: 0, // Will be updated from input
  payCurrency: 'BRL',
  receiveCurrency: 'BTC',
  selectedPaymentMethod: null, // Will store the DOM element
  exchangeRate: 0, // Will be fetched
  currentStep: 1,
  walletAddress: '', // Will be updated from input
  connected: false, // Simulated wallet connection state
  transactionFee: 0.015,
  walletBalance: { // Simulated balances
      BTC: 0,
      ETH: 0,
      BRL: 100000
  },
  transactionHistory: []
};

const LIQUIDITY_POOLS = { // Simulated liquidity
  BTC: { reserve: 100, price: 250000 }, // price will be updated by fetched rate
  ETH: { reserve: 1000, price: 15000 }
};

const steps = { // Step definitions
  1: 'Valor', // Amount in Portuguese
  2: 'Carteira + Pagamento', // Wallet
  3: 'Método de Pagamento', // Payment Method
  4: 'Confirmar' // Confirm
};

// Helper functions (mostly from second block)

const validateWalletAddress = (address) => {
  // Permite TRON (T...), ETH (0x...) e BTC (1/3/bc1) com checagem leve só para UX.
  if (!address) return false;
  const a = address.trim();
  if (a.startsWith('T') && a.length >= 30) return true;           // TRON base58 típica ~34
  if (a.startsWith('0x') && a.length === 42) return true;         // ETH/evm
  if ((a.startsWith('1') || a.startsWith('3') || a.startsWith('bc1')) && a.length >= 26) return true; // BTC simples
  return a.length >= 10; // fallback permissivo para não travar o fluxo
};

const calculateFees = (amount) => amount * state.transactionFee;

const connectWallet = async () => {
  // Simulate wallet connection
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation
  state.connected = true;
  // Simula um endereço TRON válido (~34 chars) para não travar a validação
  state.walletAddress = 'T' + Math.random().toString(36).slice(2, 34);
  return state.walletAddress;
};

// We will replace the internal getExchangeRate with a fetch call directly in DOMContentLoaded

const executeTransaction = async () => {
  // Simulate transaction execution
  const amountBrl = state.payAmount;
  const amountBtc = parseFloat(document.getElementById('receiveAmount').value); // Use the calculated received amount
  const fee = calculateFees(amountBrl);
  const totalBrl = amountBrl + fee; // Assuming buying, fee is added to BRL cost

  const pool = LIQUIDITY_POOLS[state.receiveCurrency];

  if (!pool || pool.reserve < amountBtc) { // Check BTC reserve
      throw new Error('Liquidez insuficiente de Bitcoin.'); // Portuguese
  }

  // Simulate slippage (simplified)
  const slippage = amountBrl > 10000 ? 0.01 : 0.005;
  const finalPrice = state.exchangeRate * (1 + slippage); // Apply slippage to the rate

  if (state.action === 'buy') {
      if (state.walletBalance[state.payCurrency] < totalBrl) {
          throw new Error('Saldo BRL insuficiente na carteira simulada.'); // Portuguese
      }

      state.walletBalance[state.payCurrency] -= totalBrl;
      state.walletBalance[state.receiveCurrency] += amountBtc; // Add the received BTC
      pool.reserve -= amountBtc; // Decrease BTC reserve
  }
  // Sell logic would be different but is not used in this flow

  const receipt = {
      txHash: '0x' + Math.random().toString(16).slice(2), // Simulate transaction hash
      amountPaid: amountBrl,
      amountReceived: amountBtc,
      fee: fee,
      totalPaid: totalBrl,
      price: finalPrice, // Price with slippage
      timestamp: Date.now(),
      status: 'completed'
  };

  state.transactionHistory.push(receipt);
  return receipt;
};

// Payment Modal/Processing Functions (from second block)

const generatePixCode = async (paymentDetails) => {
   // Simulate async PIX code generation
   await new Promise(resolve => setTimeout(resolve, 500));
   return `PIX-CODE-${paymentDetails.id}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const showPixPaymentModal = (paymentDetails) => {
  // Basic modal creation - requires CSS for styling
  const modal = document.createElement('div');
  modal.className = 'payment-modal pix-modal'; // Add a class for specific styling
  modal.innerHTML = `
      <div class="payment-modal-content">
          <h3>Pagamento via PIX</h3>
          <div class="qr-code-placeholder" style="text-align:center; padding: 20px; border: 1px solid #ccc;">${paymentDetails.pixCode}</div>
          <p>Escaneie ou copie o código PIX.</p>
          <p>Valor: ${paymentDetails.amount} ${paymentDetails.currency}</p>
          <p>ID do Pagamento: ${paymentDetails.id}</p>
          <div class="payment-status" style="margin-top: 15px; font-weight: bold;">Aguardando pagamento...</div>
           <button class="close-modal" style="margin-top: 20px;">Fechar</button>
      </div>
  `;
  document.body.appendChild(modal);

   // Close modal button
  modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove();
  });

  // In a real app, you'd start polling a backend to check payment status here
};

const showCardPaymentModal = (paymentDetails) => {
  // Basic modal creation - requires CSS for styling
  const modal = document.createElement('div');
  modal.className = 'payment-modal card-modal'; // Add a class for specific styling
  modal.innerHTML = `
      <div class="payment-modal-content">
          <h3>Pagamento com Cartão</h3>
          <form id="cardPaymentForm">
              <input type="text" placeholder="Número do Cartão" required>
              <input type="text" placeholder="MM/AA" required>
              <input type="text" placeholder="CVC" required>
              <button type="submit">Pagar ${paymentDetails.amount} ${paymentDetails.currency}</button>
          </form>
           <button class="close-modal" style="margin-top: 20px;">Fechar</button>
      </div>
  `;
  document.body.appendChild(modal);

  // Close modal button
  modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove();
  });

  // Handle form submission (simulated)
  modal.querySelector('#cardPaymentForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      // Simulate card payment processing
      const statusElement = modal.querySelector('.payment-status'); // Assuming you add a status element to the form
      // if (!statusElement) { // Add one if not present
      //      statusElement = document.createElement('div');
      //      statusElement.className = 'payment-status';
      //      modal.querySelector('.payment-modal-content').appendChild(statusElement);
      // }
      // statusElement.textContent = 'Processando...';

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

      // Simulate success or failure
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
           alert("Pagamento com cartão simulado bem-sucedido!"); // Portuguese
           modal.remove(); // Close modal on success
           // In a real app, you'd then trigger the crypto transaction execution
           // For this integration, the verifyPayment loop handles the next step.
           // We need a way for the modal's success state to signal verifyPayment.
           // A simpler approach for this simulation is to have processTransaction wait.
      } else {
           alert("Falha no pagamento com cartão simulado."); // Portuguese
           // statusElement.textContent = 'Falha';
           // Keep modal open or close based on UX
      }
  });
};

const handlePaymentMethod = async (paymentDetails) => {
  // This function now just *shows* the correct modal.
  // The verification loop is started *after* this call in processTransaction.
  switch (paymentDetails.method) {
      case 'pix':
          paymentDetails.pixCode = await generatePixCode(paymentDetails); // Generate code before showing
          showPixPaymentModal(paymentDetails);
          break;
      case 'card':
          showCardPaymentModal(paymentDetails); // Card modal handles its own simulated form submit
          break;
      default:
          throw new Error('Método de pagamento não suportado.'); // Portuguese
  }
};

const checkPaymentStatus = async (paymentId) => {
  // Simulate checking payment status
  // In a real app, this would poll a backend API
  return new Promise((resolve) => {
      setTimeout(() => {
           // Simulate status: 80% completed, 10% pending, 10% failed
          const rand = Math.random();
          if (rand < 0.8) {
              resolve('completed');
          } else if (rand < 0.9) {
              resolve('pending');
          } else {
              resolve('failed');
          }
      }, 2000); // Simulate polling delay
  });
};

const verifyPayment = async (paymentId) => {
  // This function waits for payment confirmation via checkPaymentStatus
  let attempts = 0;
  const maxAttempts = 30; // Poll for up to 60 seconds (30 * 2s)
  const pollInterval = 2000; // Poll every 2 seconds
  const statusElement = document.querySelector('.payment-modal .payment-status'); // Find the status element in the open modal

  const verifyLoop = async () => {
      if (attempts >= maxAttempts) {
          if (statusElement) statusElement.textContent = 'Pagamento expirou.'; // Portuguese
          // Need to close the modal here
          const modal = document.querySelector('.payment-modal');
          if(modal) modal.remove();
          throw new Error('Tempo limite para confirmação do pagamento excedido.'); // Portuguese
      }

      if (statusElement) statusElement.textContent = `Aguardando confirmação... Tentativa ${attempts + 1}/${maxAttempts}`; // Portuguese

      const status = await checkPaymentStatus(paymentId);

      if (status === 'completed') {
          if (statusElement) statusElement.textContent = 'Pagamento confirmado!'; // Portuguese
          // Need to close the modal here
          const modal = document.querySelector('.payment-modal');
          if(modal) modal.remove();
          console.log("Payment verified, executing transaction...");
          const tx = await executeTransaction(); // Execute crypto transaction
          showSuccessNotification(tx); // Show success message
          // Transaction completed, the processTransaction will handle the next step (resetting flow)
      } else if (status === 'failed') {
           if (statusElement) statusElement.textContent = 'Pagamento falhou.'; // Portuguese
           // Need to close the modal here
           const modal = document.querySelector('.payment-modal');
           if(modal) modal.remove();
          throw new Error('O pagamento falhou.'); // Portuguese
      } else { // 'pending'
          attempts++;
          setTimeout(verifyLoop, pollInterval); // Continue polling
      }
  };
  await verifyLoop(); // Start the loop
};


const showSuccessNotification = (tx) => {
  // Basic notification - requires CSS
  const div = document.createElement('div');
  div.className = 'transaction-notification success';
  div.innerHTML = `
      <div class="notification-content">
          <span class="check-icon">✓</span>
          <div>
              <h4>Pagamento Confirmado e Crypto Enviada!</h4>
              <p>Hash: ${tx.txHash.substring(0, 10)}...</p> </div>
      </div>
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 8000); // Show for 8 seconds
};

// Hero animations (premium title typing)
function initHeroAnimations() {
  if (typeof anime === 'undefined') return;

  const premiumTitle = document.getElementById('premiumTitle');
  if (premiumTitle) {
      const titleContent = premiumTitle.textContent.trim();
      premiumTitle.textContent = ''; // Clear to start typing

      const typeAnim = anime({
          targets: { value: 0 },
          value: titleContent.length,
          duration: 2000, // typing speed
          delay: 1000,    // start after a short pause
          endDelay: 3000, // rest 3s before repeating
          loop: true,
          easing: 'linear',
          begin: function() {
              premiumTitle.classList.remove('typing-finished');
              premiumTitle.textContent = '';
          },
          update: function(anim) {
              const charIndex = Math.floor(anim.animatables[0].target.value);
              premiumTitle.textContent = titleContent.substring(0, charIndex);
          },
          loopComplete: function() {
              premiumTitle.classList.add('typing-finished');
          }
      });

  }
}

const processTransaction = async () => {
  // This function is called when 'Continue' is clicked on Step 4
  const loadingSpinner = document.querySelector('.loading-spinner'); // Assume spinner exists

  // Basic validation again before starting
  if (!state.walletAddress || !validateWalletAddress(state.walletAddress)) {
      alert('Endereço de carteira inválido.'); // Portuguese
      return; // Stop if validation fails
  }

  if (!state.selectedPaymentMethod) {
      alert('Selecione um método de pagamento.'); // Portuguese
       return; // Stop if no method selected
  }

  // No need to validate amount here, as it was validated in Step 1

  const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const paymentDetails = {
      id: paymentId,
      amount: state.payAmount,
      currency: state.payCurrency,
      method: state.selectedPaymentMethod.dataset.method,
      status: 'pending', // Initial status
      timestamp: Date.now()
  };

  // Show loading spinner while modal is prepared/shown and payment is processed
  if (loadingSpinner) loadingSpinner.classList.remove('hidden');

  try {
      // handlePaymentMethod shows the modal for PIX or Card
      await handlePaymentMethod(paymentDetails);

      // verifyPayment starts the polling loop. It will execute executeTransaction on success.
      await verifyPayment(paymentId);

      // If verifyPayment completes without throwing an error, it means the payment was confirmed
      // and executeTransaction ran successfully.
      // The flow will be reset by the continueBtn handler after this promise resolves.

  } catch (err) {
      console.error("Erro no processamento da transação:", err);
      alert(`Erro: ${err.message}`); // Show error message
      // Close any open modal on error
      const modal = document.querySelector('.payment-modal');
      if(modal) modal.remove();
       // The continueBtn handler for step 4 should handle the reset after this catch block.
  } finally {
      // Hide spinner regardless of success or failure
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
      // The continueBtn handler for step 4 now knows this is done and will reset.
  }
};


// --- UI Management (from second block, adapted and integrated with first block's logic) ---

const updateReceiveAmount = () => {
  // Function to calculate and update receive amount based on pay amount and rate
  const payAmountInput = document.getElementById('payAmount');
  const receiveAmountInput = document.getElementById('receiveAmount');

  const brlValue = parseFloat(payAmountInput.value);

  // Only calculate if exchange rate is available and input is a valid positive number
  if (!isNaN(brlValue) && brlValue > 0 && state.exchangeRate > 0) {
      const btcValue = brlValue / state.exchangeRate;
      receiveAmountInput.value = btcValue.toFixed(8); // Use more precision for crypto
  } else {
      receiveAmountInput.value = '';
  }
};

const updateStep = (step) => {
  // Function to manage which step is visible and update indicators/buttons
  state.currentStep = step;

  // Hide all step content divs
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));

  // Show the content for the current step
  const currentStepElement = document.querySelector(`.step-${step}`);
  if (currentStepElement) {
      currentStepElement.classList.remove('hidden');
  } else {
      console.error(`Step content for step ${step} not found.`);
      // Optionally reset to step 1 or show an error state
      return;
  }


  // Update the step indicator text (assuming a div with class 'steps-indicator')
  const stepsIndicator = document.querySelector('.steps-indicator');
  if (stepsIndicator) {
      stepsIndicator.innerText = `Passo ${step} de ${Object.keys(steps).length}: ${steps[step]}`; // Portuguese
  } else {
       console.warn("Element with class 'steps-indicator' not found.");
  }

  // Update continue button text based on the step
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
      if (step === 4) {
          continueBtn.innerText = 'Processar Pagamento'; // Portuguese
      } else {
          continueBtn.innerText = 'Buy Now'; // Portuguese
      }
  }


   // Manage card header visibility - Hide it on the confirmation step (step 4)
   const cardHeader = document.querySelector('.card-header');
   if(cardHeader) {
       if (step === 4) {
           cardHeader.classList.add('hidden');
       } else {
           cardHeader.classList.remove('hidden');
       }
   }

  // Optional: Perform actions specific to entering a step
  if (step === 2) {
       // Maybe focus the wallet input or show a connect button
       const walletInput = document.getElementById('walletAddress');
       if (walletInput && !state.connected) {
            // Don't auto-connect, let the user click 'Continue' again in step 2 to connect
            // walletInput.focus();
            // Or update UI to show 'Connect Wallet' button if not connected
       }
  } else if (step === 4) {
      // Populate the confirmation details (already done in continueBtn handler, but could be here)
      const paymentAmountDisplay = document.getElementById('paymentAmount');
      const paymentMethodDisplay = document.getElementById('paymentMethod');
      const paymentWalletDisplay = document.getElementById('paymentWallet');

      if (paymentAmountDisplay) paymentAmountDisplay.textContent = `${state.payAmount} ${state.payCurrency}`;
      if (paymentMethodDisplay && state.selectedPaymentMethod) paymentMethodDisplay.textContent = state.selectedPaymentMethod.dataset.method.toUpperCase();
      if (paymentWalletDisplay) paymentWalletDisplay.textContent = state.walletAddress;
  }
};

// --- DOMContentLoaded Listener (combining setup and initial logic) ---

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = 'https://swappy-financial-backend-cripto-production.up.railway.app';
  let buySse = null;
  let currentBuyId = null;
  const PARTICLE_ICON = 'https://res.cloudinary.com/limpeja/image/upload/v1771076927/iconnn-Photoroom_wdsmis.png';

  // Get DOM element references
  const continueBtn = document.getElementById('continueBtn');
  
  const orderInfoBox = document.getElementById('orderInfoBox');
  const payAmountInput = document.getElementById('payAmount');
  const receiveAmountInput = document.getElementById('receiveAmount');
  const rateText = document.querySelector('.rate-text');
  const rateSpinner = document.querySelector('.loading-spinner');
  const paymentMethodButtons = document.querySelectorAll('.payment-method');
  const walletAddressInput = document.getElementById('walletAddress'); // destino on-chain
  const orderStatusEl = document.getElementById('orderStatus');
  const orderIdEl = document.getElementById('orderId');
  const depositAddressEl = document.getElementById('depositAddress');
  const orderErrorEl = document.getElementById('orderError');
  const pixCpfInput = document.getElementById('pixCpf');
  const pixPhoneInput = document.getElementById('pixPhone');
  const pixKeyDisplay = document.getElementById('pixKey');
  const qrCodeImg = document.getElementById('qrCodeImg');
  const statusMessage = document.getElementById('statusMessage');
  const particlesContainer = document.getElementById('particles-container');
  const premiumTitleEl = document.getElementById('premiumTitle');

  // Apply blur/shake animation to hero title text
  if (premiumTitleEl) {
    premiumTitleEl.classList.add('blur-shake');
  }

  /* Re-enable floating icon glow effect
  if (particlesContainer) {
    particlesContainer.innerHTML = ''; // reset if rerun
    const spawnParticles = (count = 18) => {
      for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        img.src = PARTICLE_ICON;
        img.className = 'particle';
        const left = Math.random() * 100;
        const xOffset = (Math.random() * 60 - 30).toFixed(1); // -30vw to +30vw drift
        const duration = (14 + Math.random() * 10).toFixed(1); // 14s – 24s
        const delay = (-Math.random() * duration).toFixed(1); // negative delays to desync
        const scale = (0.6 + Math.random() * 0.8).toFixed(2); // 0.6x – 1.4x size variance
        img.style.left = `${left}%`;
        img.style.setProperty('--x-offset', `${xOffset}vw`);
        img.style.animationDuration = `${duration}s`;
        img.style.animationDelay = `${delay}s`;
        img.style.transform = `scale(${scale})`;
        particlesContainer.appendChild(img);
      }
    };
    spawnParticles();
  }
  */

  function setOrderError(msg) {
    if (!orderErrorEl) return;
    if (msg) {
      orderErrorEl.textContent = msg;
      orderErrorEl.style.display = 'block';
    } else {
      orderErrorEl.textContent = '';
      orderErrorEl.style.display = 'none';
    }
  }

  function startBuyStream(buyId) {
    if (buySse) buySse.close();
    try {
      buySse = new EventSource(`${API_BASE}/api/buy/${buyId}/stream`);
      buySse.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (orderStatusEl) orderStatusEl.textContent = data.status || '—';
          if (statusMessage) statusMessage.textContent = `Status: ${data.status || '—'}`;
        } catch (e) { /* ignore */ }
      };
      buySse.onerror = () => buySse && buySse.close();
    } catch (e) {
      console.warn('SSE buy error', e);
    }
  }

  async function createBuyOrder() {
    setOrderError('');
    const amount = parseFloat(payAmountInput?.value || '0');
    const destAddr = walletAddressInput?.value?.trim();
    const phone = pixPhoneInput?.value?.replace(/\D/g, '') || '';
    const cpf = pixCpfInput?.value?.replace(/\D/g, '') || '';
    if (!amount || amount <= 0) return setOrderError('Informe um valor válido.');
    if (!destAddr) return setOrderError('Informe o endereço TRON de destino.');
    try {
      const resp = await fetch(`${API_BASE}/api/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountBRL: amount, asset: 'USDT', address: destAddr, pixPhone: phone, pixCpf: cpf })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data.error || (resp.status === 429 ? 'Limite diário atingido.' : 'Erro ao criar compra');
        return setOrderError(msg);
      }
      const data = await resp.json();
      currentBuyId = data.buyId;
      if (orderIdEl) orderIdEl.textContent = data.buyId || '—';
      if (orderStatusEl) orderStatusEl.textContent = data.status || 'aguardando_pix';
      if (pixKeyDisplay) pixKeyDisplay.textContent = data.pixKey || 'chavepix@nexswap.com';
      if (qrCodeImg && data.qrCodeUrl) qrCodeImg.src = data.qrCodeUrl;
      if (statusMessage) statusMessage.textContent = 'Pague o PIX para liberar o envio.';
      startBuyStream(currentBuyId);
    } catch (err) {
      console.error(err);
      setOrderError('Falha de rede ao criar compra.');
    }
  }

  // --- Initial Setup ---

  async function fetchPriceWithFallback() {
    try {
      const res = await fetch(`${API_BASE}/api/price`);
      if (!res.ok) throw new Error(`backend ${res.status}`);
      const data = await res.json();
      return data?.brl;
    } catch (e) {
      // fallback para CoinGecko se backend falhar
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl');
        const data = await res.json();
        return data?.bitcoin?.brl;
      } catch {
        throw e; // mantém o primeiro erro
      }
    }
  }

  // Fetch BTC price and update the rate text and state
  try {
    const price = await fetchPriceWithFallback();
    if (!price) throw new Error('sem preço');
    state.exchangeRate = price;
    LIQUIDITY_POOLS.BTC.price = price;
    rateText.textContent = `1 BTC ≈ ${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    console.log("BTC Rate fetched:", state.exchangeRate);
    if (rateSpinner) rateSpinner.classList.add('hidden');
  } catch (err) {
    console.error("Erro ao buscar o preço do BTC:", err);
    rateText.textContent = "Erro ao buscar a taxa 😓";
    state.exchangeRate = 0;
    LIQUIDITY_POOLS.BTC.price = 0;
    if (rateSpinner) rateSpinner.classList.add('hidden');
  }

  // Set initial step and update UI
  updateStep(state.currentStep); // Start at Step 1

  // --- Event Listeners ---

  // Listen for input on the pay amount field to update the receive amount
  if (payAmountInput) {
       payAmountInput.addEventListener('input', updateReceiveAmount);
  } else {
       console.warn("Element with id 'payAmount' not found.");
  }

  // Listen for clicks on payment method buttons
  if (paymentMethodButtons.length > 0) {
       paymentMethodButtons.forEach(btn => {
           btn.addEventListener('click', () => {
               // Remove 'selected' class from all buttons
               paymentMethodButtons.forEach(b => b.classList.remove('selected'));
               // Add 'selected' class to the clicked button
               btn.classList.add('selected');
               // Store the selected method element in state
               state.selectedPaymentMethod = btn;
               console.log("Selected payment method:", btn.dataset.method);
           });
       });
  } else {
       console.warn("Elements with class 'payment-method' not found.");
  }


  // Listen for clicks on the 'Continue' button
  if (continueBtn) {
      continueBtn.addEventListener('click', async () => {
          switch (state.currentStep) {
              case 1: // Amount Input Step
                  const payAmount = parseFloat(payAmountInput.value);
                  if (isNaN(payAmount) || payAmount <= 0) {
                      alert('Por favor, insira um valor válido.'); // Portuguese
                      return; // Stay on this step if validation fails
                  }
                  state.payAmount = payAmount; // Store validated amount in state
                  updateStep(2); // Move to Wallet Step
                  break;

              case 2: // Wallet Input/Connect Step
                  // If wallet isn't connected (simulated), connect it
                  if (!state.connected) {
                       try {
                           const address = await connectWallet(); // Simulate connection
                           walletAddressInput.value = address; // Display connected address
                           alert(`Carteira simulada conectada: ${address}`); // Notify user
                       } catch (error) {
                           console.error("Erro ao conectar carteira simulada:", error);
                           alert("Erro ao conectar a carteira."); // Portuguese
                           return; // Stay on step 2 if connection fails
                       }
                  }

                  // Now validate the wallet address displayed/entered
                  const wallet = walletAddressInput.value.trim();
                  if (!wallet || !validateWalletAddress(wallet)) {
                       alert("Por favor, insira um endereço de carteira válido."); // Portuguese
                       // state.connected = false; // Optional: reset connected state if address becomes invalid
                       return; // Stay on step 2 if validation fails
                  }
                  state.walletAddress = wallet; // Store validated address in state
                  updateStep(3); // Move to Payment Method Step
                  break;

              case 3: // Payment Method Step
                  if (!state.selectedPaymentMethod) {
                      alert('Por favor, selecione um método de pagamento.'); // Portuguese
                      return; // Stay on step 3 if no method is selected
                  }
                  // No data to store in state here, selection is already in state.selectedPaymentMethod
                  updateStep(4); // Move to Confirmation Step
                  break;

              case 4: // Confirmation and Processing Step
                  // This is where the transaction process is initiated.
                  // processTransaction includes showing modals and verification.
                  if (state.action === 'buy') {
                      await createBuyOrder();
                  } else {
                      await processTransaction();
                  }

                  // After processTransaction finishes (either succeeds, fails, or times out),
                  // we reset the state and UI back to step 1.
                  // Resetting state variables
                  state.payAmount = 0;
                  state.selectedPaymentMethod = null;
                  state.walletAddress = '';
                  state.connected = false; // Reset connection state

                  // Resetting UI elements
                  if (payAmountInput) payAmountInput.value = '';
                  if (receiveAmountInput) receiveAmountInput.value = '';
                  if (walletAddressInput) walletAddressInput.value = '';
                  // Deselect payment method buttons visually
                  paymentMethodButtons.forEach(b => {
                      b.classList.remove('selected');
                      // Also reset any custom styles like border color from the first snippet
                      b.style.borderColor = '';
                  });

                  // Move back to the first step
                  updateStep(1);
                  break;

              default:
                  console.error("Unknown step:", state.currentStep);
                  // Optionally reset to step 1
                  updateStep(1);
                  break;
          }
      });
  } else {
       console.warn("Element with id 'continueBtn' not found.");
  }

  // Optional: Add listeners for Buy/Sell toggle if it exists and controls state.action
  // Example (assuming buttons with classes 'action-buy' and 'action-sell'):
  // document.querySelectorAll('.action-toggle button').forEach(button => {
  //     button.addEventListener('click', () => {
  //          // Update state.action
  //          state.action = button.dataset.action; // Needs data-action="buy" or data-action="sell"
  //          // Update UI to show which is active
  //          document.querySelectorAll('.action-toggle button').forEach(btn => btn.classList.remove('active'));
  //          button.classList.add('active');
  //          console.log("Action set to:", state.action);
  //          // Maybe reset steps or update UI based on buy/sell
  //          // If switching action resets flow: updateStep(1);
  //     });
  // });

});

// --- Helper function for visual feedback on payment method selection (from first block) ---
// This logic is already integrated into the paymentMethodButtons click listener above,
// but you could keep a separate function if you call it from elsewhere.
// The integrated code adds/removes the 'selected' class and resets border style.

// ---------- Animated blue shader background ----------
(function initBlueShaderBackground() {
  const canvas = document.getElementById('canvas') || document.getElementById('bgShader');
  if (!canvas) return;

  const externalSource = document.getElementById('blueShaderSource');

  const gl = canvas.getContext('webgl2', { premultipliedAlpha: false });
  if (!gl) {
    canvas.style.display = 'none';
    return;
  }

  const vertexSrc = `#version 300 es
  in vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

  const fragmentSrc = externalSource ? externalSource.textContent : `#version 300 es
  precision highp float;
  out vec4 fragColor;
  uniform float uTime;
  uniform vec2 uResolution;

  vec3 palette(float t) {
    vec3 a = vec3(0.02, 0.10, 0.22);
    vec3 b = vec3(0.05, 0.30, 0.65);
    vec3 c = vec3(0.02, 0.55, 1.00);
    vec3 d = vec3(0.00, 0.25, 0.40);
    return a + b * cos(6.2831 * (c * t + d));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;

    float t = uTime * 0.15;

    float wave1 = sin(p.x * 3.5 + t) + cos(p.y * 3.0 - t * 1.3);
    float wave2 = sin(length(p) * 4.0 - t * 2.0);
    float mask = smoothstep(-1.0, 1.0, 0.6 * wave1 + 0.4 * wave2);

    vec3 col = palette(mask + 0.25 * sin(t + p.y * 2.0));

    float vignette = smoothstep(1.2, 0.4, length(p));
    col *= vignette;

    fragColor = vec4(col, 0.42);
  }`;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, vertexSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  const positionLoc = gl.getAttribLocation(program, 'position');
  const timeLoc = gl.getUniformLocation(program, 'uTime');
  const resLoc = gl.getUniformLocation(program, 'uResolution');

  const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const resize = () => {
    const dpr = Math.max(1, window.devicePixelRatio);
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    gl.viewport(0, 0, width, height);
  };

  const render = (now) => {
    gl.useProgram(program);
    gl.uniform1f(timeLoc, now * 0.001);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  };

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(render);
})();


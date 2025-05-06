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
  2: 'Carteira', // Wallet
  3: 'Método de Pagamento', // Payment Method
  4: 'Confirmar' // Confirm
};

// Helper functions (mostly from second block)

const validateWalletAddress = (address) => {
  // Basic validation - adapt as needed for actual BTC addresses
  // BTC addresses typically start with 1, 3, or bc1 and have variable lengths.
  // This check seems more suitable for Ethereum (starts with 0x, 42 chars)
  // Let's keep the original simple check or replace with a more suitable one if needed.
  // For a real app, use a library for address validation.
   return address.length > 20; // Simple check: just needs some characters
};

const calculateFees = (amount) => amount * state.transactionFee;

const connectWallet = async () => {
  // Simulate wallet connection
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation
  state.connected = true;
  state.walletAddress = 'bc1' + Math.random().toString(36).slice(2, 18); // Simulate a simple BTC-like address
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
          continueBtn.innerText = 'Continuar'; // Portuguese
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
  // Get DOM element references
  const continueBtn = document.getElementById('continueBtn');
  const payAmountInput = document.getElementById('payAmount');
  const receiveAmountInput = document.getElementById('receiveAmount');
  const rateText = document.querySelector('.rate-text');
  const paymentMethodButtons = document.querySelectorAll('.payment-method');
  const walletAddressInput = document.getElementById('walletAddress'); // Assume wallet input exists
  // Note: paymentInfoSection elements are now assumed to be inside step 4 content


  // --- Initial Setup ---

  // Fetch BTC price and update the rate text and state
  try {
      const res = await fetch("http://localhost:3000/api/price");
      if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      state.exchangeRate = data.brl; // Update state
      LIQUIDITY_POOLS.BTC.price = data.brl; // Also update liquidity pool price
      rateText.textContent = `1 BTC ≈ ${state.exchangeRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      console.log("BTC Rate fetched:", state.exchangeRate);
  } catch (err) {
      console.error("Erro ao buscar o preço do BTC:", err);
      rateText.textContent = "Erro ao buscar a taxa 😓";
      state.exchangeRate = 0; // Indicate error state
      LIQUIDITY_POOLS.BTC.price = 0;
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
                  await processTransaction();

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
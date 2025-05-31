import './style.css';

const counterDisplay = document.getElementById('counter') as HTMLSpanElement;
const incrementButton = document.getElementById('incrementButton') as HTMLButtonElement;
const endTurnButton = document.getElementById('endTurnButton') as HTMLButtonElement;

let currentCounterValue = 0;

function updateCounterDisplay() {
  if (counterDisplay) {
    counterDisplay.textContent = currentCounterValue.toString();
  }
}

incrementButton?.addEventListener('click', () => {
  currentCounterValue++;
  updateCounterDisplay();
});

endTurnButton?.addEventListener('click', async () => {
  console.log('End Turn clicked. Current counter:', currentCounterValue);

  try {
    const response = await fetch('/api/end-turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ counter: currentCounterValue }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Server response:', data);
      // Optionally, update UI based on server response, e.g., disable buttons until next turn notification
    } else {
      console.error('Error ending turn:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to send end turn request:', error);
  }
});

// Initialize display
updateCounterDisplay();

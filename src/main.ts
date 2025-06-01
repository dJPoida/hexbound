import './style.css';

// UI Elements
const counterDisplay = document.getElementById('counter') as HTMLSpanElement;
const incrementButton = document.getElementById('incrementButton') as HTMLButtonElement;
const endTurnButton = document.getElementById('endTurnButton') as HTMLButtonElement;
const gameIdDisplay = document.getElementById('gameIdDisplay') as HTMLElement;
const playerNumberDisplay = document.getElementById('playerNumberDisplay') as HTMLElement;
const currentTurnDisplay = document.getElementById('currentTurnDisplay') as HTMLElement;
const copyGameLinkButton = document.getElementById('copyGameLinkButton') as HTMLButtonElement;
const startNewGameButton = document.getElementById('startNewGameButton') as HTMLButtonElement;
const appVersionDisplay = document.getElementById('appVersionDisplay') as HTMLSpanElement;

// Game State Variables
let currentCounterValue = 0;
let localSessionId = '';
let currentGameId = '';
let playerNumber: number | null = null; // 1 or 2
let isMyTurn = false;
let currentPushSubscription: PushSubscription | null = null;

// --- Game ID and Session ID Logic ---
const adjectives = ['Fast', 'Slow', 'Red', 'Blue', 'Green', 'Happy', 'Sad', 'Shiny', 'Dull', 'Quick', 'Lazy'];
const nouns = ['Monkey', 'Banana', 'Safari', 'River', 'Mountain', 'Ocean', 'Tiger', 'Lion', 'Sky', 'Cloud'];
const verbs = ['Jumps', 'Runs', 'Sleeps', 'Eats', 'Swims', 'Flies', 'Laughs', 'Cries', 'Dances', 'Sings'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateGameId(): string {
  return `${getRandomElement(adjectives)}-${getRandomElement(nouns)}-${getRandomElement(verbs)}`;
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('hexboundSessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('hexboundSessionId', sessionId);
  }
  return sessionId;
}

function updateUrlWithGameId(gameId: string) {
  const url = new URL(window.location.href);
  if (url.searchParams.get('game') !== gameId) {
    url.searchParams.set('game', gameId);
    window.history.pushState({ path: url.href }, '', url.href);
  }
}

function getGameIdFromUrlOrStorage(): string {
  const urlParams = new URLSearchParams(window.location.search);
  let gameId = urlParams.get('game');

  if (gameId) {
    localStorage.setItem('hexboundCurrentGameId', gameId);
    updateUrlWithGameId(gameId); // Ensure URL is canonical if loaded from param
    return gameId;
  } 
  
  gameId = localStorage.getItem('hexboundCurrentGameId');
  if (gameId) {
    updateUrlWithGameId(gameId);
    return gameId;
  }
  
  gameId = generateGameId();
  localStorage.setItem('hexboundCurrentGameId', gameId);
  updateUrlWithGameId(gameId);
  return gameId;
}

// --- UI Update Functions ---
function updateCounterDisplay() {
  if (counterDisplay) {
    counterDisplay.textContent = currentCounterValue.toString();
  }
  if (incrementButton) {
    incrementButton.disabled = !isMyTurn;
  }
  if (endTurnButton) {
    endTurnButton.disabled = !isMyTurn;
  }
}

function updateGameInfoDisplay() {
  if (gameIdDisplay) gameIdDisplay.textContent = currentGameId;
  if (playerNumberDisplay) playerNumberDisplay.textContent = playerNumber ? `Player ${playerNumber}` : (currentGameId ? 'Spectator' : '-');
  // Current turn display is updated by fetchGameState or after endTurn
}

function updateCurrentTurnDisplay(currentTurnSessionId: string | null, totalPlayers: number) {
  if (currentTurnDisplay) {
    if (!currentTurnSessionId) {
      currentTurnDisplay.textContent = 'Waiting for players...';
      return;
    }
    if (totalPlayers < 2 && playerNumber === 1) {
        currentTurnDisplay.textContent = `Player 1 (Your Turn) - Waiting for Player 2...`;
        return;
    }

    const turnIsMine = currentTurnSessionId === localSessionId;
    let turnPlayerNumber = null;
    // This is a simplification; ideally, the server would tell us the turn player's number
    // or we'd have a mapping of session IDs to player numbers from the game state.
    // For now, we assume if it's not our turn, and we know our player number, the other player is the turn player.
    if (playerNumber === 1 && currentTurnSessionId !== localSessionId) turnPlayerNumber = 2;
    if (playerNumber === 2 && currentTurnSessionId !== localSessionId) turnPlayerNumber = 1;
    if (turnIsMine) turnPlayerNumber = playerNumber;

    if (turnPlayerNumber) {
      currentTurnDisplay.textContent = `Player ${turnPlayerNumber}${turnIsMine ? ' (Your Turn)' : ''}`;
    } else {
      currentTurnDisplay.textContent = '-'; // Should not happen if game is active
    }
  }
}

// --- API Communication ---
async function fetchGameState(gameId: string, sessionId: string, pushSub: PushSubscription | null) {
  console.log(`Fetching game state for Game ID: ${gameId}, Session ID: ${sessionId}`);
  try {
    const response = await fetch('/api/get-game-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, sessionId, pushSubscription: pushSub }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error fetching game state:', response.status, errorData);
      // Potentially display an error to the user
      if (currentTurnDisplay) currentTurnDisplay.textContent = "Error loading game.";
      isMyTurn = false;
      playerNumber = null;
      currentCounterValue = 0;
    } else {
      const state = await response.json();
      console.log('Received game state:', state);

      currentGameId = state.gameId; // Should match, but good to sync
      playerNumber = state.playerNumberForThisClient;
      isMyTurn = state.current_turn_player_session_id === localSessionId;
      currentCounterValue = state.counter;
      
      updateCurrentTurnDisplay(state.current_turn_player_session_id, state.player_count);
    }
  } catch (error) {
    console.error('Network or other error fetching game state:', error);
    if (currentTurnDisplay) currentTurnDisplay.textContent = "Network error loading game.";
    isMyTurn = false;
    playerNumber = null;
    currentCounterValue = 0;
  }
  
  updateCounterDisplay();
  updateGameInfoDisplay();
}

async function handleStartNewGame() {
  console.log('[Client] Starting new game...');
  currentGameId = generateGameId();
  localStorage.setItem('hexboundCurrentGameId', currentGameId);
  updateUrlWithGameId(currentGameId);

  // Reset local state for the new game
  playerNumber = null; 
  isMyTurn = false;    
  currentCounterValue = 0;
  
  // Explicitly set placeholder UI for new game before fetching state
  if (gameIdDisplay) gameIdDisplay.textContent = currentGameId;
  if (playerNumberDisplay) playerNumberDisplay.textContent = '-';
  if (currentTurnDisplay) currentTurnDisplay.textContent = 'Loading...';
  updateCounterDisplay(); // Disables buttons as isMyTurn is false

  // Fetch state for the new game, attempt to join as Player 1
  // The existing push subscription is still valid and will be sent.
  await fetchGameState(currentGameId, localSessionId, currentPushSubscription);
}

// --- Event Listeners ---
incrementButton?.addEventListener('click', () => {
  if (!isMyTurn) {
    console.warn("Not your turn!");
    alert("Not your turn!"); // User-facing feedback
    return;
  }
  // Log before incrementing
  console.log('[Client] Increment clicked. Game ID:', currentGameId, 'Session ID:', localSessionId, 'Counter BEFORE:', currentCounterValue);
  
  // Increment counter locally
  currentCounterValue++;
  
  // Update UI
  updateCounterDisplay();
  
  // Log after incrementing and UI update
  console.log('[Client] Counter incremented locally. Counter AFTER:', currentCounterValue);
});

endTurnButton?.addEventListener('click', async () => {
  if (!isMyTurn) {
    console.warn("Not your turn!");
    alert("Not your turn!");
    return;
  }
  console.log('End Turn clicked. Game ID:', currentGameId, 'Session ID:', localSessionId, 'Counter:', currentCounterValue);

  // Disable buttons immediately to prevent double-clicks during API call
  isMyTurn = false;
  updateCounterDisplay(); 

  try {
    const response = await fetch('/api/end-turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId: currentGameId, sessionId: localSessionId, counter: currentCounterValue }), 
    });

    if (response.ok) {
      const data = await response.json();
      console.log('End turn server response:', data);
      if (data.newCounterValue !== undefined) currentCounterValue = data.newCounterValue; // Counter state from just before turn ended
      // isMyTurn is already false.
      // The actual current turn session ID is data.nextTurnPlayerSessionId
      // We need to know the total player count to display the message correctly.
      // For simplicity, we'll assume 2 players if the turn switch was successful.
      // A more robust solution might involve fetching full game state or server sending more details.
      updateCurrentTurnDisplay(data.nextTurnPlayerSessionId, 2); // Assume 2 players if successful turn end
      updateCounterDisplay(); // Re-syncs button states and counter display
      console.log("[Client] Turn ended successfully. UI updated.");
    } else {
      const errorText = await response.text();
      console.error('Error ending turn:', response.statusText, errorText);
      alert(`Error ending turn: ${errorText || response.statusText}`);
      // If ending turn failed, it's still our turn (re-enable buttons)
      isMyTurn = true; 
      updateCounterDisplay();
    }
  } catch (error) {
    console.error('Failed to send end turn request:', error);
    alert('Network error trying to end turn.');
    // If ending turn failed due to network, it's still our turn
    isMyTurn = true;
    updateCounterDisplay();
  }
});

copyGameLinkButton?.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('game', currentGameId);
  navigator.clipboard.writeText(url.href).then(() => {
    alert('Game link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy game link:', err);
  });
});

startNewGameButton?.addEventListener('click', handleStartNewGame);

// --- Web Push Setup ---
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorkerAndSubscribeToPush() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported in this browser.');
    return null;
  }
  if (!('PushManager' in window)) {
    console.error('Push API not supported in this browser.');
    return null;
  }

  const appVersion = import.meta.env.VITE_APP_VERSION || 'unknown';
  console.log('[Client] App Version:', appVersion);

  try {
    // Append app version as a query parameter to the SW script URL
    const swUrl = `/sw.js?v=${appVersion}`;
    console.log('[Client] Registering Service Worker from:', swUrl);
    const swRegistration = await navigator.serviceWorker.register(swUrl);
    console.log('Service Worker registered successfully:', swRegistration);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return null;
    }
    console.log('Notification permission granted.');

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is not set in .env.local or .env');
      return null;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const pushSubscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });

    console.log('User is subscribed to push notifications:', pushSubscription);
    console.log('Push Subscription JSON:', JSON.stringify(pushSubscription));
    return pushSubscription;
  } catch (error) {
    console.error('Service Worker registration or Push subscription failed:', error);
    return null;
  }
}

// --- Initialization ---
async function initializeApp() {
  // Display App Version ASAP
  const appVersion = import.meta.env.VITE_APP_VERSION || 'unknown';
  if (appVersionDisplay) {
    appVersionDisplay.textContent = appVersion;
  }
  console.log('[Client] App Version (for UI display):', appVersion);

  localSessionId = getSessionId();
  currentGameId = getGameIdFromUrlOrStorage();
  
  updateGameInfoDisplay(); // Initial display of game ID
  updateCounterDisplay(); // Initial button state

  currentPushSubscription = await registerServiceWorkerAndSubscribeToPush();
  
  // Now fetch the actual game state from the server
  await fetchGameState(currentGameId, localSessionId, currentPushSubscription);

  // Listen for messages from the Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      console.log('[Client] Message received from SW:', JSON.stringify(event.data)); // Log entire event.data
      if (event.data && event.data.type === 'GAME_UPDATE_NOTIFICATION') {
        const receivedGameId = event.data.gameId;
        console.log(`[Client] Received GAME_UPDATE_NOTIFICATION from SW. Current Game ID: ${currentGameId}, Received Game ID: ${receivedGameId}`);
        
        if (!receivedGameId || receivedGameId === currentGameId) {
          console.log(`[Client] Game ID matches (${receivedGameId}) or is null/undefined. Refreshing game state for ${currentGameId}...`);
          fetchGameState(currentGameId, localSessionId, currentPushSubscription);
        } else {
          console.log(`[Client] SW Notification was for a different game (Received: ${receivedGameId}), not refreshing current game (${currentGameId}).`);
        }
      }
    });
  }

  // Add listener for window focus to re-fetch game state
  window.addEventListener('focus', () => {
    if (isMyTurn) {
      console.log('[Client] Window focused, but it is currently this player\'s turn. Skipping state fetch.');
      return;
    }
    
    console.log('[Client] Window focused and it is NOT this player\'s turn. Re-fetching game state.');
    if (currentGameId && localSessionId) { // Ensure we have IDs before fetching
      fetchGameState(currentGameId, localSessionId, currentPushSubscription);
    }
  });
}

initializeApp();


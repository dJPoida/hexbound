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

// Player Management UI
const playerManagementDiv = document.getElementById('playerManagement') as HTMLDivElement;
const nameInputSectionDiv = document.getElementById('nameInputSection') as HTMLDivElement;
const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement;
const saveNameButton = document.getElementById('saveNameButton') as HTMLButtonElement;
const loadingPlayerMessageP = document.getElementById('loadingPlayerMessage') as HTMLParagraphElement;
const loggedInSectionDiv = document.getElementById('loggedInSection') as HTMLDivElement;
const loggedInPlayerNameSpan = document.getElementById('loggedInPlayerName') as HTMLSpanElement;
const logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;

// View Management UI (Player, Lobby, Game)
const viewDivider = document.getElementById('viewDivider') as HTMLHRElement; // Renamed from gameContentDivider
const lobbyViewDiv = document.getElementById('lobbyView') as HTMLDivElement;
const myGamesListUl = document.getElementById('myGamesList') as HTMLUListElement;
const noGamesMessageP = document.getElementById('noGamesMessage') as HTMLParagraphElement;
const lobbyCreateNewGameButton = document.getElementById('lobbyCreateNewGameButton') as HTMLButtonElement;
const joinGameIdInput = document.getElementById('joinGameIdInput') as HTMLInputElement;
const lobbyJoinByIdButton = document.getElementById('lobbyJoinByIdButton') as HTMLButtonElement;
const returnToLobbyButton = document.getElementById('returnToLobbyButton') as HTMLButtonElement;
const myGamesListLoadingIndicator = document.getElementById('myGamesListLoadingIndicator') as HTMLParagraphElement;

// Debug Section UI
const toggleDebugButton = document.getElementById('toggleDebugButton') as HTMLButtonElement;
const debugContent = document.getElementById('debugContent') as HTMLDivElement;
const gameStateJson = document.getElementById('gameStateJson') as HTMLPreElement;

// Game Content UI (to be shown/hidden)
const gameContainerDiv = document.getElementById('gameContainer') as HTMLDivElement;

// Game State Variables
let currentCounterValue = 0;
let localSessionId = ''; // This is the browser tab's session, distinct from playerId
let currentGameId = '';
let playerNumber: number | null = null; // 1 or 2 (in the context of the current game)
let isMyTurn = false;
let currentPushSubscription: PushSubscription | null = null;

// Player State Variables
let currentPlayerId: string | null = null;
let currentPlayerName: string | null = null;
const HEXBOUND_PLAYER_ID_KEY = 'hexboundPlayerId';

// Game-specific Player Details (populated when a game is active)
interface GamePlayerDetails {
  id: string | null;
  name: string | null;
}
let gamePlayer1: GamePlayerDetails = { id: null, name: null };
let gamePlayer2: GamePlayerDetails = { id: null, name: null };
let gameCurrentTurnPlayerId: string | null = null; // ID of the player whose turn it is in the current game

// Interface for game details received by the lobby
interface GameDetailsForLobby {
  gameId: string;
  player1Id: string | null;
  player1Name: string | null;
  player2Id: string | null;
  player2Name: string | null;
  currentTurnPlayerId: string | null;
  opponentName: string | null;
  isMyTurn: boolean;
}

// --- Player ID LocalStorage Functions ---
function getPlayerIdFromStorage(): string | null {
  return localStorage.getItem(HEXBOUND_PLAYER_ID_KEY);
}

function savePlayerIdToStorage(playerId: string): void {
  localStorage.setItem(HEXBOUND_PLAYER_ID_KEY, playerId);
}

function clearPlayerIdFromStorage(): void {
  localStorage.removeItem(HEXBOUND_PLAYER_ID_KEY);
}

// --- View Management ---
type AppView = 'login' | 'lobby' | 'game';

function showView(view: AppView) {
  console.log(`[Client] Showing view: ${view}`);
  // Hide all main views first
  if (nameInputSectionDiv) nameInputSectionDiv.style.display = 'none'; // Part of login view
  // loggedInSectionDiv is managed by updateLoginStateUI, not directly by showView generally
  if (lobbyViewDiv) lobbyViewDiv.style.display = 'none';
  if (gameContainerDiv) gameContainerDiv.style.display = 'none';
  if (returnToLobbyButton) returnToLobbyButton.style.display = 'none';
  if (viewDivider) viewDivider.style.display = 'block'; // Usually visible if logged in

  switch (view) {
    case 'login':
      // updateLoginStateUI will handle showing nameInputSection or loggedInSection
      if (viewDivider) viewDivider.style.display = 'none'; // No divider before login section
      // Ensure loggedInSection is also hidden if we are truly going to the name input form
      if (!currentPlayerId && loggedInSectionDiv) loggedInSectionDiv.style.display = 'none'; 
      if (nameInputSectionDiv && !currentPlayerId) nameInputSectionDiv.style.display = 'block';
      break;
    case 'lobby':
      if (lobbyViewDiv) lobbyViewDiv.style.display = 'block';
      break;
    case 'game':
      if (gameContainerDiv) gameContainerDiv.style.display = 'block';
      if (returnToLobbyButton) returnToLobbyButton.style.display = 'block';
      break;
  }
}

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

// Modified to only retrieve gameId from URL, not from localStorage as default.
// If no gameId in URL, returns null. Lobby logic will handle this.
function getGameIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('game');
}

// --- UI Update Functions ---
function updateLoginStateUI() {
  if (loadingPlayerMessageP) loadingPlayerMessageP.style.display = 'none'; // Always hide loading message here

  if (currentPlayerId && currentPlayerName) {
    // Logged in state: show logged-in info, hide name input
    if (nameInputSectionDiv) nameInputSectionDiv.style.display = 'none';
    if (loggedInSectionDiv) loggedInSectionDiv.style.display = 'block';
    if (loggedInPlayerNameSpan) loggedInPlayerNameSpan.textContent = currentPlayerName;
    if (playerNameInput) playerNameInput.value = ''; // Clear input field
  } else {
    // Logged out state: show name input, hide logged-in info and other views
    if (nameInputSectionDiv) nameInputSectionDiv.style.display = 'block';
    if (loggedInSectionDiv) loggedInSectionDiv.style.display = 'none';
    if (loggedInPlayerNameSpan) loggedInPlayerNameSpan.textContent = '';
    showView('login'); // Explicitly ensure only login prompt is visible
  }
}

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
  if (gameIdDisplay) gameIdDisplay.textContent = currentGameId || 'N/A';
  
  let playerDisplayString = '-';
  if (playerNumber && currentPlayerName) {
    playerDisplayString = `${currentPlayerName} (Player ${playerNumber})`;
  } else if (playerNumber && gamePlayer1.id === currentPlayerId && gamePlayer1.name) {
    playerDisplayString = `${gamePlayer1.name} (Player 1)`;
  } else if (playerNumber && gamePlayer2.id === currentPlayerId && gamePlayer2.name) {
    playerDisplayString = `${gamePlayer2.name} (Player 2)`;
  } else if (currentGameId) {
    playerDisplayString = 'Spectator';
  }
  if (playerNumberDisplay) playerNumberDisplay.textContent = playerDisplayString;
}

function updateCurrentTurnDisplay(
  activeTurnPlayerId: string | null, 
  p1Details: GamePlayerDetails, 
  p2Details: GamePlayerDetails, 
  totalGamePlayers: number
) {
  if (!currentTurnDisplay) return;

  if (!activeTurnPlayerId) {
    currentTurnDisplay.textContent = 'Waiting for players...';
    return;
  }

  // Use currentPlayerId (the logged-in user) to determine if it's their turn
  const turnIsMine = activeTurnPlayerId === currentPlayerId;

  if (totalGamePlayers < 2 && p1Details.id === activeTurnPlayerId && turnIsMine) {
    currentTurnDisplay.textContent = `${p1Details.name || 'Player 1'} (Your Turn) - Waiting for Player 2...`;
    return;
  }

  let turnText = '-';
  if (activeTurnPlayerId === p1Details.id && p1Details.name) {
    turnText = `${p1Details.name} (P1)`;
  } else if (activeTurnPlayerId === p2Details.id && p2Details.name) {
    turnText = `${p2Details.name} (P2)`;
  } else if (activeTurnPlayerId) {
    // Fallback if name is somehow not available but ID is, though less likely with new flow
    turnText = `Player (ID ending ...${activeTurnPlayerId.slice(-4)})`; 
  }

  if (turnIsMine) {
    turnText += ' (Your Turn)';
  }
  currentTurnDisplay.textContent = turnText;
}

function updateDebugDisplay() {
  if (!gameStateJson) return;

  const clientDebugState = {
    activePlayer: {
      id: currentPlayerId,
      name: currentPlayerName,
      localSessionId: localSessionId,
      pushSubscription: currentPushSubscription ? JSON.parse(JSON.stringify(currentPushSubscription)) : null // Deep copy for display
    },
    currentGame: {
      id: currentGameId,
      isMyTurn: isMyTurn,
      counter: currentCounterValue,
      thisClientPlayerNumber: playerNumber,
      player1Details: gamePlayer1,
      player2Details: gamePlayer2,
      currentTurnPlayerId: gameCurrentTurnPlayerId,
    }
  };
  gameStateJson.textContent = JSON.stringify(clientDebugState, null, 2);
}

// --- API Communication ---
async function fetchGameState(gameId: string, sessionId: string, pushSub: PushSubscription | null, playerIdForGame: string | null) {
  console.log(`Fetching game state for Game ID: ${gameId}, Session ID: ${sessionId}, Player ID: ${playerIdForGame}`);
  if (!playerIdForGame) {
    console.warn('[Client fetchGameState] Attempted to fetch game state without a playerIdForGame. Aborting.');
    gamePlayer1 = { id: null, name: null }; gamePlayer2 = { id: null, name: null }; gameCurrentTurnPlayerId = null; isMyTurn = false;
    updateGameInfoDisplay(); updateCurrentTurnDisplay(null, gamePlayer1, gamePlayer2, 0);
    updateDebugDisplay(); // Reflect reset state in debug view
    return;
  }
  try {
    const response = await fetch('/api/get-game-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, sessionId, pushSubscription: pushSub, playerId: playerIdForGame }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error fetching game state:', response.status, errorData);
      if (currentTurnDisplay) currentTurnDisplay.textContent = "Error loading game.";
      isMyTurn = false; playerNumber = null; currentCounterValue = 0;
      gamePlayer1 = { id: null, name: null }; gamePlayer2 = { id: null, name: null }; gameCurrentTurnPlayerId = null;
      updateDebugDisplay(); // Reflect reset state in debug view
    } else {
      const state = await response.json();
      console.log('Received game state:', state);

      currentGameId = state.gameId;
      playerNumber = state.playerNumberForThisClient; // P1 or P2 for THIS client
      
      gamePlayer1 = { id: state.player1_id, name: state.player1_name };
      gamePlayer2 = { id: state.player2_id, name: state.player2_name };
      gameCurrentTurnPlayerId = state.current_turn_player_id;
      
      isMyTurn = currentPlayerId === gameCurrentTurnPlayerId;
      currentCounterValue = state.counter;
      
      updateCurrentTurnDisplay(gameCurrentTurnPlayerId, gamePlayer1, gamePlayer2, state.player_count);
      updateDebugDisplay(); // Update debug view with new state
    }
  } catch (error) {
    console.error('Network or other error fetching game state:', error);
    if (currentTurnDisplay) currentTurnDisplay.textContent = "Network error loading game.";
    isMyTurn = false; playerNumber = null; currentCounterValue = 0;
    gamePlayer1 = { id: null, name: null }; gamePlayer2 = { id: null, name: null }; gameCurrentTurnPlayerId = null;
    updateDebugDisplay(); // Reflect reset state in debug view
  }
  
  updateCounterDisplay();
  updateGameInfoDisplay(); // Call this after gamePlayer1/2 might have been updated
}

// --- Lobby Functions (New) ---
async function populateLobby() {
  if (!currentPlayerId) {
    console.warn('[Client] Cannot populate lobby, player not logged in.');
    showView('login');
    return;
  }
  console.log('[Client] Populating lobby for player:', currentPlayerId);

  if (myGamesListLoadingIndicator) myGamesListLoadingIndicator.style.display = 'block'; // Show loading
  if (myGamesListUl) myGamesListUl.innerHTML = ''; // Clear previous list
  if (noGamesMessageP) noGamesMessageP.style.display = 'none'; // Hide no games message initially

  try {
    const response = await fetch(`/api/get-my-games?playerId=${currentPlayerId}`);
    if (myGamesListLoadingIndicator) myGamesListLoadingIndicator.style.display = 'none'; // Hide loading

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Client populateLobby] Error fetching games:', response.status, errorText);
      if (myGamesListUl) myGamesListUl.innerHTML = '<li>Error loading your games.</li>';
      // noGamesMessageP remains hidden as we show an error in the list
      return;
    }

    const games: GameDetailsForLobby[] = await response.json();
    console.log('[Client populateLobby] Received games:', games);

    if (games.length === 0) {
      if (noGamesMessageP) noGamesMessageP.style.display = 'block';
    } else {
      games.forEach(game => {
        if (!myGamesListUl) return;
        const listItem = document.createElement('li');
        
        let gameInfoText = `Game: ${game.gameId}`;
        if (game.opponentName) {
          gameInfoText += ` (vs ${game.opponentName})`;
        } else if (game.player1Id === currentPlayerId && !game.player2Id) {
          gameInfoText += ' (Waiting for opponent)';
        } else {
          gameInfoText += ' (Open game)';
        }

        if (game.isMyTurn) {
          gameInfoText += ' - <strong>Your Turn!</strong>';
        }
        
        listItem.innerHTML = gameInfoText; // Use innerHTML to parse the <strong> tag

        const joinButton = document.createElement('button');
        joinButton.textContent = 'Join Game';
        joinButton.style.marginLeft = '10px';
        joinButton.dataset.gameid = game.gameId;
        joinButton.addEventListener('click', (e) => {
          const gameIdToJoin = (e.target as HTMLButtonElement).dataset.gameid;
          if (gameIdToJoin) {
            navigateToGame(gameIdToJoin);
          }
        });
        listItem.appendChild(joinButton);
        myGamesListUl.appendChild(listItem);
      });
    }

  } catch (error: any) {
    if (myGamesListLoadingIndicator) myGamesListLoadingIndicator.style.display = 'none'; // Hide loading on error too
    console.error('[Client populateLobby] Network or other error fetching games:', error);
    if (myGamesListUl) myGamesListUl.innerHTML = '<li>Network error loading games.</li>';
    // noGamesMessageP remains hidden
  }
}

function navigateToGame(gameId: string) {
  console.log(`[Client] Navigating to game: ${gameId}`);
  updateUrlWithGameId(gameId); // This will set the URL
  currentGameId = gameId; // Set current game ID state
  showView('game');
  if (currentPlayerId) { // Should always be true if we get here from lobby actions
    initializeGameSystems(gameId, currentPlayerId, localSessionId);
    // initializeGameSystems will call fetchGameState, which calls updateDebugDisplay
  }
  // Update debug display with initial (possibly empty) game state for this new game view
  // Or rely on fetchGameState within initializeGameSystems to do the first updateDebugDisplay.
  // For consistency, let's call it after fetchGameState in initializeGameSystems.
}

// Modified handleStartNewGame to be callable from lobby
async function handleCreateNewGameFromLobby() {
  if (!currentPlayerId) {
    alert('You must be logged in to create a game.');
    return;
  }
  const newGameId = generateGameId();
  console.log('[Client] New game created from lobby by player:', currentPlayerId, 'New Game ID:', newGameId);
  // No need to save to localStorage here, navigateToGame will update URL
  navigateToGame(newGameId); // This will also call initializeGameSystems
}

// --- Player Management Event Listeners ---
saveNameButton?.addEventListener('click', async () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert('Please enter your name.');
    playerNameInput.focus();
    return;
  }

  console.log('[Client] Attempting to save/register player name:', name);
  saveNameButton.disabled = true; // Prevent double-clicks

  try {
    const response = await fetch('/api/register-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: name })
    });

    if (response.ok) {
      const playerData = await response.json();
      if (typeof playerData.playerId === 'string' && typeof playerData.playerName === 'string') {
        currentPlayerId = playerData.playerId;
        currentPlayerName = playerData.playerName;
        savePlayerIdToStorage(playerData.playerId);
        console.log('[Client] Player registered/logged in:', currentPlayerName, 'ID:', currentPlayerId);
        updateLoginStateUI(); // Update player info display
        // DON'T call initializeGameSystems directly. initializeApp will handle routing to lobby/game.
        initializeApp(); // Re-run initializeApp to route to lobby or game based on URL
      } else {
        console.error('[Client] Error registering player: API response did not contain a valid playerId or playerName.', playerData);
        alert('Error saving name: Received invalid data from server.');
      }
    } else {
      const errorData = await response.text();
      let errorMessage = 'Unknown error during registration.';
      try {
        const parsedError = JSON.parse(errorData);
        if (parsedError && parsedError.message) {
          errorMessage = parsedError.message;
        }
      } catch (e) { 
        errorMessage = errorData.length < 100 ? errorData : 'Error saving name (server issue).';
      }
      console.error('[Client] Error registering player:', response.status, errorMessage);
      alert(`Error saving name: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('[Client] Network or other error during player registration:', error);
    alert(`Network error trying to save name: ${error.message || 'Please check your connection.'}`);
  }
  saveNameButton.disabled = false; // Re-enable button
});

logoutButton?.addEventListener('click', () => {
  console.log('[Client] Logging out player:', currentPlayerName, 'ID:', currentPlayerId);
  clearPlayerIdFromStorage();
  currentPlayerId = null;
  currentPlayerName = null;
  updateLoginStateUI(); // This will now also call showView('login') internally
  // Clear URL game param if any
  const url = new URL(window.location.href);
  if (url.searchParams.has('game')) {
    url.searchParams.delete('game');
    window.history.pushState({ path: url.href }, '', url.href);
  }
  console.log('[Client] Player logged out. UI updated, showing login prompt.');
});

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
  if (!isMyTurn || !currentPlayerId) { // currentPlayerId should be set if isMyTurn is true
    console.warn("Not your turn or player ID missing! isMyTurn:", isMyTurn, "currentPlayerId:", currentPlayerId);
    alert("Not your turn or not properly logged in!");
    return;
  }
  console.log('End Turn clicked. Game ID:', currentGameId, 'Player ID:', currentPlayerId, 'Counter:', currentCounterValue);

  const endedTurnPlayerId = currentPlayerId; // Store who ended the turn
  isMyTurn = false; // Optimistically set to false
  updateCounterDisplay(); 

  try {
    const response = await fetch('/api/end-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        gameId: currentGameId, 
        playerId: endedTurnPlayerId, 
        counter: currentCounterValue 
      }), 
    });

    if (response.ok) {
      const data = await response.json();
      console.log('End turn server response:', data);
      if (data.newCounterValue !== undefined) currentCounterValue = data.newCounterValue;
      gameCurrentTurnPlayerId = data.nextTurnPlayerId;
      isMyTurn = currentPlayerId === gameCurrentTurnPlayerId; // Crucial update
      
      // The server response for end-turn doesn't include full player names. 
      // We rely on gamePlayer1 and gamePlayer2 being up-to-date from the last fetchGameState.
      // The player_count also needs to be accurate. For simplicity, assume 2 if turn ended successfully.
      const playerCount = (gamePlayer1.id && gamePlayer2.id) ? 2 : (gamePlayer1.id ? 1: 0);
      updateCurrentTurnDisplay(gameCurrentTurnPlayerId, gamePlayer1, gamePlayer2, playerCount);
      updateCounterDisplay(); // Reflect new isMyTurn state
      console.log("[Client] Turn ended successfully. UI updated.");
      updateDebugDisplay(); // Update debug view with new state
    } else {
      const errorText = await response.text();
      console.error('Error ending turn:', response.statusText, errorText);
      alert(`Error ending turn: ${errorText || response.statusText}`);
      isMyTurn = true; // Revert: it's still the previous player's turn on error
      updateCounterDisplay();
      updateDebugDisplay(); // If state is changed reflect it
    }
  } catch (error) {
    console.error('Failed to send end turn request:', error);
    alert('Network error trying to end turn.');
    isMyTurn = true; // Revert
    updateCounterDisplay();
    updateDebugDisplay(); // If state is changed reflect it
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

startNewGameButton?.addEventListener('click', handleCreateNewGameFromLobby);

// --- Lobby Event Listeners (New) ---
lobbyCreateNewGameButton?.addEventListener('click', handleCreateNewGameFromLobby);

lobbyJoinByIdButton?.addEventListener('click', () => {
  if (!joinGameIdInput) return;
  const gameIdToJoin = joinGameIdInput.value.trim();
  if (gameIdToJoin) {
    navigateToGame(gameIdToJoin);
    joinGameIdInput.value = ''; // Clear input
  } else {
    alert('Please enter a Game ID to join.');
  }
});

returnToLobbyButton?.addEventListener('click', () => {
  console.log('[Client] Returning to lobby from game:', currentGameId);
  // Clear the game parameter from URL and navigate to lobby view
  const url = new URL(window.location.href);
  if (url.searchParams.has('game')) {
    url.searchParams.delete('game');
    window.history.pushState({ path: url.href }, '', url.href);
  }
  currentGameId = ''; // Clear current game context
  // Reset game specific UI elements if necessary (or rely on initializeGameSystems not running)
  if (gameIdDisplay) gameIdDisplay.textContent = '-';
  if (playerNumberDisplay) playerNumberDisplay.textContent = '-';
  if (currentTurnDisplay) currentTurnDisplay.textContent = '-';
  if (counterDisplay) counterDisplay.textContent = '0';
  isMyTurn = false;
  updateCounterDisplay();

  if (debugContent) debugContent.style.display = 'none';
  if (toggleDebugButton) toggleDebugButton.textContent = 'Show Debug Info';
  showView('lobby');
  populateLobby(); // Refresh lobby content
});

toggleDebugButton?.addEventListener('click', () => {
  if (debugContent && toggleDebugButton) {
    const isHidden = debugContent.style.display === 'none';
    debugContent.style.display = isHidden ? 'block' : 'none';
    toggleDebugButton.textContent = isHidden ? 'Hide Debug Info' : 'Show Debug Info';
    if (isHidden) {
      updateDebugDisplay(); // Update content when showing
    }
  }
});

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

// Modified initializeGameSystems to accept gameId, playerId, sessionId
async function initializeGameSystems(gameIdToLoad: string, pId: string, sId: string) {
  console.log(`[Client] Initializing game systems for Game ID: ${gameIdToLoad}, Player ID: ${pId}, Session ID: ${sId}`);
  currentGameId = gameIdToLoad;
  // currentPlayerId and localSessionId should already be set by initializeApp

  updateGameInfoDisplay(); // Use currentGameId set above
  updateCounterDisplay(); 

  currentPushSubscription = await registerServiceWorkerAndSubscribeToPush();
  await fetchGameState(currentGameId, sId, currentPushSubscription, pId);

  // Listen for messages from the Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'GAME_UPDATE_NOTIFICATION') {
        const receivedGameId = event.data.gameId;
        if (!receivedGameId || receivedGameId === currentGameId) {
          fetchGameState(currentGameId, sId, currentPushSubscription, pId);
        }
      }
    });
  }

  // Add listener for window focus
  window.addEventListener('focus', () => {
    if (isMyTurn) return;
    if (currentGameId && pId && sId) {
      fetchGameState(currentGameId, sId, currentPushSubscription, pId);
    }
  });
  console.log('[Client] Game systems initialized for:', currentGameId);
}

// --- Initialization (Refactored) ---
async function initializeApp() {
  const appVersion = import.meta.env.VITE_APP_VERSION || 'unknown';
  if (appVersionDisplay) appVersionDisplay.textContent = appVersion;
  console.log('[Client] App Version:', appVersion);

  localSessionId = getSessionId();
  const storedPlayerId = getPlayerIdFromStorage();

  if (storedPlayerId) {
    console.log('[Client] Found Player ID in storage:', storedPlayerId);
    if (nameInputSectionDiv) nameInputSectionDiv.style.display = 'none';
    if (loggedInSectionDiv) loggedInSectionDiv.style.display = 'none'; // Hide this too initially
    if (loadingPlayerMessageP) {
      loadingPlayerMessageP.textContent = 'Verifying your session...';
      loadingPlayerMessageP.style.display = 'block';
    }

    try {
      const playerDetailsResponse = await fetch(`/api/get-player-details?playerId=${storedPlayerId}`);
      if (playerDetailsResponse.ok) {
        const details = await playerDetailsResponse.json();
        currentPlayerId = storedPlayerId; // Confirm the ID used
        currentPlayerName = details.playerName;
        console.log('[Client] Fetched player name:', currentPlayerName);
        if (loadingPlayerMessageP) loadingPlayerMessageP.textContent = `Welcome back, ${currentPlayerName}! Please wait...`;
      } else {
        console.warn('[Client] Could not fetch player details for stored ID. Status:', playerDetailsResponse.status, '. Logging out.');
        clearPlayerIdFromStorage(); 
        currentPlayerId = null; 
        currentPlayerName = null;
        alert('Your saved session is invalid or has expired. Please enter your name again.');
      }
    } catch (e: any) {
      console.error('[Client] Network error fetching player details:', e);
      // Don't clear stored ID on network error, but treat as logged out for this session attempt
      currentPlayerId = null; 
      currentPlayerName = null; 
      alert('Could not connect to the server to verify your identity. Please check your connection or try again later.');
    }
    // loadingPlayerMessageP will be hidden by updateLoginStateUI or subsequent showView call

  } else {
    console.log('[Client] No Player ID found in storage.');
    // currentPlayerId and currentPlayerName are already null
    if (loadingPlayerMessageP) loadingPlayerMessageP.style.display = 'none'; // Ensure it's hidden
  }

  updateLoginStateUI(); // Sets player name display or prompts for login name, and hides loading message

  if (currentPlayerId && currentPlayerName) {
    // Player is successfully (re)logged in
    console.log('[Client] Player is logged in:', currentPlayerName, 'ID:', currentPlayerId);
    if (loadingPlayerMessageP) loadingPlayerMessageP.style.display = 'none'; // Explicitly hide again before routing
    const gameIdFromUrl = getGameIdFromUrl();
    if (gameIdFromUrl) {
      console.log('[Client] Game ID found in URL, navigating to game:', gameIdFromUrl);
      navigateToGame(gameIdFromUrl);
    } else {
      console.log('[Client] No Game ID in URL, showing lobby.');
      showView('lobby');
      await populateLobby();
    }
  } else {
    // Player not logged in (or name fetch failed, or no stored ID)
    console.log('[Client] Player not logged in. Login prompt will be shown by updateLoginStateUI.');
    // updateLoginStateUI already called showView('login') if !currentPlayerId
    if (loadingPlayerMessageP) loadingPlayerMessageP.style.display = 'none'; // Ensure hidden
  }
}

initializeApp();


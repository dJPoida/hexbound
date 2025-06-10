import { render, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import htm from 'htm';
import './global.css'; // Import global styles
import styles from './App.module.css'; // Import CSS Modules
import { UserLogin } from './components/UserLogin';
import { LobbyView } from './components/LobbyView'; // Import LobbyView
import { GameContainer } from './components/GameContainer'; // Import GameContainer
import { Header } from './components/Header';
import { authService } from './services/auth.service';
import { authenticatedFetch } from './services/api.service';
import { socketService } from './services/socket.service';
import { GameStateUpdatePayload } from '../shared/types/socket.types';
import { Game } from '../shared/types/game.types';

// Initialize htm with Preact's h function
const html = htm.bind(h);

// Define the main App component
function App() {
  const [version, setVersion] = useState('LOADING...');
  
  // User Authentication State
  const [userNameInput, setUserNameInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // View and Navigation State
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  // Game State
  const [gameState, setGameState] = useState<GameStateUpdatePayload | null>(null);
  const [myGames, setMyGames] = useState<Game[]>([]);

  const fetchMyGames = async () => {
    try {
      const response = await authenticatedFetch('/api/games');
      if (response.ok) {
        const games = await response.json();
        setMyGames(games);
      } else {
        console.error('Failed to fetch user games');
      }
    } catch (error) {
      console.error('Error fetching user games:', error);
    }
  };

  useEffect(() => {
    // VITE_APP_VERSION is injected by Vite during the build process
    const appVersionFromEnv = import.meta.env.VITE_APP_VERSION;
    if (appVersionFromEnv) {
      setVersion(appVersionFromEnv);
    } else {
      // Fallback for dev mode if VITE_APP_VERSION might not be set by `define` (though it should be)
      // or fetch from the server API as a more robust dev fallback.
      fetch('/api/version')
        .then(res => res.json())
        .then(data => setVersion(data.version || 'N/A (dev)'))
        .catch(() => setVersion('N/A (fetch error)'));
    }

    const lastUserName = authService.getUserName();
    if(lastUserName) {
      setUserNameInput(lastUserName);
    }

    // Check for existing user session using the auth service
    const session = authService.getSession();
    if (session) {
      setCurrentUserId(session.userId);
      setCurrentUserName(session.userName);
      setIsLoggedIn(true);
      fetchMyGames(); // Fetch games if session exists
    }

    // Setup socket listeners
    const handleGameStateUpdate = (payload: unknown) => {
      setGameState(payload as GameStateUpdatePayload);
    };
    const handleCounterUpdate = (payload: unknown) => {
      const update = payload as { newCount: number };
      setGameState(prev => prev ? { ...prev, gameState: { ...prev.gameState, placeholderCounter: update.newCount } } : null);
    };

    socketService.on('game:state_update', handleGameStateUpdate);
    socketService.on('game:counter_update', handleCounterUpdate);

    return () => {
      // Cleanup listeners on component unmount
      socketService.off('game:state_update', handleGameStateUpdate);
      socketService.off('game:counter_update', handleCounterUpdate);
    };
  }, []);

  const handleUserNameInputChange = (name: string) => {
    setUserNameInput(name);
  };

  const handleLogin = async () => {
    if (!userNameInput.trim()) {
      setAuthError('Username cannot be empty.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: userNameInput.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        // Use the auth service to save the session
        authService.saveSession(data.sessionToken, data.userId, data.userName);
        
        setCurrentUserId(data.userId);
        setCurrentUserName(data.userName);
        setIsLoggedIn(true);
        setCurrentView('lobby');
        setUserNameInput('');
        fetchMyGames(); // Fetch games after successful login
      } else {
        setAuthError(data.message || 'Authentication failed.');
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
      console.error('Auth error:', error);
    }
    setIsLoading(false);
  };

  const handleCreateNewGame = async () => {
    setIsLoading(true); // Reuse isLoading for feedback
    setAuthError(null);
    try {
      const response = await authenticatedFetch('/api/games', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Game created successfully:', data);
        fetchMyGames(); // Refresh the game list
        navigateToGame(data.gameId);
      } else {
        setAuthError(data.message || 'Failed to create game.');
      }
    } catch (error) {
      setAuthError('An error occurred while creating the game.');
      console.error('Create game error:', error);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setCurrentUserName(null);
    setCurrentView('lobby');
    authService.clearAuthToken(); // Use the auth service to clear the session but keep the user name
  };

  const navigateToGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setCurrentView('game');
    socketService.connect(gameId);
  };

  const navigateToLobby = () => {
    if (currentGameId) {
      socketService.sendMessage('game:unsubscribe', { gameId: currentGameId });
    }
    setCurrentGameId(null);
    setGameState(null);
    setCurrentView('lobby');
  };

  const handleIncrementCounter = () => {
    if (currentGameId) {
        socketService.sendMessage('game:increment_counter', { gameId: currentGameId });
    }
  };

  const handleEndTurn = () => {
      if (currentGameId) {
          socketService.sendMessage('game:end_turn', { gameId: currentGameId });
      }
  };

  return html`
    <div class=${styles.appContainer}>
      ${!isLoggedIn ? html`
        <${UserLogin} 
          styles=${styles} 
          userNameInput=${userNameInput}
          onUserNameInputChange=${handleUserNameInputChange}
          onLogin=${handleLogin}
          isLoading=${isLoading}
          error=${authError}
        />
      ` : html`
        <div class=${styles.loggedInContainer}> <!-- Logged in Wrapper -->
          <${Header}
            styles=${styles}
            currentUserName=${currentUserName}
            onLogout=${handleLogout}
            currentView=${currentView}
            onNavigateToLobby=${navigateToLobby}
          />
          
          <hr class=${styles.divider} />
          
          ${currentView === 'lobby' && html`
            <${LobbyView} 
              styles=${styles} 
              onNavigateToGame=${navigateToGame} 
              onCreateNewGame=${handleCreateNewGame}
              myGames=${myGames}
            />
          `}
          ${currentView === 'game' && html`
            <${GameContainer} 
              styles=${styles}
              gameState=${gameState}
              onIncrementCounter=${handleIncrementCounter}
              onEndTurn=${handleEndTurn}
            />
          `}
        </div>
      `}
      <p class=${styles.versionDisplay}>Version: <span id="appVersionDisplay">${version}</span></p>
    </div>
  `;
}

// Render the App component into the div#app element in index.html
const appRoot = document.getElementById('app');
if (appRoot) {
  render(html`<${App} />`, appRoot);
} else {
  console.error('Target root element #app not found in DOM.');
}

// Basic HMR setup for Preact components
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.App) {
      // Re-render the new App component
      if (appRoot) {
        render(html`<${newModule.App} />`, appRoot);
        console.log('HMR update applied for App component');
      }
    }
  });
  // Also make sure main.ts itself is hot-replaceable if its direct code changes
  import.meta.hot.accept();
}

console.log('Preact app initialized.');
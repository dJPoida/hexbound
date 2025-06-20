import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import htm from 'htm';
import './global.css'; // Import global styles
import styles from './App.module.css'; // Import CSS Modules
import { Router } from './components/Router/Router';
import { UserLogin } from './components/UserLogin/UserLogin';
import { LobbyView } from './components/LobbyView/LobbyView';
import { GameContainer } from './components/GameContainer/GameContainer';
import { Header } from './components/Header/Header';
import { authService } from './services/auth.service';
import { authenticatedFetch } from './services/api.service';
import { socketService } from './services/socket.service';
import { ClientGameStatePayload } from '../shared/types/socket.types';
import { Game } from '../shared/types/game.types';
import { Viewport } from './components/Viewport/Viewport';
import { GameLayout } from './components/GameLayout/GameLayout';
import { ActionBar } from './components/ActionBar/ActionBar';
import { Button } from './components/Button/Button';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

// Initialize htm with Preact's h function
const html = htm.bind(h);

// Define the main App component
export function App() {
  const [version, setVersion] = useState('LOADING...');
  
  // User Authentication State
  const [userNameInput, setUserNameInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // View and Navigation State
  const [currentView, setCurrentView] = useState<'login' | 'lobby' | 'game'>('login');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  // Game State
  const [gameState, setGameState] = useState<ClientGameStatePayload | null>(null);
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const getGameByCode = async (gameCode: string) => {
    try {
      const response = await authenticatedFetch(`/api/games/by-code/${gameCode}`);
      if (response.ok) {
        const game = await response.json();
        navigateToGame(game.gameId, game.gameCode);
      } else {
        // Handle not found or other errors
        console.error('Game not found for code:', gameCode);
        navigateToLobby(); // Or show a not-found message
      }
    } catch (error) {
      console.error('Error fetching game by code:', error);
    }
  };

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

      // Check URL for game code
      const path = window.location.pathname;
      const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
      if (gameIdMatch) {
        const gameCode = gameIdMatch[1];
        getGameByCode(gameCode);
      } else {
        setCurrentView('lobby');
      }
    }

    // Setup socket listeners
    const handleGameStateUpdate = (payload: unknown) => {
      setGameState(payload as ClientGameStatePayload);
    };
    const handleCounterUpdate = (payload: unknown) => {
      const update = payload as { newCount: number };
      setGameState((prev: ClientGameStatePayload | null) => prev ? { ...prev, gameState: { ...prev.gameState, placeholderCounter: update.newCount } } : null);
    };
    const handleStatusUpdate = (status: ConnectionStatus) => {
      setConnectionStatus(status);
    }

    socketService.on('game:state_update', handleGameStateUpdate);
    socketService.on('game:counter_update', handleCounterUpdate);
    socketService.onStatus(handleStatusUpdate);

    const handlePopState = () => {
      const path = window.location.pathname;
      const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
      if (gameIdMatch) {
        if(isLoggedIn) {
          const gameCode = gameIdMatch[1];
          getGameByCode(gameCode);
        }
      } else {
        navigateToLobby();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      // Cleanup listeners on component unmount
      socketService.off('game:state_update', handleGameStateUpdate);
      socketService.off('game:counter_update', handleCounterUpdate);
      socketService.offStatus(handleStatusUpdate);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (currentView === 'lobby' && isLoggedIn) {
      // Fetch games immediately when entering the lobby
      fetchMyGames();

      // Set up an interval to poll every 60 seconds
      const pollInterval = setInterval(fetchMyGames, 60000);

      // Clean up the interval when the component unmounts or the view changes
      return () => clearInterval(pollInterval);
    }
  }, [currentView, isLoggedIn]);

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
        setUserNameInput('');
        fetchMyGames(); // Fetch games after successful login

        const path = window.location.pathname;
        const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
        if (gameIdMatch) {
          const gameCode = gameIdMatch[1];
          getGameByCode(gameCode);
        } else {
          setCurrentView('lobby');
        }
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
        navigateToGame(data.gameId, data.gameCode);
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
    navigateToLobby();
    authService.clearAuthToken();
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setCurrentUserName(null);
  };

  const navigateToGame = (gameId: string, gameCode: string) => {
    setCurrentGameId(gameId);
    setCurrentView('game');
    socketService.connect(gameId);
    window.history.pushState({ gameId }, '', `/game/${gameCode}`);
  };

  const navigateToLobby = () => {
    if (currentGameId) {
      socketService.sendMessage('game:unsubscribe', { gameId: currentGameId });
    }
    socketService.disconnect();
    setCurrentGameId(null);
    setGameState(null);
    setCurrentView('lobby');
    window.history.pushState({}, '', '/');
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

  const renderLoggedInView = () => {
    const isMyTurn = gameState?.currentPlayerId === currentUserId;

    const mainContent = () => {
      if (currentView === 'lobby') {
        return (
          <LobbyView
            onNavigateToGame={navigateToGame}
            onCreateNewGame={handleCreateNewGame}
            myGames={myGames}
            currentUserId={currentUserId}
          />
        );
      }
      if (currentView === 'game' && gameState) {
        return (
          <GameContainer
            gameState={gameState}
            onIncrementCounter={handleIncrementCounter}
            onEndTurn={handleEndTurn}
            connectionStatus={connectionStatus}
            isMyTurn={isMyTurn}
          />
        );
      }
      return null;
    };

    const headerContent = (
      <Header
        currentUserName={currentUserName}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigateToLobby={navigateToLobby}
      />
    );

    let footerContent = null;
    if (currentView === 'game') {
      footerContent = (
        <ActionBar>
          <Button onClick={handleEndTurn} variant="secondary" disabled={!isMyTurn}>End Turn</Button>
        </ActionBar>
      );
    }

    return (
      <GameLayout
        header={headerContent}
        main={mainContent()}
        footer={footerContent}
      />
    );
  };

  const viewToRender = () => {
    if (!isLoggedIn) {
      return (
        <UserLogin 
          userNameInput={userNameInput}
          onUserNameInputChange={handleUserNameInputChange}
          onLogin={handleLogin}
          isLoading={isLoading}
          error={authError}
        />
      );
    }

    return renderLoggedInView();
  };

  return (
    <div className={styles.appContainer}>
      {viewToRender()}
      <p className={styles.versionDisplay}>Version: <span id="appVersionDisplay">{version}</span></p>
    </div>
  );
}
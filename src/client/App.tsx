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
import { Dialog } from './components/Dialog/Dialog';
import { API_ROUTES } from '../shared/constants/api.const';
import { EnableNotificationsDialog } from './components/EnableNotificationsDialog/EnableNotificationsDialog';
import { settingsService } from './services/settings.service';
import { pushService } from './services/push.service';
import type { NotificationPermission } from './components/GameSettingsDialog/GameSettingsDialog';

const NOTIFICATION_PENDING_KEY = 'hexbound-notifications-pending-activation';
type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type ExtendedPermissionState = 'prompt' | 'granted' | 'denied' | 'default';

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
  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // View and Navigation State
  const [currentView, setCurrentView] = useState<'login' | 'lobby' | 'game'>('login');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  // Game State
  const [gameState, setGameState] = useState<ClientGameStatePayload | null>(null);
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isDebugInfoOpen, setIsDebugInfoOpen] = useState(false);

  const [afterPromptAction, setAfterPromptAction] = useState<() => void>(() => {});

  const handleJoinGame = async (gameCode: string) => {
    try {
      // First, attempt to join the game.
      const joinResponse = await authenticatedFetch(`/api/games/${gameCode}/join`, {
        method: 'POST',
      });

      if (!joinResponse.ok) {
        // If join fails (e.g., game not found, server error), handle it.
        const errorData = await joinResponse.json();
        console.error('Failed to join game:', errorData.message);
        navigateToLobby(); // Or show an error message to the user
        return;
      }
      
      const joinData = await joinResponse.json();
      const gameId = joinData.gameId;

      // After a successful join, navigate to the game.
      navigateToGame(gameId, gameCode);

    } catch (error) {
      console.error('Error joining game:', error);
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

    // Check if we're returning from a permission change
    const isNotificationPending = sessionStorage.getItem(NOTIFICATION_PENDING_KEY);
    if (isNotificationPending) {
      sessionStorage.removeItem(NOTIFICATION_PENDING_KEY); // Clean up immediately
      if (Notification.permission === 'granted') {
        console.log('[App] Resuming notification subscription after permission change.');
        pushService.subscribeUser().then(() => {
          settingsService.updateSettings({ notificationsEnabled: true });
        }).catch(err => console.error("Failed to auto-subscribe after permission change:", err));
      }
    }

    const lastUserName = authService.getUserName();
    if(lastUserName) {
      setUserNameInput(lastUserName);
    }

    // Check for existing user session on initial page load
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
        handleJoinGame(gameCode);
      } else {
        setCurrentView('lobby');
      }
    }

    const handlePopState = () => {
      const path = window.location.pathname;
      const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
      if (gameIdMatch) {
        if(isLoggedIn) {
          const gameCode = gameIdMatch[1];
          handleJoinGame(gameCode);
        }
      } else {
        navigateToLobby();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // This effect manages socket listeners based on login state
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleGameStateUpdate = (payload: unknown) => {
      setGameState(payload as ClientGameStatePayload);
    };
    const handleCounterUpdate = (payload: unknown) => {
      const update = payload as { newCount: number };
      setGameState((prev: ClientGameStatePayload | null) => prev ? { ...prev, gameState: { ...prev.gameState, placeholderCounter: update.newCount } } : null);
    };
    const handleStatusUpdate = (status: ConnectionStatus) => {
      setConnectionStatus(status);
    };

    socketService.on('game:state_update', handleGameStateUpdate);
    socketService.on('game:counter_update', handleCounterUpdate);
    socketService.onStatus(handleStatusUpdate);

    return () => {
      // Cleanup listeners on component unmount
      socketService.off('game:state_update', handleGameStateUpdate);
      socketService.off('game:counter_update', handleCounterUpdate);
      socketService.offStatus(handleStatusUpdate);
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
      const response = await fetch(API_ROUTES.LOGIN, {
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
        
        // It's important to set the state that indicates the user is logged in *before*
        // we proceed, as other effects may depend on this.
        setCurrentUserId(data.userId);
        setCurrentUserName(data.userName);
        setIsLoggedIn(true);
        setUserNameInput('');
        
        // Now, perform the post-login actions like checking notifications and navigating.
        await checkNotificationStatusAndProceed(() => {
          const path = window.location.pathname;
          const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
          if (gameIdMatch) {
            const gameCode = gameIdMatch[1];
            handleJoinGame(gameCode);
          } else {
            navigateToLobby();
          }
        });
        
      } else {
        setAuthError(data.message || 'Authentication failed.');
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
      console.error('Auth error:', error);
    }
    setIsLoading(false);
  };

  const checkNotificationStatusAndProceed = async (onComplete: () => void) => {
    // Check if notifications are supported by the browser
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      onComplete();
      return;
    }

    const permission: NotificationPermission = Notification.permission as NotificationPermission;
    setNotificationPermission(permission); // Store the permission state
    const settings = settingsService.getSettings();

    if (permission === 'granted' && !settings.notificationsEnabled) {
      // Auto-subscribe user since they already gave permission
      try {
        await pushService.subscribeUser();
        settingsService.updateSettings({ notificationsEnabled: true });
      } catch (error) {
        console.error("Failed to auto-subscribe user:", error);
      }
      onComplete(); // Proceed regardless of subscription success
    } else if (permission === 'prompt' || permission === 'default' || (permission === 'denied' && !settings.notificationsEnabled)) {
      // Show the prompt dialog if it hasn't been asked, or if it was denied and our in-app setting is off.
      if (permission === 'denied') {
        // Set the flag so we know to check for changes on next load
        sessionStorage.setItem(NOTIFICATION_PENDING_KEY, 'true');
      }
      setAfterPromptAction(() => onComplete);
      setShowNotificationsPrompt(true);
    } else {
      // Permission is 'denied' or already granted and enabled, just proceed
      onComplete();
    }
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
    // Aggressively check for notification permission inconsistencies
    if ('Notification' in window) {
      const permission = Notification.permission;
      const settings = settingsService.getSettings();

      if (permission === 'denied' && settings.notificationsEnabled) {
        console.log('[Permissions] Notification permission has been revoked. Updating app settings.');
        settingsService.updateSettings({ notificationsEnabled: false });
      }
    }
    
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
      if (currentGameId && gameState) {
          const turnId = `${gameState.turnNumber}-${gameState.currentPlayerId}`;
          socketService.sendMessage('game:end_turn', { gameId: currentGameId, turnId });
      }
  };

  const handleToggleDebugInfo = () => {
    setIsDebugInfoOpen(!isDebugInfoOpen);
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
          <>
            <GameContainer
              gameState={gameState}
              onIncrementCounter={handleIncrementCounter}
              onEndTurn={handleEndTurn}
              connectionStatus={connectionStatus}
              isMyTurn={isMyTurn}
            />
            {isDebugInfoOpen && (
              <Dialog title="Debug Game State" onClose={handleToggleDebugInfo}>
                <div className={styles.debugContent}>
                  <pre>
                    {gameState ? JSON.stringify(gameState, null, 2) : 'No game state available.'}
                  </pre>
                </div>
              </Dialog>
            )}
          </>
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
          <Button onClick={handleToggleDebugInfo} variant="icon" aria-label="Show Debug Info">
            <i class="hbi hbi-terminal"></i>
          </Button>
          <Button onClick={handleEndTurn} variant="secondary" disabled={!isMyTurn || connectionStatus !== 'connected'}>End Turn</Button>
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
    
    if (showNotificationsPrompt) {
      return (
        <EnableNotificationsDialog 
            permissionState={notificationPermission}
            onComplete={() => {
                setShowNotificationsPrompt(false);
                if (afterPromptAction) {
                  afterPromptAction();
                }
            }}
        />
      );
    }

    return renderLoggedInView();
  };

  const isMyTurn = gameState?.currentPlayerId === currentUserId;

  return (
    <div className={styles.appContainer}>
      {viewToRender()}
      <p className={styles.versionDisplay}>Version: <span id="appVersionDisplay">{version}</span></p>
    </div>
  );
}
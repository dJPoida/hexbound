import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import htm from 'htm';
import './global.css'; // Import global styles
import styles from './App.module.css'; // Import CSS Modules
import { UserLogin } from './components/UserLogin/UserLogin';
import { authService } from './services/auth.service';
import { authenticatedFetch } from './services/api.service';
import { socketService } from './services/socket.service';
import { ClientGameStatePayload, GameTurnEndedPayload } from '../shared/types/socket.types';
import { GameListItem } from '../shared/types/game.types';
import { GameViewLayout } from './components/GameViewLayout/GameViewLayout';
import { LobbyLayout } from './components/LobbyLayout/LobbyLayout';
import { ActionBar } from './components/ActionBar/ActionBar';
import { Button } from './components/Button/Button';
import { Dialog } from './components/Dialog/Dialog';
import { API_ROUTES } from '../shared/constants/api.const';
import { EnableNotificationsDialog } from './components/EnableNotificationsDialog/EnableNotificationsDialog';
import { settingsService } from './services/settings.service';
import { pushService } from './services/push.service';
import type { NotificationPermission } from './components/GameSettingsDialog/GameSettingsDialog';
import { GameHeader } from './components/Header/GameHeader';
import { GameContainer } from './components/GameContainer/GameContainer';
import { GameSettingsDialog } from './components/GameSettingsDialog/GameSettingsDialog';
import { IncrementCounterDialog } from './components/IncrementCounterDialog/IncrementCounterDialog';

const NOTIFICATION_PENDING_KEY = 'hexbound-notifications-pending-activation';
type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type DialogType = 'gameSettings' | 'incrementCounter' | 'debugInfo';

// Initialize htm with Preact's h function
htm.bind(h);

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
  const [myGames, setMyGames] = useState<GameListItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isDebugInfoOpen, setIsDebugInfoOpen] = useState(false);
  const [isCounterDialogOpen, setIsCounterDialogOpen] = useState(false);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // UI State
  const [dialogStack, setDialogStack] = useState<DialogType[]>([]);

  const [afterPromptAction, setAfterPromptAction] = useState<() => void>(() => {});

  const pushDialog = (dialog: DialogType) => {
    // Prevent pushing the same dialog if it's already at the top of the stack
    if (dialogStack[dialogStack.length - 1] === dialog) {
      return;
    }
    setDialogStack([...dialogStack, dialog]);
  };
  const popDialog = () => setDialogStack(dialogStack.slice(0, -1));
  const replaceDialog = (dialog: DialogType) => setDialogStack([...dialogStack.slice(0, -1), dialog]);
  const clearDialogs = () => setDialogStack([]);

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

    const syncNotificationPermission = () => {
      if ('Notification' in window && settingsService.getSettings().notificationsEnabled && Notification.permission === 'denied') {
        console.log('[Permissions] Notification permission has been revoked by the user. Updating app settings.');
        settingsService.updateSettings({ notificationsEnabled: false });
      }
    };

    // Run on initial load
    syncNotificationPermission();
    
    // Run whenever the tab becomes visible again
    document.addEventListener('visibilitychange', syncNotificationPermission);

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
      document.removeEventListener('visibilitychange', syncNotificationPermission);
    };
  }, []);

  // This effect manages socket listeners based on login state
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleGameStateUpdate = (payload: ClientGameStatePayload) => {
      console.log('[App] Received game state update:', payload);
      setGameState(payload);
    };

    const handleCounterUpdate = (payload: { value: number }) => {
      setGameState(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          gameState: {
            ...prevState.gameState,
            placeholderCounter: payload.value
          }
        };
      });
    };

    const handleTurnEnded = (payload: GameTurnEndedPayload) => {
      console.log('[App] Received game turn ended:', payload);
      setGameState(prevState => {
        if (!prevState || prevState.gameId !== payload.gameId) return prevState;
        return {
          ...prevState,
          currentPlayerId: payload.nextPlayerId,
          turnNumber: payload.turnNumber,
        };
      });
    };

    const handleStatusUpdate = (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => {
      setConnectionStatus(status);
    };

    socketService.on('game:state_update', handleGameStateUpdate);
    socketService.on('game:counter_update', handleCounterUpdate);
    socketService.on('game:turn_ended', handleTurnEnded);
    socketService.onStatus(handleStatusUpdate);

    return () => {
      socketService.off('game:state_update', handleGameStateUpdate);
      socketService.off('game:counter_update', handleCounterUpdate);
      socketService.off('game:turn_ended', handleTurnEnded);
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
    clearDialogs();
    authService.clearAuthToken();
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setCurrentUserName(null);
  };

  const navigateToGame = (gameId: string, gameCode: string) => {
    // Run the sync check upon navigation
    const syncNotificationPermission = () => {
      if ('Notification' in window && settingsService.getSettings().notificationsEnabled && Notification.permission === 'denied') {
        console.log('[Permissions] Notification permission has been revoked by the user. Updating app settings.');
        settingsService.updateSettings({ notificationsEnabled: false });
      }
    };
    syncNotificationPermission();
    
    clearDialogs();
    setCurrentGameId(gameId);
    setCurrentView('game');
    socketService.connect(gameId);
    window.history.pushState({ gameId }, '', `/game/${gameCode}`);
  };

  const navigateToLobby = () => {
    if (currentGameId) {
      socketService.sendMessage('game:unsubscribe', { gameId: currentGameId });
    }
    clearDialogs();
    socketService.disconnect();
    setCurrentGameId(null);
    setGameState(null);
    setCurrentView('lobby');
    setIsGameLoaded(false);
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

  const handleToggleCounterDialog = () => {
    setIsCounterDialogOpen(!isCounterDialogOpen);
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const renderLoggedInView = () => {
    const currentDialogType = dialogStack[dialogStack.length - 1];
    let dialogComponent = null;

    switch (currentDialogType) {
      case 'gameSettings':
        dialogComponent = <GameSettingsDialog onClose={popDialog} />;
        break;
      case 'incrementCounter':
        if (gameState) {
          dialogComponent = (
            <IncrementCounterDialog
              counter={gameState.gameState.placeholderCounter ?? 0}
              isMyTurn={gameState.currentPlayerId === currentUserId}
              onIncrement={handleIncrementCounter}
              onClose={popDialog}
              onOpenSettings={() => replaceDialog('gameSettings')}
            />
          );
        }
        break;
      case 'debugInfo':
        if (gameState) {
          dialogComponent = (
            <Dialog title="Debug Game State" onClose={popDialog}>
              <div className={styles.debugContent}>
                <pre>
                  {JSON.stringify(gameState, null, 2)}
                </pre>
              </div>
            </Dialog>
          );
        }
        break;
    }

    if (currentView === 'lobby') {
      return (
        <LobbyLayout
          currentUserName={currentUserName}
          onLogout={handleLogout}
          onNavigateToGame={navigateToGame}
          onCreateNewGame={handleCreateNewGame}
          myGames={myGames}
          currentUserId={currentUserId}
          onOpenSettings={() => pushDialog('gameSettings')}
          dialog={dialogComponent}
        />
      );
    }
  
    if (currentView === 'game' && gameState) {
      return (
        <GameViewLayout
          gameState={gameState}
          isMapReady={isGameLoaded}
          onReady={() => setIsGameLoaded(true)}
          onLogout={handleLogout}
          onNavigateToLobby={navigateToLobby}
          onEndTurn={handleEndTurn}
          onPushDialog={pushDialog}
          isMyTurn={gameState.currentPlayerId === currentUserId}
          currentUserName={currentUserName}
          dialog={dialogComponent}
        />
      );
    }

    return null; // Should not happen if logic is correct
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

    return (
      <>
        {renderLoggedInView()}
      </>
    );
  };

  return (
    <div className={styles.appContainer}>
      {viewToRender()}
      <p className={styles.versionDisplay}>Version: <span id="appVersionDisplay">{version}</span></p>
    </div>
  );
}
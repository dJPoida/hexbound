import './global.css'; // Import global styles

import { useEffect,useState } from 'preact/hooks';

import styles from './App.module.css'; // Import CSS Modules
import { UnifiedRouter } from './components/framework/UnifiedRouter';
import { EnableNotificationsDialog } from './components/game/EnableNotificationsDialog/EnableNotificationsDialog';
import { GameSettingsDialog } from './components/game/GameSettingsDialog/GameSettingsDialog';
import { IncrementCounterDialog } from './components/game/IncrementCounterDialog/IncrementCounterDialog';
import { UserLogin } from './components/lobby/UserLogin/UserLogin';
import { Dialog } from './components/ui/Dialog/Dialog';
import { 
  AuthProvider, 
  DialogProvider, 
  type DialogType,
  GameProvider, 
  NavigationProvider, 
  NotificationProvider,
  useAuth,
  useDialogs,
  useGame,
  useNavigation,
  useNotifications} from './contexts';

// App Content Component (wrapped by providers)
const AppContent = () => {
  const auth = useAuth();
  const game = useGame();
  const dialogs = useDialogs();
  const navigation = useNavigation();
  const notifications = useNotifications();

  // Version state
  const [version, setVersion] = useState('LOADING...');

  // Initialize version
  useEffect(() => {
    const appVersionFromEnv = import.meta.env.VITE_APP_VERSION;
    if (appVersionFromEnv) {
      setVersion(appVersionFromEnv);
    } else {
      fetch('/api/version')
        .then(res => res.json())
        .then(data => setVersion(data.version || 'N/A (dev)'))
        .catch(() => setVersion('N/A (fetch error)'));
    }
  }, []);

  // Handle post-login logic
  useEffect(() => {
    if (auth.isLoggedIn) {
      const handlePostLogin = async () => {
        await notifications.checkNotificationStatusAndProceed(() => {
          const path = window.location.pathname;
          const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
          if (gameIdMatch) {
            const gameCode = gameIdMatch[1];
            navigation.handleJoinGame(gameCode);
          } else {
            navigation.navigate('/');
          }
        });
      };
      handlePostLogin();
    }
  }, [auth.isLoggedIn]);

  // Handle enhanced login with notification check
  const handleEnhancedLogin = async () => {
    await auth.login();
    // Post-login logic is handled by the useEffect above
  };

  // Handle enhanced logout
  const handleEnhancedLogout = () => {
    navigation.navigate('/');
    dialogs.clearDialogs();
    auth.logout();
  };

  // Handle create new game
  const handleCreateNewGame = async () => {
    const result = await game.createNewGame();
    if (result) {
      navigation.navigateToGame(result.gameId, result.gameCode);
    }
  };

  // Render dialog content
  const renderDialogContent = () => {
    const currentDialogType = dialogs.getCurrentDialog();
    if (!currentDialogType) return null;

    switch (currentDialogType) {
      case 'gameSettings':
        return <GameSettingsDialog onClose={dialogs.popDialog} />;
      case 'incrementCounter':
        if (game.gameState) {
          const hasPlaceholders = game.gameState.players.some(p => p.isPlaceholder);
          return (
            <IncrementCounterDialog
              counter={game.gameState.gameState.placeholderCounter ?? 0}
              isMyTurn={game.gameState.currentPlayerId === auth.currentUserId}
              onIncrement={game.incrementCounter}
              onClose={dialogs.popDialog}
              onOpenSettings={() => dialogs.replaceDialog('gameSettings')}
              hasPlaceholders={hasPlaceholders}
            />
          );
        }
        return null;
      case 'debugInfo':
        if (game.gameState) {
          return (
            <Dialog title="Debug Game State" onClose={dialogs.popDialog}>
              <div className={styles.debugContent}>
                <pre>
                  {JSON.stringify(game.gameState, null, 2)}
                </pre>
              </div>
            </Dialog>
          );
        }
        return null;
      default:
        return null;
    }
  };

  // Render main content
  const renderMainContent = () => {
    if (!auth.isLoggedIn) {
      return (
        <UserLogin 
          userNameInput={auth.userNameInput}
          onUserNameInputChange={auth.setUserNameInput}
          onLogin={handleEnhancedLogin}
          isLoading={auth.isLoading}
          error={auth.authError}
        />
      );
    }
    
    if (notifications.showNotificationsPrompt) {
      return (
        <EnableNotificationsDialog 
          permissionState={notifications.notificationPermission}
          onComplete={notifications.handleNotificationPromptComplete}
        />
      );
    }

    return (
      <UnifiedRouter
        className={styles.appLayout}
        currentUserName={auth.currentUserName}
        currentUserId={auth.currentUserId}
        myGames={game.myGames}
        gameState={game.gameState}
        isGameLoaded={game.isGameLoaded}
        onNavigate={navigation.navigate}
        onLogout={handleEnhancedLogout}
        onOpenSettings={() => dialogs.pushDialog('gameSettings')}
        onJoinGame={navigation.navigateToGame}
        onCreateNewGame={handleCreateNewGame}
        onEndTurn={game.endTurn}
        onPushDialog={dialogs.pushDialog}
        onGameReady={() => game.setGameLoaded(true)}
        dialog={renderDialogContent()}
      />
    );
  };

  return (
    <div className={styles.appContainer}>
      {renderMainContent()}
      <p className={styles.versionDisplay}>
        Version: <span id="appVersionDisplay">{version}</span>
      </p>
    </div>
  );
};

// Main App Component with all providers
export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DialogProvider>
          <GameProvider>
            <NavigationProvider>
              <AppContent />
            </NavigationProvider>
          </GameProvider>
        </DialogProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
import './global.css'; // Import global styles

import { useEffect,useState } from 'preact/hooks';

import styles from './App.module.css'; // Import CSS Modules
import { UnifiedRouter } from './components/framework/UnifiedRouter';
import { DevToolsDialog } from './components/game/DevToolsDialog';
import { EnableNotificationsDialog } from './components/game/EnableNotificationsDialog/EnableNotificationsDialog';
import { GameSettingsDialog } from './components/game/GameSettingsDialog/GameSettingsDialog';
import { IncrementCounterDialog } from './components/game/IncrementCounterDialog/IncrementCounterDialog';
import { UserLoginView } from './components/views/UserLoginView/UserLoginView';
import { 
  AuthProvider, 
  DialogProvider, 
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
    const currentDialog = dialogs.getCurrentDialog();
    
    switch (currentDialog) {
      case 'gameSettings':
        return (
          <GameSettingsDialog 
            onClose={() => dialogs.popDialog()}
          />
        );
      case 'incrementCounter':
        if (game.gameState) {
          const hasPlaceholders = game.gameState.players.some(p => p.isPlaceholder);
          return (
            <IncrementCounterDialog 
              counter={game.gameState.gameState.placeholderCounter ?? 0}
              isMyTurn={game.gameState.currentPlayerId === auth.currentUserId}
              hasPlaceholders={hasPlaceholders}
              onClose={() => dialogs.popDialog()}
              onIncrement={game.incrementCounter}
            />
          );
        }
        return null;
      case 'debugInfo':
        if (game.gameState) {
          return (
            <DevToolsDialog 
              gameState={game.gameState}
              onClose={() => dialogs.popDialog()}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  // Don't render anything until authentication state is determined
  if (auth.isInitializing) {
    return (
      <div className={styles.appContainer}>
        <div className={styles.loadingContainer}>
          <p className={styles.versionDisplay}>
            Version: <span id="appVersionDisplay">{version}</span>
          </p>
        </div>
      </div>
    );
  }

  // Render main content
  const renderMainContent = () => {
    if (!auth.isLoggedIn) {
      return (
        <UserLoginView 
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
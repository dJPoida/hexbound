import { ComponentChildren, createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';

import { renderingService } from '../services/rendering.service';
import { settingsService } from '../services/settings.service';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthProvider';
import { useDialogs } from './DialogProvider';
import { useGame } from './GameProvider';

interface NavigationContextType {
  // Actions
  navigate: (path: string, gameData?: { gameId: string; gameCode: string }) => void;
  navigateToGame: (gameId: string, gameCode: string) => void;
  handleJoinGame: (gameCode: string) => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ComponentChildren;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const { isLoggedIn } = useAuth();
  const { joinGame, setCurrentGameId, setGameLoaded, currentGameId } = useGame();
  const { clearDialogs } = useDialogs();

  // Handle join game logic
  const handleJoinGame = async (gameCode: string) => {
    const result = await joinGame(gameCode);
    if (result) {
      navigateToGame(result.gameId, result.gameCode);
    } else {
      navigate('/'); // Navigate to lobby on failure
    }
  };

  // Unified navigation function
  const navigate = (path: string, gameData?: { gameId: string; gameCode: string }) => {
    // Run permission sync on any navigation
    const syncNotificationPermission = () => {
      if ('Notification' in window && settingsService.getSettings().notificationsEnabled && Notification.permission === 'denied') {
        console.log('[Permissions] Notification permission has been revoked by the user. Updating app settings.');
        settingsService.updateSettings({ notificationsEnabled: false });
      }
    };
    syncNotificationPermission();
    
    clearDialogs();

    // Handle game navigation
    if (path.startsWith('/game/') && gameData) {
      setCurrentGameId(gameData.gameId);
      socketService.connect(gameData.gameId);
      window.history.pushState({ gameId: gameData.gameId }, '', path);
    } else {
      // Handle non-game navigation (lobby, utils, styleguide)
      // Clean up game state if leaving a game
      if (currentGameId) {
        socketService.sendMessage('game:unsubscribe', { gameId: currentGameId });
        socketService.disconnect();
        renderingService.destroy(); // Clean up rendering service
        setCurrentGameId(null);
        setGameLoaded(false);
      }
      window.history.pushState({}, '', path);
    }
    
    window.dispatchEvent(new Event('pushstate'));
  };

  // Convenience function for game navigation
  const navigateToGame = (gameId: string, gameCode: string) => {
    navigate(`/game/${gameCode}`, { gameId, gameCode });
  };

  // Handle initial routing and popstate events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
      if (gameIdMatch) {
        if (isLoggedIn) {
          const gameCode = gameIdMatch[1];
          handleJoinGame(gameCode);
        }
      } else {
        // For lobby routes (/, /utils, /styleguide), ensure we clean up any game state
        if (!path.startsWith('/game/')) {
          // Clean up game state if navigating away from game
          if (currentGameId) {
            socketService.sendMessage('game:unsubscribe', { gameId: currentGameId });
            socketService.disconnect();
            renderingService.destroy(); // Clean up rendering service
            setCurrentGameId(null);
            setGameLoaded(false);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn]);

  // Handle initial page load routing
  useEffect(() => {
    if (isLoggedIn) {
      const path = window.location.pathname;
      const gameIdMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
      if (gameIdMatch) {
        const gameCode = gameIdMatch[1];
        handleJoinGame(gameCode);
      }
    }
  }, [isLoggedIn]);

  const navigationValue: NavigationContextType = {
    navigate,
    navigateToGame,
    handleJoinGame,
  };

  return (
    <NavigationContext.Provider value={navigationValue}>
      {children}
    </NavigationContext.Provider>
  );
}; 
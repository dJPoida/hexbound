import { ComponentChildren, createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import { GameListItem, MapData } from '../../shared/types/game.types';
import { ClientGameStatePayload, GameTurnEndedPayload, MapUpdatePayload } from '../../shared/types/socket.types';
import { authenticatedFetch } from '../services/api.service';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthProvider';

interface GameContextType {
  // State
  myGames: GameListItem[];
  currentGameId: string | null;
  gameState: ClientGameStatePayload | null;
  mapData: MapData | null;
  mapChecksum: string | null;
  isGameLoaded: boolean;

  // Actions
  fetchMyGames: () => Promise<void>;
  createNewGame: () => Promise<{ gameId: string; gameCode: string } | null>;
  joinGame: (gameCode: string) => Promise<{ gameId: string; gameCode: string } | null>;
  setCurrentGameId: (gameId: string | null) => void;
  setGameLoaded: (loaded: boolean) => void;
  updateMapData: (mapData: MapData | null, checksum: string | null) => void;
  incrementCounter: () => void;
  endTurn: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ComponentChildren;
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const { isLoggedIn, currentUserId } = useAuth();
  const [myGames, setMyGames] = useState<GameListItem[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameStatePayload | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [mapChecksum, setMapChecksum] = useState<string | null>(null);
  const [isGameLoaded, setIsGameLoaded] = useState(false);

  // Fetch user's games
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

  // Create new game
  const createNewGame = async () => {
    try {
      const response = await authenticatedFetch('/api/games', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Game created successfully:', data);
        // Refresh the game list after creating a new game
        fetchMyGames();
        return { gameId: data.gameId, gameCode: data.gameCode };
      } else {
        console.error('Failed to create game:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  };

  // Join a game by code
  const joinGame = async (gameCode: string) => {
    try {
      const joinResponse = await authenticatedFetch(`/api/games/${gameCode}/join`, {
        method: 'POST',
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        console.error('Failed to join game:', errorData.message);
        return null;
      }
      
      const joinData = await joinResponse.json();
      return { gameId: joinData.gameId, gameCode };
    } catch (error) {
      console.error('Error joining game:', error);
      return null;
    }
  };

  // Game actions
  const incrementCounter = () => {
    if (currentGameId) {
      socketService.sendMessage('game:increment_counter', { gameId: currentGameId });
    }
  };

  const endTurn = () => {
    if (currentGameId && gameState) {
      const turnId = `${gameState.turnNumber}-${gameState.currentPlayerId}`;
      socketService.sendMessage('game:end_turn', { gameId: currentGameId, turnId });
    }
  };

  const setGameLoaded = (loaded: boolean) => {
    setIsGameLoaded(loaded);
  };

  const updateCurrentGameId = (gameId: string | null) => {
    setCurrentGameId(gameId);
    // Clear map data when leaving a game
    if (!gameId) {
      updateMapData(null, null);
    }
  };

  const updateMapData = (newMapData: MapData | null, newChecksum: string | null) => {
    setMapData(newMapData);
    setMapChecksum(newChecksum);
  };

  // Socket event handlers
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleGameStateUpdate = (payload: ClientGameStatePayload) => {
      console.log('[GameProvider] Received game state update:', payload);
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
      console.log('[GameProvider] Received game turn ended:', payload);
      setGameState(prevState => {
        if (!prevState || prevState.gameId !== payload.gameId) return prevState;
        return {
          ...prevState,
          currentPlayerId: payload.nextPlayerId,
          turnNumber: payload.turnNumber,
        };
      });
    };

    const handleMapUpdate = (payload: MapUpdatePayload) => {
      console.log('[GameProvider] Received map update:', payload);
      // Accept map data if it matches current game or if no current game is set (initial connection)
      if (!currentGameId || payload.gameId === currentGameId) {
        updateMapData(payload.mapData, payload.checksum);
      }
    };

    socketService.on('game:state_update', handleGameStateUpdate);
    socketService.on('game:map_update', handleMapUpdate);
    socketService.on('game:counter_update', handleCounterUpdate);
    socketService.on('game:turn_ended', handleTurnEnded);

    return () => {
      socketService.off('game:state_update', handleGameStateUpdate);
      socketService.off('game:map_update', handleMapUpdate);
      socketService.off('game:counter_update', handleCounterUpdate);
      socketService.off('game:turn_ended', handleTurnEnded);
    };
  }, [isLoggedIn, currentGameId]);

  // Game list polling
  useEffect(() => {
    if (!isLoggedIn) return;

    // Fetch games when user logs in
    fetchMyGames();

    // Set up polling every 60 seconds
    const pollInterval = setInterval(fetchMyGames, 60000);

    // Clean up polling when user logs out or component unmounts
    return () => clearInterval(pollInterval);
  }, [isLoggedIn]);

  const gameValue: GameContextType = {
    myGames,
    currentGameId,
    gameState,
    mapData,
    mapChecksum,
    isGameLoaded,
    fetchMyGames,
    createNewGame,
    joinGame,
    setCurrentGameId: updateCurrentGameId,
    setGameLoaded,
    updateMapData,
    incrementCounter,
    endTurn,
  };

  return (
    <GameContext.Provider value={gameValue}>
      {children}
    </GameContext.Provider>
  );
}; 
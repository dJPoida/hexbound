import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import htm from 'htm';
import { authenticatedFetch } from '../../../services/api.service';
import { GameListItem } from '../../../../shared/types/game.types';
import { LobbyLayout } from '../../LobbyLayout/LobbyLayout';
import { LobbyView } from '../../LobbyView/LobbyView';
import { GameSettingsDialog } from '../../GameSettingsDialog/GameSettingsDialog';
import { StyleGuidePage } from '../StyleGuidePage/StyleGuidePage';
import { UtilsPage } from '../UtilsPage/UtilsPage';

const html = htm.bind(h);

type DialogType = 'gameSettings';
type LobbyView = 'lobby' | 'styleguide' | 'utils';

interface LobbyPageProps {
  currentUserName: string | null;
  currentUserId: string | null;
  onLogout: () => void;
  onNavigateToGame: (gameId: string, gameCode: string) => void;
  onCreateNewGame: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

export function LobbyPage({
  currentUserName,
  currentUserId,
  onLogout,
  onNavigateToGame,
  onCreateNewGame,
  isLoading,
  authError
}: LobbyPageProps) {
  const [myGames, setMyGames] = useState<GameListItem[]>([]);
  const [currentView, setCurrentView] = useState<LobbyView>('lobby');
  const [dialogStack, setDialogStack] = useState<DialogType[]>([]);

  const pushDialog = (dialog: DialogType) => {
    if (dialogStack[dialogStack.length - 1] === dialog) {
      return;
    }
    setDialogStack([...dialogStack, dialog]);
  };

  const popDialog = () => setDialogStack(dialogStack.slice(0, -1));

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

  const handleCreateNewGame = async () => {
    await onCreateNewGame();
    // Refresh the game list after creating a new game
    fetchMyGames();
  };

  const navigateToStyleGuide = () => {
    setCurrentView('styleguide');
  };

  const navigateToUtils = () => {
    setCurrentView('utils');
  };

  const navigateToLobby = () => {
    setCurrentView('lobby');
  };

  // Fetch games when component mounts
  useEffect(() => {
    fetchMyGames();

    // Set up an interval to poll every 60 seconds
    const pollInterval = setInterval(fetchMyGames, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(pollInterval);
  }, []);

  // Render the current dialog if any
  const renderDialog = () => {
    const currentDialogType = dialogStack[dialogStack.length - 1];
    
    switch (currentDialogType) {
      case 'gameSettings':
        return <GameSettingsDialog onClose={popDialog} />;
      default:
        return null;
    }
  };

  // Render the main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case 'lobby':
        return (
          <LobbyView 
            onNavigateToGame={onNavigateToGame}
            onCreateNewGame={handleCreateNewGame}
            myGames={myGames}
            currentUserId={currentUserId}
          />
        );
      case 'styleguide':
        return <StyleGuidePage />;
      case 'utils':
        return <UtilsPage />;
      default:
        return null;
    }
  };

  return (
    <LobbyLayout
      currentUserName={currentUserName}
      onLogout={onLogout}
      onOpenSettings={() => pushDialog('gameSettings')}
      onNavigateToStyleGuide={navigateToStyleGuide}
      onNavigateToUtils={navigateToUtils}
      dialog={renderDialog()}
    >
      {renderMainContent()}
    </LobbyLayout>
  );
} 
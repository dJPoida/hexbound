import { useRef } from 'preact/hooks';
import { Game, Player } from '../../../shared/types/game.types';
import { Button } from '../Button/Button';
import styles from './LobbyView.module.css';
import inputStyles from '../../App.module.css';
import { Dialog } from '../Dialog/Dialog';

interface LobbyViewProps {
  onNavigateToGame: (gameId: string, gameCode: string) => void;
  onCreateNewGame: () => void;
  myGames: Game[];
  currentUserId: string | null;
}

export function LobbyView({ onNavigateToGame, onCreateNewGame, myGames, currentUserId }: LobbyViewProps) {
  const gameCodeInputRef = useRef<HTMLInputElement>(null);

  const handleJoinByCode = () => {
    const gameCode = gameCodeInputRef.current?.value.trim();
    if (gameCode) {
      // This will be handled by App.tsx which will fetch the game by code
      // For now, we'll just push a new history state and let App.tsx handle it on load
      // A more robust solution might involve a direct API call here.
      window.history.pushState({ gameCode }, '', `/game/${gameCode}`);
      window.dispatchEvent(new PopStateEvent('popstate')); // Manually trigger router change
    } else {
      console.log('Join by Code: No game code entered');
    }
  };

  const footerContent = (
    <div className={styles.lobbyActions}>
      <Button
        onClick={onCreateNewGame}
        variant="primary"
        fullWidth={true}
      >
        Create New Game
      </Button>
      <div className={styles.joinByIdContainer}>
        <input 
          type="text" 
          ref={gameCodeInputRef}
          className={inputStyles.input}
          placeholder="Paste Game Code" 
        />
        <Button
          onClick={handleJoinByCode}
          variant="secondary"
        >
          Join
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog title="Game Lobby" footer={footerContent}>
      <div className={styles.lobbySection}>
        {myGames.length === 0 ? (
          <p className={styles.noGamesMessage}>You are not currently in any games.</p>
        ) : (
          <ul className={styles.gameList}>
            {myGames.map(game => {
              const isMyTurn = game.currentPlayerId === currentUserId;
              return (
                <li key={game.gameId} className={styles.gameListItem}>
                  <div className={styles.gameInfoContainer}>
                    <span className={styles.gameCode}>{game.gameCode}</span>
                    <div className={styles.gameMeta}>
                      <span className={styles.playerCount}>
                        Players: {
                          (Array.isArray(game.players) ? game.players : Object.values(game.players) as Player[])
                            .map((p: Player) => p.userName)
                            .join(', ')
                        }
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onNavigateToGame(game.gameId, game.gameCode)}
                    variant={isMyTurn ? "primary" : "secondary"}
                  >
                    {isMyTurn ? "Your Turn" : "Open"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
} 
import { useRef } from 'preact/hooks';
import { Game, Player } from '../../../shared/types/game.types';
import { Button } from '../Button/Button';
import styles from './LobbyView.module.css';
import inputStyles from '../../App.module.css';

interface LobbyViewProps {
  onNavigateToGame: (gameId: string) => void;
  onCreateNewGame: () => void;
  myGames: Game[];
}

export function LobbyView({ onNavigateToGame, onCreateNewGame, myGames }: LobbyViewProps) {
  const gameIdInputRef = useRef<HTMLInputElement>(null);

  const handleJoinById = () => {
    const gameId = gameIdInputRef.current?.value.trim();
    if (gameId) {
      onNavigateToGame(gameId);
    } else {
      console.log('Join by ID: No game ID entered');
    }
  };

  return (
    <div className={styles.lobbyContainer}>
      <h2 className={styles.lobbyTitle}>Lobby</h2>

      <div className={styles.lobbySection}>
        <h3 className={styles.sectionTitle}>Your Active Games</h3>
        {myGames.length === 0 ? (
          <p className={styles.noGamesMessage}>You are not currently in any games.</p>
        ) : (
          <ul className={styles.gameList}>
            {myGames.map(game => (
              <li key={game.gameId} className={styles.gameListItem}>
                <div className={styles.gameInfoContainer}>
                  <span className={styles.gameCode}>{game.gameCode}</span>
                  <div className={styles.gameMeta}>
                    <span className={styles.turnCount}>Turn: {game.currentTurn}</span>
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
                  onClick={() => onNavigateToGame(game.gameId)}
                  variant="secondary"
                >
                  Join
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.lobbySection}>
        <h3 className={styles.sectionTitle}>Start or Join a Game</h3>
        <Button
          onClick={onCreateNewGame}
          variant="primary"
        >
          Create New Game
        </Button>
        <div className={styles.joinByIdContainer}>
          <input 
            type="text" 
            ref={gameIdInputRef}
            className={inputStyles.input}
            placeholder="Paste Game Code or ID" 
          />
          <Button
            onClick={handleJoinById}
            variant="secondary"
          >
            Join by ID
          </Button>
        </div>
      </div>
    </div>
  );
} 
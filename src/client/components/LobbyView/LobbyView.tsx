import { useState } from 'preact/hooks';
import { JSX } from 'preact/jsx-runtime';
import { GameListItem, Player } from '../../../shared/types/game.types';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Text } from '../Typography/Text';
import styles from './LobbyView.module.css';
import { Logo } from '../Logo/Logo';

interface LobbyViewProps {
  onNavigateToGame: (gameId: string, gameCode: string) => void;
  onCreateNewGame: () => void;
  myGames: GameListItem[];
  currentUserId: string | null;
}

export function LobbyView({ onNavigateToGame, onCreateNewGame, myGames, currentUserId }: LobbyViewProps) {
  const [gameCode, setGameCode] = useState('');

  const handleJoinByCode = () => {
    const trimmedGameCode = gameCode.trim();
    if (trimmedGameCode) {
      window.history.pushState({ gameCode: trimmedGameCode }, '', `/game/${trimmedGameCode}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleGameCodeChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    setGameCode(event.currentTarget.value);
  };

  return (
    <div className={styles.lobbyContainer}>
      <Logo />

      <div className={styles.gameListSection}>
        {myGames.length > 0 ? (
          <ul className={styles.gameList}>
            {myGames.map(game => {
              const isMyTurn = game.currentPlayerId === currentUserId;
              return (
                <li key={game.gameId} className={styles.gameListItem} onClick={() => onNavigateToGame(game.gameId, game.gameCode)}>
                  <div className={styles.gameInfoContainer}>
                    <span className={styles.gameCode}>{game.gameCode.replace(/-/g, ' ')}</span>
                    <span className={styles.playerCount}>
                      Players: {(Array.isArray(game.players) ? game.players : Object.values(game.players) as Player[])
                          .map((p: Player) => p.userName)
                          .join(', ')}
                    </span>
                  </div>
                  {isMyTurn && <div className={styles.turnIndicator}>Your Turn</div>}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.noGamesMessage}>
            <Text color="subtle">You have no active games</Text>
          </div>
        )}
      </div>

      <div className={styles.actionsSection}>
                    <Button onClick={onCreateNewGame} variant="primary" fullWidth={true}>
              Create New Game
            </Button>
        <div className={styles.joinByIdContainer}>
          <Input
            type="text"
            value={gameCode}
            onInput={handleGameCodeChange}
            placeholder="Paste Game Code"
          />
          <Button onClick={handleJoinByCode} variant="secondary"  fullWidth={true}>
            Join
          </Button>
        </div>
      </div>
    </div>
  );
} 
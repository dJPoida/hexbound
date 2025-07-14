import { useState } from 'preact/hooks';
import { JSX } from 'preact/jsx-runtime';

import { GameListItem, Player } from '../../../../shared/types/game.types';
import { Button, ButtonVariant } from '../../ui/Button';
import { Input, InputType } from '../../ui/Input';
import { Logo } from '../../ui/Logo/Logo';
import { Text } from '../../ui/Typography/Text';
import styles from './LobbyView.module.css';

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
      <div className={styles.actionsSection}>
        <div className={styles.lobbyLogo}>
          <Logo />
        </div>
        <Button onClick={onCreateNewGame} variant={ButtonVariant.PRIMARY} fullWidth={true}>
          Create New Game
        </Button>
        <div className={styles.joinByIdContainer}>
          <Input
            type={InputType.TEXT}
            value={gameCode}
            onInput={handleGameCodeChange}
            placeholder="Paste Game Code"
          />
          <Button onClick={handleJoinByCode} variant={ButtonVariant.SECONDARY} fullWidth={true}>
            Join
          </Button>
        </div>
      </div>

      <div className={styles.gameListSection}>
        {myGames.length > 0 ? (
          <ul className={styles.gameList}>
            {myGames.map(game => {
              const isMyTurn = game.currentPlayerId === currentUserId;
              return (
                <li key={game.gameId} className={styles.gameListItem}>
                  <div className={styles.gameInfoContainer}>
                    <span className={styles.gameCode}>{game.gameCode.replace(/-/g, ' ')}</span>
                    <span className={styles.playerCount}>
                      {(Array.isArray(game.players) ? game.players : Object.values(game.players) as Player[])
                          .map((p) => p.userName)
                          .join(', ')}
                    </span>
                  </div>
                  {isMyTurn && (
                    <Button 
                      onClick={() => onNavigateToGame(game.gameId, game.gameCode)}
                      variant={ButtonVariant.SECONDARY}
                      className={styles.turnButton}
                    >
                      Your Turn
                    </Button>
                  )}
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
    </div>
  );
} 
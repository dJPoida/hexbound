import { useState } from 'preact/hooks';
import { JSX } from 'preact/jsx-runtime';

import { GameListItem, Player } from '../../../../shared/types/core';
import { Button, StyleColor } from '../../ui/Button';
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
        <Button onClick={onCreateNewGame} color={StyleColor.AMBER} fullWidth={true}>
          Create New Game
        </Button>
        <div className={styles.joinByIdContainer}>
          <Input
            type={InputType.TEXT}
            value={gameCode}
            onInput={handleGameCodeChange}
            placeholder="Paste Game Code"
          />
          <Button onClick={handleJoinByCode} color={StyleColor.DEFAULT} fullWidth={true}>
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
                    <Text variant="label" font="bold" as="span" class={styles.gameCode}>
                      {game.gameCode.replace(/-/g, ' ')}
                    </Text>
                    <Text variant="caption" color="subtle" as="span" class={styles.playerCount}>
                      {(Array.isArray(game.players) ? game.players : Object.values(game.players) as Player[])
                          .map((p) => p.userName)
                          .join(', ')}
                    </Text>
                  </div>
                  <Button 
                    onClick={() => onNavigateToGame(game.gameId, game.gameCode)}
                    color={isMyTurn ? StyleColor.GREEN : StyleColor.DEFAULT}
                    className={styles.turnButton}
                  >
                    {isMyTurn ? 'Your Turn' : 'Waiting...'}
                  </Button>
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
import { h } from 'preact';
import htm from 'htm';
import { Game, Player } from '../../shared/types/game.types';

const html = htm.bind(h);

interface LobbyViewProps {
  styles: { [key: string]: string }; // From App.module.css
  onNavigateToGame: (gameId: string) => void; // New prop for navigation
  onCreateNewGame: () => void;
  myGames: Game[];
  // Props for game lists, handlers for create/join will be added later
  // e.g., myGames: Game[]; onJoinGameById: (gameId: string) => void;
}

export function LobbyView({ styles, onNavigateToGame, onCreateNewGame, myGames }: LobbyViewProps) {
  const handleJoinById = () => {
    const gameIdInput = document.getElementById('joinGameIdInput') as HTMLInputElement;
    const gameId = gameIdInput?.value.trim();
    if (gameId) {
      console.log('Join by ID clicked with input:', gameId);
      onNavigateToGame(gameId); // Navigate with the entered ID
    } else {
      console.log('Join by ID: No game ID entered');
      // Optionally, show an error message to the user
    }
  };

  return html`
    <div class=${styles.lobbyContainer}>
      <h2 class=${styles.lobbyTitle}>Lobby</h2>

      <div class=${styles.lobbySection}>
        <h3 class=${styles.sectionTitle}>Your Active Games</h3>
        ${myGames.length === 0 ? html`
          <p id="noGamesMessage">You are not currently in any games.</p>
        ` : html`
          <ul class=${styles.gameList}>
            ${myGames.map(game => html`
              <li key=${game.gameId} class=${styles.gameListItem}>
                <div class=${styles.gameInfoContainer}>
                  <span class=${styles.gameCode}>${game.gameCode}</span>
                  <div class=${styles.gameMeta}>
                    <span class=${styles.turnCount}>Turn: ${game.currentTurn}</span>
                    <span class=${styles.playerCount}>
                      Players: ${
                        (Array.isArray(game.players) ? game.players : Object.values(game.players) as Player[])
                          .map((p: Player) => p.userName)
                          .join(', ')
                      }
                    </span>
                  </div>
                </div>
                <button class=${`${styles.button} ${styles.joinButton}`} onClick=${() => onNavigateToGame(game.gameId)}>
                  Join
                </button>
              </li>
            `)}
          </ul>
        `}
      </div>

      <div class=${styles.lobbySection}>
        <h3 class=${styles.sectionTitle}>Start or Join a Game</h3>
        <button 
          class=${`${styles.button} ${styles.primaryButton}`}
          onClick=${onCreateNewGame}
        >
          Create New Game
        </button>
        
        <div class=${styles.joinByIdContainer}>
          <input 
            type="text" 
            id="joinGameIdInput" 
            class=${styles.input}
            placeholder="Paste Game Code or ID" 
          />
          <button 
            class=${styles.button}
            onClick=${handleJoinById}
          >
            Join by ID
          </button>
        </div>
      </div>
    </div>
  `;
}
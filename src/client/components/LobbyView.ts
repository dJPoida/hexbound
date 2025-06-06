import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

interface LobbyViewProps {
  styles: { [key: string]: string }; // From App.module.css
  onNavigateToGame: (gameId: string) => void; // New prop for navigation
  // Props for game lists, handlers for create/join will be added later
  // e.g., myGames: Game[]; onCreateNewGame: () => void; onJoinGameById: (gameId: string) => void;
}

export function LobbyView({ styles, onNavigateToGame }: LobbyViewProps) {
  // For now, handlers for buttons are not implemented, they will be passed as props later.
  const handleCreateNewGame = () => {
    console.log('Create New Game clicked');
    // Placeholder: In a real scenario, this would involve a server call
    // and then navigating to the new game with its ID.
    onNavigateToGame('newGameId-placeholder'); // Navigate with a placeholder ID
  };
  
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
        <p id="noGamesMessage">You are not currently in any games.</p>
        <ul class=${styles.gameList}>
          <!-- Game items will be populated here -->
        </ul>
      </div>

      <div class=${styles.lobbySection}>
        <h3 class=${styles.sectionTitle}>Start or Join a Game</h3>
        <button 
          class=${`${styles.button} ${styles.primaryButton}`}
          onClick=${handleCreateNewGame}
        >
          Create New Game
        </button>
        
        <div class=${styles.joinByIdContainer}>
          <input 
            type="text" 
            id="joinGameIdInput" 
            class=${styles.input}
            placeholder="Paste Game ID here" 
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
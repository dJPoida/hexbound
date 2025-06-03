import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

interface LobbyViewProps {
  styles: { [key: string]: string }; // From App.module.css
  // Props for game lists, handlers for create/join will be added later
  // e.g., myGames: Game[]; onCreateNewGame: () => void; onJoinGameById: (gameId: string) => void;
}

export function LobbyView({ styles }: LobbyViewProps) {
  // For now, handlers for buttons are not implemented, they will be passed as props later.
  const handleCreateNewGame = () => console.log('Create New Game clicked');
  const handleJoinById = () => console.log('Join by ID clicked with input:', (document.getElementById('joinGameIdInput') as HTMLInputElement)?.value);

  return html`
    <div id="lobbyView" style=${{ textAlign: 'left' }}>
      <h2>Lobby</h2>
      <h3>Your Active Games:</h3>
      <p id="myGamesListLoadingIndicator" style=${{ display: 'none' }}>Loading your games...</p>
      <ul id="myGamesList" style=${{ paddingLeft: '0', listStylePosition: 'inside' }}>
        <!-- Game items will be populated here -->
        <!-- Example: <li>Game XYZ (Opponent: ABC) <button class=${styles.button} data-gameid="XYZ">Join</button></li> -->
      </ul>
      <p id="noGamesMessage" style=${{ display: 'none' }}>You are not currently in any games.</p>
      
      <hr />
      <h3>Start or Join a Game:</h3>
      <button class=${styles.button} id="lobbyCreateNewGameButton" onClick=${handleCreateNewGame}>Create New Game</button>
      <div>
        <input type="text" id="joinGameIdInput" placeholder="Paste Game ID here" />
        <button class=${styles.button} id="lobbyJoinByIdButton" onClick=${handleJoinById}>Join by ID</button>
      </div>
    </div>
  `;
} 
import { h } from 'preact';
import htm from 'htm';
import { GameStateUpdatePayload } from '../../shared/types/socket.types';

const html = htm.bind(h);

interface GameContainerProps {
  styles: { [key: string]: string };
  onNavigateToLobby: () => void;
  gameState: GameStateUpdatePayload | null;
  onIncrementCounter: () => void;
  onEndTurn: () => void;
  // TODO: Add props for game state, player info, and event handlers
  // e.g., gameId: string | null;
  //       playerNumber: number | null;
  //       currentTurn: number | null;
  //       onCopyGameLink: () => void;
  //       onStartNewGame: () => void;
  //       onToggleDebug: () => void;
}

export function GameContainer({ 
  styles, 
  onNavigateToLobby,
  gameState,
  onIncrementCounter,
  onEndTurn
}: GameContainerProps) {

  const handleToggleDebug = () => {
    const debugContent = document.getElementById('debugContent');
    if (debugContent) {
      debugContent.style.display = debugContent.style.display === 'none' ? 'block' : 'none';
    }
  };

  const gameId = gameState?.gameId ?? 'Loading...';
  const gameCode = gameState?.gameCode ?? 'Loading...';
  const playerNumber = '-'; // This will need more logic to determine which player this client is
  const currentTurn = gameState?.turn ?? '-';
  const counter = gameState?.gameState.placeholderCounter ?? 0;

  return html`
    <div id="gameContainer">
      <button class=${styles.button} id="returnToLobbyButton" onClick=${onNavigateToLobby} style=${{ marginBottom: '10px' }}>Return to Lobby</button>
      <div id="gameInfo">
        <p>Game Code: <strong id="gameCodeDisplay">${gameCode}</strong></p>
        <p>You are: <strong id="playerNumberDisplay">${playerNumber}</strong></p>
        <p>Current Turn: <strong id="currentTurnDisplay">${currentTurn}</strong></p>
      </div>

      <hr />

      <p>Counter: <span id="counter">${counter}</span></p>
      <button class=${styles.button} id="incrementButton" onClick=${onIncrementCounter}>Increment</button>
      <button class=${styles.button} id="endTurnButton" onClick=${onEndTurn}>End Turn</button>

      <hr style=${{ marginTop: '20px' }} /> 
      <div id="debugSection">
        <button class=${styles.button} id="toggleDebugButton" onClick=${handleToggleDebug}>Show Debug Info</button>
        <div id="debugContent" style=${{ display: 'none', marginTop: '10px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#333', color: '#f0f0f0', border: '1px solid #555', padding: '10px', textAlign: 'left' }}>
          <h4>Current Game State (Client-Side View):</h4>
          <pre id="gameStateJson" style=${{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            ${gameState ? JSON.stringify(gameState, null, 2) : 'No game state received.'}
          </pre>
        </div>
      </div>
    </div>
  `;
} 
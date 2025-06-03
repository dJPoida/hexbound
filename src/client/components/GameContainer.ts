import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

interface GameContainerProps {
  styles: { [key: string]: string };
  onNavigateToLobby: () => void;
  // TODO: Add props for game state, player info, and event handlers
  // e.g., gameId: string | null;
  //       playerNumber: number | null;
  //       currentTurn: number | null;
  //       onCopyGameLink: () => void;
  //       onStartNewGame: () => void;
  //       onIncrementCounter: () => void;
  //       onEndTurn: () => void;
  //       onToggleDebug: () => void;
}

export function GameContainer({ styles, onNavigateToLobby }: GameContainerProps) {
  // Placeholder handlers
  const handleReturnToLobby = () => {
    console.log('Return to Lobby clicked');
    onNavigateToLobby();
  };
  const handleCopyGameLink = () => console.log('Copy Game Link clicked');
  const handleStartNewGame = () => console.log('Start New Game clicked (from GameContainer)');
  const handleIncrementCounter = () => console.log('Increment Counter clicked');
  const handleEndTurn = () => console.log('End Turn clicked');
  const handleToggleDebug = () => {
    console.log('Toggle Debug Info clicked');
    const debugContent = document.getElementById('debugContent');
    if (debugContent) {
      debugContent.style.display = debugContent.style.display === 'none' ? 'block' : 'none';
    }
  };

  return html`
    <div id="gameContainer">
      <button class=${styles.button} id="returnToLobbyButton" onClick=${handleReturnToLobby} style=${{ marginBottom: '10px' }}>Return to Lobby</button>
      <div id="gameInfo">
        <p>Game ID: <strong id="gameIdDisplay">Loading...</strong> 
           <button class=${styles.button} id="copyGameLinkButton" onClick=${handleCopyGameLink}>Copy Share Link</button>
           <button class=${styles.button} id="startNewGameButton" onClick=${handleStartNewGame}>Start New Game</button> 
        </p>
        <p>You are: <strong id="playerNumberDisplay">-</strong></p>
        <p>Current Turn: <strong id="currentTurnDisplay">-</strong></p>
      </div>

      <hr />

      <p>Counter: <span id="counter">0</span></p>
      <button class=${styles.button} id="incrementButton" onClick=${handleIncrementCounter}>Increment</button>
      <button class=${styles.button} id="endTurnButton" onClick=${handleEndTurn}>End Turn</button>

      <hr style=${{ marginTop: '20px' }} /> 
      <div id="debugSection">
        <button class=${styles.button} id="toggleDebugButton" onClick=${handleToggleDebug}>Show Debug Info</button>
        <div id="debugContent" style=${{ display: 'none', marginTop: '10px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#333', color: '#f0f0f0', border: '1px solid #555', padding: '10px', textAlign: 'left' }}>
          <h4>Current Game State (Client-Side View):</h4>
          <pre id="gameStateJson" style=${{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></pre>
        </div>
      </div>
    </div>
  `;
} 
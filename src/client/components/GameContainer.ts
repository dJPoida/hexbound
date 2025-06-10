import { h } from 'preact';
import htm from 'htm';
import { GameStateUpdatePayload } from '../../shared/types/socket.types';

const html = htm.bind(h);

interface GameContainerProps {
  styles: { [key: string]: string };
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
  const playerNames = gameState?.players
    ? Object.values(gameState.players).map(p => p.userName).join(', ')
    : 'Loading...';
  const currentTurn = gameState?.turn ?? '-';
  const counter = gameState?.gameState.placeholderCounter ?? 0;

  return html`
    <div class=${styles.lobbyContainer}>
      
      <div class=${styles.lobbySection}>
        <h3 class=${styles.sectionTitle}>Game Info</h3>
        <div class=${styles.gameMetaRow}><span>Game Code:</span> <strong>${gameCode}</strong></div>
        <div class=${styles.gameMetaRow}><span>Players:</span> <strong>${playerNames}</strong></div>
        <div class=${styles.gameMetaRow}><span>Current Turn:</span> <strong>${currentTurn}</strong></div>
      </div>

      <div class=${styles.lobbySection}>
        <h3 class=${styles.sectionTitle}>Actions</h3>
        <div class=${styles.gameMetaRow}>
          <span>Counter:</span> 
          <strong>${counter}</strong>
        </div>
        <div class=${styles.gameActionContainer}>
          <button class=${`${styles.button} ${styles.primaryButton}`} onClick=${onIncrementCounter}>Increment</button>
          <button class=${`${styles.button} ${styles.joinButton}`} onClick=${onEndTurn}>End Turn</button>
        </div>
      </div>

      <div class=${styles.lobbySection}>
        <h3 class=${styles.sectionTitle}>Debug</h3>
        <button class=${styles.button} onClick=${handleToggleDebug} style=${{width: 'auto'}}>Show Debug Info</button>
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
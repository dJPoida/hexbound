import { h } from 'preact';
import htm from 'htm';
import { GameStateUpdatePayload } from '../../shared/types/socket.types';
import { Button } from './Button/Button';

const html = htm.bind(h);

interface GameContainerProps {
  gameState: GameStateUpdatePayload | null;
  onIncrementCounter: () => void;
  onEndTurn: () => void;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  // TODO: Add props for game state, player info, and event handlers
  // e.g., gameId: string | null;
  //       playerNumber: number | null;
  //       currentTurn: number | null;
  //       onCopyGameLink: () => void;
  //       onStartNewGame: () => void;
  //       onToggleDebug: () => void;
}

export function GameContainer({ 
  gameState,
  onIncrementCounter,
  onEndTurn,
  connectionStatus
}: GameContainerProps) {

  if (connectionStatus === 'connecting') {
    return html`
      <div class="lobbyContainer">
        <h3 class="sectionTitle">Connecting to Game...</h3>
        <p>Please wait while we establish a connection to the game server.</p>
      </div>
    `;
  }

  if (connectionStatus === 'reconnecting') {
    return html`
      <div class="lobbyContainer">
        <h3 class="sectionTitle">Connection Lost</h3>
        <p>Attempting to reconnect to the game server...</p>
      </div>
    `;
  }

  if (connectionStatus === 'disconnected' && !gameState) {
     return html`
      <div class="lobbyContainer">
        <h3 class="sectionTitle">Not Connected</h3>
        <p>There is no active connection to the game server.</p>
      </div>
    `;
  }

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
    <div class="lobbyContainer">
      <div class="lobbySection">
        <h3 class="sectionTitle">Game Info</h3>
        <div class="gameMetaRow"><span>Game Code:</span> <strong>${gameCode}</strong></div>
        <div class="gameMetaRow"><span>Players:</span> <strong>${playerNames}</strong></div>
        <div class="gameMetaRow"><span>Current Turn:</span> <strong>${currentTurn}</strong></div>
      </div>

      <div class="lobbySection">
        <h3 class="sectionTitle">Actions</h3>
        <div class="gameMetaRow">
          <span>Counter:</span> 
          <strong>${counter}</strong>
        </div>
        <div class="gameActionContainer">
          ${h(Button, { onClick: onIncrementCounter, children: 'Increment', variant: 'primary' })}
          ${h(Button, { onClick: onEndTurn, children: 'End Turn', variant: 'secondary' })}
        </div>
      </div>

      <div class="lobbySection">
        <h3 class="sectionTitle">Debug</h3>
        ${h(Button, { onClick: handleToggleDebug, children: 'Show Debug Info', variant: 'secondary' })}
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
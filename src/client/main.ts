import { render, h } from 'preact';
import htm from 'htm';
import './global.css'; // Import global styles
import styles from './App.module.css'; // Import CSS Modules
import { PlayerManagement } from './components/PlayerManagement'; // Import the new component

// Initialize htm with Preact's h function
const html = htm.bind(h);

// Define the main App component
function App() {
  return html`
    <div class=${styles.appContainer}>
      <h1>Hexbound Game (Preact UI)</h1>
      <p style=${{ fontSize: '0.8em', color: 'grey' }}>Version: <span id="appVersionDisplay">LOADING...</span></p>

      <${PlayerManagement} styles=${styles} />

      <hr id="viewDivider" style=${{ display: 'none' }} />

      <div id="lobbyView" style=${{ display: 'none', textAlign: 'left' }}>
        <h2>Lobby</h2>
        <h3>Your Active Games:</h3>
        <p id="myGamesListLoadingIndicator" style=${{ display: 'none' }}>Loading your games...</p>
        <ul id="myGamesList" style=${{ paddingLeft: '0', listStylePosition: 'inside' }}>
          {/* Game items will be populated here - this comment style IS safe */}
        </ul>
        <p id="noGamesMessage" style=${{ display: 'none' }}>You are not currently in any games.</p>
        
        <hr />
        <h3>Start or Join a Game:</h3>
        <button class=${styles.button} id="lobbyCreateNewGameButton">Create New Game</button>
        <div>
          <input type="text" id="joinGameIdInput" placeholder="Paste Game ID here" />
          <button class=${styles.button} id="lobbyJoinByIdButton">Join by ID</button>
        </div>
      </div>

      <div id="gameContainer" style=${{ display: 'none' }}>
        <button class=${styles.button} id="returnToLobbyButton" style=${{ display: 'none', marginBottom: '10px' }}>Return to Lobby</button>
        <div id="gameInfo">
          <p>Game ID: <strong id="gameIdDisplay">Loading...</strong> 
             <button class=${styles.button} id="copyGameLinkButton">Copy Share Link</button>
             <button class=${styles.button} id="startNewGameButton">Start New Game</button> 
          </p>
          <p>You are: <strong id="playerNumberDisplay">-</strong></p>
          <p>Current Turn: <strong id="currentTurnDisplay">-</strong></p>
        </div>
  
        <hr />
  
        <p>Counter: <span id="counter">0</span></p>
        <button class=${styles.button} id="incrementButton">Increment</button>
        <button class=${styles.button} id="endTurnButton">End Turn</button>

        <hr style=${{ marginTop: '20px' }} /> 
        <div id="debugSection">
          <button class=${styles.button} id="toggleDebugButton">Show Debug Info</button>
          <div id="debugContent" style=${{ display: 'none', marginTop: '10px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#333', color: '#f0f0f0', border: '1px solid #555', padding: '10px', textAlign: 'left' }}>
            <h4>Current Game State (Client-Side View):</h4>
            <pre id="gameStateJson" style=${{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></pre>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render the App component into the div#app element in index.html
const appRoot = document.getElementById('app');
if (appRoot) {
  render(html`<${App} />`, appRoot);
} else {
  console.error('Target root element #app not found in DOM.');
}

// Basic HMR setup for Preact components
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.App) {
      // Re-render the new App component
      if (appRoot) {
        render(html`<${newModule.App} />`, appRoot);
        console.log('HMR update applied for App component');
      }
    }
  });
  // Also make sure main.ts itself is hot-replaceable if its direct code changes
  import.meta.hot.accept();
}

console.log('Preact app initialized.'); 
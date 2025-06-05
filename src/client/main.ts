import { render, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import htm from 'htm';
import './global.css'; // Import global styles
import styles from './App.module.css'; // Import CSS Modules
import { PlayerManagement } from './components/PlayerManagement'; // Import the new component
import { LobbyView } from './components/LobbyView'; // Import LobbyView
import { GameContainer } from './components/GameContainer'; // Import GameContainer

// Initialize htm with Preact's h function
const html = htm.bind(h);

// Define the main App component
function App() {
  const [version, setVersion] = useState('LOADING...');
  
  // Player Authentication State
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby'); // State for view switching

  useEffect(() => {
    // VITE_APP_VERSION is injected by Vite during the build process
    const appVersionFromEnv = import.meta.env.VITE_APP_VERSION;
    if (appVersionFromEnv) {
      setVersion(appVersionFromEnv);
    } else {
      // Fallback for dev mode if VITE_APP_VERSION might not be set by `define` (though it should be)
      // or fetch from the server API as a more robust dev fallback.
      fetch('/api/version')
        .then(res => res.json())
        .then(data => setVersion(data.version || 'N/A (dev)'))
        .catch(() => setVersion('N/A (fetch error)'));
    }
    // Check local storage for existing player session (simple example)
    const storedPlayerId = localStorage.getItem('hexboundPlayerId');
    const storedPlayerName = localStorage.getItem('hexboundPlayerName');
    if (storedPlayerId && storedPlayerName) {
      setCurrentPlayerId(storedPlayerId);
      setCurrentPlayerName(storedPlayerName);
      setIsLoggedIn(true);
    }
  }, []);

  const handlePlayerNameInputChange = (name: string) => {
    setPlayerNameInput(name);
  };

  const handleSaveNameAndPlay = async () => {
    if (!playerNameInput.trim()) {
      setAuthError('Player name cannot be empty.');
      return;
    }
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/player/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName: playerNameInput.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentPlayerId(data.playerId);
        setCurrentPlayerName(data.playerName);
        setIsLoggedIn(true);
        setCurrentView('lobby'); // Default to lobby view after login
        localStorage.setItem('hexboundPlayerId', data.playerId);
        localStorage.setItem('hexboundPlayerName', data.playerName);
        setPlayerNameInput(''); // Clear input
      } else {
        setAuthError(data.message || 'Authentication failed.');
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
      console.error('Auth error:', error);
    }
    setIsLoadingAuth(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPlayerId(null);
    setCurrentPlayerName(null);
    setCurrentView('lobby'); // Reset view on logout
    localStorage.removeItem('hexboundPlayerId');
    localStorage.removeItem('hexboundPlayerName');
    // Potentially call a backend logout if server-side sessions were involved
  };

  // Placeholder: Will be passed to LobbyView/GameContainer to switch views
  const navigateToGame = (gameId: string) => {
    console.log('Navigating to game:', gameId); // Placeholder
    setCurrentView('game');
  };

  const navigateToLobby = () => {
    setCurrentView('lobby');
  };

  return html`
    <div class=${styles.appContainer}>
      <h1>Hexbound Game</h1>
      <p style=${{ fontSize: '0.8em', color: 'grey' }}>Version: <span id="appVersionDisplay">${version}</span></p>

      ${!isLoggedIn ? html`
        <${PlayerManagement} 
          styles=${styles} 
          playerNameInput=${playerNameInput}
          onPlayerNameInputChange=${handlePlayerNameInputChange}
          onSaveNameAndPlay=${handleSaveNameAndPlay}
          isLoadingAuth=${isLoadingAuth}
          authError=${authError}
        />
      ` : html`
        <div> <!-- Logged in Wrapper -->
          <p>Welcome, ${currentPlayerName}!</p>
          <button class=${styles.button} onClick=${handleLogout}>Logout</button>
          
          <hr id="viewDivider" />
          
          ${currentView === 'lobby' && html`
            <${LobbyView} 
              styles=${styles} 
              onNavigateToGame=${navigateToGame} 
            />
          `}
          ${currentView === 'game' && html`
            <${GameContainer} 
              styles=${styles} 
              onNavigateToLobby=${navigateToLobby} 
            />
          `}
        </div>
      `}
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
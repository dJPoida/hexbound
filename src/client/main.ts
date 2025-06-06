import { render, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import htm from 'htm';
import './global.css'; // Import global styles
import styles from './App.module.css'; // Import CSS Modules
import { UserLogin } from './components/UserLogin';
import { LobbyView } from './components/LobbyView'; // Import LobbyView
import { GameContainer } from './components/GameContainer'; // Import GameContainer

// Initialize htm with Preact's h function
const html = htm.bind(h);

// Define the main App component
function App() {
  const [version, setVersion] = useState('LOADING...');
  
  // User Authentication State
  const [userNameInput, setUserNameInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    // Check local storage for existing user session
    const storedUserId = localStorage.getItem('hexboundUserId');
    const storedUserName = localStorage.getItem('hexboundUserName');
    if (storedUserId && storedUserName) {
      setCurrentUserId(storedUserId);
      setCurrentUserName(storedUserName);
      setIsLoggedIn(true);
    }
  }, []);

  const handleUserNameInputChange = (name: string) => {
    setUserNameInput(name);
  };

  const handleLogin = async () => {
    if (!userNameInput.trim()) {
      setAuthError('Username cannot be empty.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: userNameInput.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUserId(data.userId);
        setCurrentUserName(data.userName);
        setIsLoggedIn(true);
        setCurrentView('lobby'); // Default to lobby view after login
        localStorage.setItem('hexboundUserId', data.userId);
        localStorage.setItem('hexboundUserName', data.userName);
        setUserNameInput(''); // Clear input
      } else {
        setAuthError(data.message || 'Authentication failed.');
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
      console.error('Auth error:', error);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setCurrentUserName(null);
    setCurrentView('lobby'); // Reset view on logout
    localStorage.removeItem('hexboundUserId');
    localStorage.removeItem('hexboundUserName');
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
      ${!isLoggedIn ? html`
        <${UserLogin} 
          styles=${styles} 
          userNameInput=${userNameInput}
          onUserNameInputChange=${handleUserNameInputChange}
          onLogin=${handleLogin}
          isLoading=${isLoading}
          error=${authError}
        />
      ` : html`
        <div class=${styles.loggedInContainer}> <!-- Logged in Wrapper -->
          <div class=${styles.header}>
            <p class=${styles.welcomeMessage}>Welcome, ${currentUserName}!</p>
            <button class=${`${styles.button} ${styles.logoutButton}`} onClick=${handleLogout}>Logout</button>
          </div>
          
          <hr class=${styles.divider} />
          
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
      <p class=${styles.versionDisplay}>Version: <span id="appVersionDisplay">${version}</span></p>
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
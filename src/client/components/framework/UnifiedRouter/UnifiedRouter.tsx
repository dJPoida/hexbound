import { h } from 'preact';
import { Component } from 'preact';

import { GameListItem } from '../../../../shared/types/game.types';
import { ClientGameStatePayload } from '../../../../shared/types/socket.types';
import { GameViewLayout } from '../../game/GameViewLayout/GameViewLayout';
import { LobbyView } from '../../lobby/LobbyView/LobbyView';
import { StyleGuidePage } from '../../Pages/StyleGuidePage/StyleGuidePage';
import { UtilsPage } from '../../Pages/UtilsPage/UtilsPage';
import { AppHeader, AppHeaderView } from '../../ui/AppHeader/AppHeader';

export interface UnifiedRouterProps {
  // App-level data
  currentUserName: string | null;
  currentUserId: string | null;
  myGames: GameListItem[];
  gameState: ClientGameStatePayload | null;
  isGameLoaded: boolean;
  
  // Navigation & actions  
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onJoinGame: (gameId: string, gameCode: string) => void;
  onCreateNewGame: () => Promise<void>;
  onEndTurn: () => void;
  onPushDialog: (dialog: 'gameSettings' | 'incrementCounter' | 'debugInfo') => void;
  onGameReady: () => void;
  
  // Dialog & UI
  dialog: h.JSX.Element | null;
  className?: string;
}

interface UnifiedRouterState {
  currentPath: string;
}

export class UnifiedRouter extends Component<UnifiedRouterProps, UnifiedRouterState> {
  state: UnifiedRouterState = {
    currentPath: window.location.pathname,
  };

  handleRouteChange = () => {
    const newPath = window.location.pathname;
    this.setState({ currentPath: newPath });
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handleRouteChange);
    window.addEventListener('pushstate', this.handleRouteChange);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleRouteChange);
    window.removeEventListener('pushstate', this.handleRouteChange);
  }

  // Determine current route type and context
  getRouteInfo() {
    const path = this.state.currentPath;
    
    // Check for game route
    const gameMatch = path.match(/^\/game\/([a-zA-Z0-9-]+)/);
    if (gameMatch) {
      return { type: 'game', gameCode: gameMatch[1], headerView: AppHeaderView.GAME };
    }
    
    // Check for utility routes
    if (path === '/utils') {
      return { type: 'utils', headerView: AppHeaderView.UTILS };
    }
    if (path === '/styleguide') {
      return { type: 'styleguide', headerView: AppHeaderView.STYLEGUIDE };
    }
    
    // Default to lobby
    return { type: 'lobby', headerView: AppHeaderView.LOBBY };
  }

  renderHeader(routeInfo: ReturnType<typeof this.getRouteInfo>) {
    const { currentUserName, onLogout, onOpenSettings, onNavigate, gameState, onPushDialog } = this.props;
    
    return (
      <AppHeader
        currentView={routeInfo.headerView}
        currentUserName={currentUserName}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onNavigate={onNavigate}
        turnNumber={routeInfo.type === 'game' ? gameState?.turnNumber : undefined}
        counter={routeInfo.type === 'game' ? gameState?.gameState.placeholderCounter ?? 0 : undefined}
        onToggleCounterDialog={routeInfo.type === 'game' ? () => onPushDialog('incrementCounter') : undefined}
      />
    );
  }

  renderContent(routeInfo: ReturnType<typeof this.getRouteInfo>) {
    const { 
      currentUserId, 
      myGames, 
      gameState, 
      isGameLoaded, 
      onJoinGame, 
      onCreateNewGame, 
      onEndTurn, 
      onPushDialog, 
      onGameReady,
      dialog,
      currentUserName
    } = this.props;

    switch (routeInfo.type) {
      case 'game':
        if (!gameState) return <div>Loading game...</div>;
        
        return (
          <GameViewLayout
            gameState={gameState}
            isMapReady={isGameLoaded}
            onReady={onGameReady}
            onEndTurn={onEndTurn}
            onPushDialog={onPushDialog}
            isMyTurn={gameState.currentPlayerId === currentUserId}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            dialog={dialog}
          />
        );
      
      case 'utils':
        return (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100%', position: 'relative' }}>
            <UtilsPage />
          </div>
        );
      
      case 'styleguide':
        return (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100%', position: 'relative' }}>
            <StyleGuidePage />
          </div>
        );
      
      case 'lobby':
      default:
        return (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative', boxSizing: 'border-box' }}>
            <LobbyView 
              onNavigateToGame={onJoinGame}
              onCreateNewGame={onCreateNewGame}
              myGames={myGames}
              currentUserId={currentUserId}
            />
          </div>
        );
    }
  }

  render() {
    const { className, dialog } = this.props;
    const routeInfo = this.getRouteInfo();
    
    return (
      <div className={className}>
        {this.renderHeader(routeInfo)}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {this.renderContent(routeInfo)}
        </div>
        {routeInfo.type !== 'game' && dialog && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 20, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '1rem', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto'
          }}>
            {dialog}
          </div>
        )}
      </div>
    );
  }
} 
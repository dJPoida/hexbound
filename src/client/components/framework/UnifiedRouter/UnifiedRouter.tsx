import { h } from 'preact';
import { Component } from 'preact';

import { GameListItem } from '../../../../shared/types/core';
import { ClientGameStatePayload } from '../../../../shared/types/socket';
import { GameViewLayout } from '../../game/GameViewLayout/GameViewLayout';
import { AppHeader, AppHeaderView } from '../../ui/AppHeader/AppHeader';
import { LobbyView } from '../../views/LobbyView/LobbyView';
import { StyleGuideView } from '../../views/StyleGuideView/StyleGuideView';
import { UtilsView } from '../../views/UtilsView/UtilsView';
import styles from './UnifiedRouter.module.css';

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
  setLobbyVisible: (visible: boolean) => void;

  // Dialog & UI
  dialog: h.JSX.Element | null;
  className?: string;
}

interface UnifiedRouterState {
  currentPath: string;
  copyLinkStatus: 'idle' | 'copied';
}

export class UnifiedRouter extends Component<UnifiedRouterProps, UnifiedRouterState> {
  state: UnifiedRouterState = {
    currentPath: window.location.pathname,
    copyLinkStatus: 'idle',
  };

  handleRouteChange = () => {
    const newPath = window.location.pathname;
    this.setState({ currentPath: newPath });

    // Update lobby visibility based on route
    const isLobbyRoute = newPath === '/' || newPath === '/lobby';
    this.props.setLobbyVisible(isLobbyRoute);
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handleRouteChange);
    window.addEventListener('pushstate', this.handleRouteChange);

    // Set initial lobby visibility
    const isLobbyRoute = this.state.currentPath === '/' || this.state.currentPath === '/lobby';
    this.props.setLobbyVisible(isLobbyRoute);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleRouteChange);
    window.removeEventListener('pushstate', this.handleRouteChange);
  }

  handleCopyGameLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        this.setState({ copyLinkStatus: 'copied' });
        setTimeout(() => {
          this.setState({ copyLinkStatus: 'idle' });
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

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
    const { currentUserName, onLogout, onOpenSettings, onNavigate, gameState, onPushDialog } =
      this.props;

    return (
      <AppHeader
        currentView={routeInfo.headerView}
        currentUserName={currentUserName}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onNavigate={onNavigate}
        turnNumber={routeInfo.type === 'game' ? gameState?.turnNumber : undefined}
        counter={
          routeInfo.type === 'game' ? (gameState?.gameState.placeholderCounter ?? 0) : undefined
        }
        onToggleCounterDialog={
          routeInfo.type === 'game' ? () => onPushDialog('incrementCounter') : undefined
        }
        onCopyGameLink={routeInfo.type === 'game' ? this.handleCopyGameLink : undefined}
        copyLinkStatus={routeInfo.type === 'game' ? this.state.copyLinkStatus : undefined}
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
      onNavigate,
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
            onNavigate={onNavigate}
            isMyTurn={gameState.currentPlayerId === currentUserId}
            currentUserId={currentUserId}
            dialog={dialog}
          />
        );

      case 'utils':
        return (
          <div className={styles.contentContainer}>
            <UtilsView />
          </div>
        );

      case 'styleguide':
        return (
          <div className={styles.contentContainer}>
            <StyleGuideView />
          </div>
        );

      case 'lobby':
      default:
        return (
          <div className={styles.contentContainer}>
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
        <div className={styles.gameViewContainer}>{this.renderContent(routeInfo)}</div>
        {routeInfo.type !== 'game' && dialog && (
          <div className={styles.dialogOverlay}>{dialog}</div>
        )}
      </div>
    );
  }
}

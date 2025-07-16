import styles from './AppHeader.module.css';
import { GameResources } from './GameResources';
import { HeaderMenu } from './HeaderMenu';
import { AppHeaderView } from './types';

export interface AppHeaderProps {
  currentUserName: string | null;
  currentView: AppHeaderView;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  onOpenSettings: () => void;

  // Game-specific props (optional)
  turnNumber?: number | null;
  counter?: number | null;
  onToggleCounterDialog?: () => void;
  onCopyGameLink?: () => void;
  copyLinkStatus?: 'idle' | 'copied';
}

export function AppHeader({
  currentUserName,
  currentView,
  onLogout,
  onNavigate,
  onOpenSettings,
  turnNumber,
  counter,
  onToggleCounterDialog,
  onCopyGameLink,
  copyLinkStatus = 'idle',
}: AppHeaderProps) {
  return (
    <div className={styles.header}>
      {currentView === AppHeaderView.GAME ? (
        <GameResources counter={counter} onToggleCounterDialog={onToggleCounterDialog} />
      ) : (
        <div /> // Spacer for non-game views
      )}
      <div className={styles.headerActions}>
        <HeaderMenu
          currentView={currentView}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onOpenSettings={onOpenSettings}
          onCopyGameLink={onCopyGameLink}
          copyLinkStatus={copyLinkStatus}
        />
      </div>
    </div>
  );
}

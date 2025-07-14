import { useEffect, useRef, useState } from 'preact/hooks';

import { StyleColor } from '../../../types/styleColor.type';
import { Button, ButtonVariant } from '../Button';
import { Icon } from '../Icon/Icon';
import styles from './AppHeader.module.css';

export enum AppHeaderView {
  LOBBY = 'lobby',
  GAME = 'game',
  UTILS = 'utils',
  STYLEGUIDE = 'styleguide',
}

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const renderGameResources = () => {
    if (currentView !== AppHeaderView.GAME) return null;

    return (
      <div className={styles.resources}>
        <div className={styles.resourceItem}>
          <Icon name="dollar-sign" />
          <span>1,234</span>
        </div>
        <div className={styles.resourceItem}>
          <Icon name="award" />
          <span>567</span>
        </div>
        <div className={styles.resourceItem}>
          <Icon name="smile" />
          <span>{counter ?? 0}</span>
          {onToggleCounterDialog && (
            <Button 
              onClick={onToggleCounterDialog} 
              variant={ButtonVariant.ICON}
              ariaLabel="Edit counter"
            >
              <Icon name="edit" color={StyleColor.LIGHT} />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderUserInfo = () => {
    const userText = currentView === AppHeaderView.GAME && turnNumber 
      ? `${currentUserName} (Turn: ${turnNumber})`
      : currentUserName;
    
    return <span className={styles.userInfo}>{userText}</span>;
  };

  const renderMenuItems = () => {
    const items = [];

    // Game-specific menu items
    if (currentView === AppHeaderView.GAME) {
      items.push(
        <button key="settings" className={styles.menuItem} onClick={() => { onOpenSettings(); closeMenu(); }}>
          <Icon name="settings" />
          <span>Game Settings</span>
        </button>
      );

      if (onCopyGameLink) {
        items.push(
          <button key="copy-link" className={styles.menuItem} onClick={() => { onCopyGameLink(); closeMenu(); }}>
            <Icon name="link" />
            <span>{copyLinkStatus === 'copied' ? 'Link Copied!' : 'Copy Game Link'}</span>
          </button>
        );
      }

      items.push(
        <button key="lobby" className={styles.menuItem} onClick={() => { onNavigate('/'); closeMenu(); }}>
          <Icon name="exit" />
          <span>Return to Lobby</span>
        </button>
      );
    } else {
      // Lobby/Utils/StyleGuide navigation
      if (currentView !== AppHeaderView.LOBBY) {
        items.push(
          <button key="lobby" className={styles.menuItem} onClick={() => { onNavigate('/'); closeMenu(); }}>
            <Icon name="home" />
            <span>Lobby</span>
          </button>
        );
      }

      if (currentView !== AppHeaderView.STYLEGUIDE) {
        items.push(
          <button key="styleguide" className={styles.menuItem} onClick={() => { onNavigate('/styleguide'); closeMenu(); }}>
            <Icon name="eye" />
            <span>Style Guide</span>
          </button>
        );
      }

      if (currentView !== AppHeaderView.UTILS) {
        items.push(
          <button key="utils" className={styles.menuItem} onClick={() => { onNavigate('/utils'); closeMenu(); }}>
            <Icon name="terminal" />
            <span>Utils</span>
          </button>
        );
      }

      items.push(
        <button key="settings" className={styles.menuItem} onClick={() => { onOpenSettings(); closeMenu(); }}>
          <Icon name="settings" />
          <span>Game Settings</span>
        </button>
      );

      items.push(
        <button key="logout" className={styles.menuItem} onClick={() => { onLogout(); closeMenu(); }}>
          <Icon name="exit" />
          <span>Logout</span>
        </button>
      );
    }

    return items;
  };

  return (
    <div className={styles.header}>
      {renderGameResources()}
      {!renderGameResources() && <div />} {/* Spacer for non-game views */}
      
      <div className={styles.headerActions}>
        {renderUserInfo()}
        <div className={styles.menuButtonContainer} ref={menuRef}>
          <Button 
            onClick={toggleMenu} 
            ariaLabel="Open menu" 
            variant={ButtonVariant.ICON}
          >
            <Icon name="menu" color={StyleColor.LIGHT} />
          </Button>
          {isMenuOpen && (
            <div className={styles.menuDropdown}>
              {renderMenuItems()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
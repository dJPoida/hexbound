import { useEffect, useRef, useState } from 'preact/hooks';

import { StyleColor } from '../../../types/ui';
import { Button } from '../Button';
import { Icon } from '../Icon/Icon';
import { Text } from '../Typography/Text';
import styles from './AppHeader.module.css';
import { AppHeaderView } from './types';

export interface HeaderMenuProps {
  currentView: AppHeaderView;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  onOpenSettings: () => void;
  onCopyGameLink?: () => void;
  copyLinkStatus?: 'idle' | 'copied';
}

export function HeaderMenu({
  currentView,
  onLogout,
  onNavigate,
  onOpenSettings,
  onCopyGameLink,
  copyLinkStatus = 'idle',
}: HeaderMenuProps) {
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

  const renderMenuItems = () => {
    const items = [];

    // Game-specific menu items
    if (currentView === AppHeaderView.GAME) {
      items.push(
        <button
          key='settings'
          className={styles.menuItem}
          onClick={() => {
            onOpenSettings();
            closeMenu();
          }}
        >
          <Icon name='settings' />
          <Text variant='inline' as='span'>
            Game Settings
          </Text>
        </button>
      );

      if (onCopyGameLink) {
        items.push(
          <button
            key='copy-link'
            className={styles.menuItem}
            onClick={() => {
              onCopyGameLink();
              closeMenu();
            }}
          >
            <Icon name='link' />
            <Text variant='inline' as='span'>
              {copyLinkStatus === 'copied' ? 'Link Copied!' : 'Copy Game Link'}
            </Text>
          </button>
        );
      }

      items.push(
        <button
          key='lobby'
          className={styles.menuItem}
          onClick={() => {
            onNavigate('/');
            closeMenu();
          }}
        >
          <Icon name='exit' />
          <Text variant='inline' as='span'>
            Return to Lobby
          </Text>
        </button>
      );
    } else {
      // Lobby/Utils/StyleGuide navigation
      if (currentView !== AppHeaderView.LOBBY) {
        items.push(
          <button
            key='lobby'
            className={styles.menuItem}
            onClick={() => {
              onNavigate('/');
              closeMenu();
            }}
          >
            <Icon name='home' />
            <Text variant='inline' as='span'>
              Lobby
            </Text>
          </button>
        );
      }

      if (currentView !== AppHeaderView.STYLEGUIDE) {
        items.push(
          <button
            key='styleguide'
            className={styles.menuItem}
            onClick={() => {
              onNavigate('/styleguide');
              closeMenu();
            }}
          >
            <Icon name='eye' />
            <Text variant='inline' as='span'>
              Style Guide
            </Text>
          </button>
        );
      }

      if (currentView !== AppHeaderView.UTILS) {
        items.push(
          <button
            key='utils'
            className={styles.menuItem}
            onClick={() => {
              onNavigate('/utils');
              closeMenu();
            }}
          >
            <Icon name='terminal' />
            <Text variant='inline' as='span'>
              Utils
            </Text>
          </button>
        );
      }

      items.push(
        <button
          key='settings'
          className={styles.menuItem}
          onClick={() => {
            onOpenSettings();
            closeMenu();
          }}
        >
          <Icon name='settings' />
          <Text variant='inline' as='span'>
            Game Settings
          </Text>
        </button>
      );

      items.push(
        <button
          key='logout'
          className={styles.menuItem}
          onClick={() => {
            onLogout();
            closeMenu();
          }}
        >
          <Icon name='exit' />
          <Text variant='inline' as='span'>
            Logout
          </Text>
        </button>
      );
    }

    return items;
  };

  return (
    <div className={styles.menuButtonContainer} ref={menuRef}>
      <Button onClick={toggleMenu} ariaLabel='Open menu' color={StyleColor.WHITE} icon='menu' />
      {isMenuOpen && <div className={styles.menuDropdown}>{renderMenuItems()}</div>}
    </div>
  );
}

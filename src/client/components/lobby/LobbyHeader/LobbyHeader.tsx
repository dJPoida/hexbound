import { useEffect, useRef,useState } from 'preact/hooks';

import { StyleColor } from '../../types/styleColor.type';
import { Button, ButtonVariant } from '../ui/Button';
import { Icon } from '../ui/Icon/Icon';
import styles from './LobbyHeader.module.css';

interface LobbyHeaderProps {
    currentUserName: string | null;
    onLogout: () => void;
    onOpenSettings: () => void;
    onNavigateToStyleGuide: () => void;
    onNavigateToUtils: () => void;
    onNavigateToLobby: () => void;
    currentPage: 'lobby' | 'styleguide' | 'utils';
}

export function LobbyHeader({ currentUserName, onLogout, onOpenSettings, onNavigateToStyleGuide, onNavigateToUtils, onNavigateToLobby, currentPage }: LobbyHeaderProps) {
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

        // Add event listeners
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup function
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);

    return (
        <div className={styles.header}>
            <div></div> {/* Empty div for spacing */}
            <div className={styles.headerActions}>
                <span>{currentUserName}</span>
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
                            {currentPage !== 'lobby' && (
                                <button className={styles.menuItem} onClick={() => { onNavigateToLobby(); closeMenu(); }}>
                                    <Icon name="home" />
                                    <span>Lobby</span>
                                </button>
                            )}
                            {currentPage !== 'styleguide' && (
                                <button className={styles.menuItem} onClick={() => { onNavigateToStyleGuide(); closeMenu(); }}>
                                    <Icon name="eye" />
                                    <span>Style Guide</span>
                                </button>
                            )}
                            {currentPage !== 'utils' && (
                                <button className={styles.menuItem} onClick={() => { onNavigateToUtils(); closeMenu(); }}>
                                    <Icon name="terminal" />
                                    <span>Utils</span>
                                </button>
                            )}
                            <button className={styles.menuItem} onClick={() => { onOpenSettings(); closeMenu(); }}>
                                <Icon name="settings" />
                                <span>Game Settings</span>
                            </button>
                            <button className={styles.menuItem} onClick={() => { onLogout(); closeMenu(); }}>
                                <Icon name="exit" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 
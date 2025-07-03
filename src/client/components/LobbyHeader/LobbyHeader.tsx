import { useState, useEffect, useRef } from 'preact/hooks';
import { Button } from '../Button/Button';
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
                        variant="icon"
                    >
                        <span class="hbi-menu" aria-hidden="true"></span>
                    </Button>
                    {isMenuOpen && (
                        <div className={styles.menuDropdown}>
                            {currentPage !== 'lobby' && (
                                <button className={styles.menuItem} onClick={() => { onNavigateToLobby(); closeMenu(); }}>
                                    <i class="hbi hbi-home"></i>
                                    <span>Lobby</span>
                                </button>
                            )}
                            {currentPage !== 'styleguide' && (
                                <button className={styles.menuItem} onClick={() => { onNavigateToStyleGuide(); closeMenu(); }}>
                                    <i class="hbi hbi-eye"></i>
                                    <span>Style Guide</span>
                                </button>
                            )}
                            {currentPage !== 'utils' && (
                                <button className={styles.menuItem} onClick={() => { onNavigateToUtils(); closeMenu(); }}>
                                    <i class="hbi hbi-terminal"></i>
                                    <span>Utils</span>
                                </button>
                            )}
                            <button className={styles.menuItem} onClick={() => { onOpenSettings(); closeMenu(); }}>
                                <i class="hbi hbi-settings"></i>
                                <span>Game Settings</span>
                            </button>
                            <button className={styles.menuItem} onClick={() => { onLogout(); closeMenu(); }}>
                                <i class="hbi hbi-exit"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 
import { useEffect, useRef,useState } from 'preact/hooks';

import { StyleColor } from '../../types/styleColor.type';
import { Button, ButtonVariant } from '../Button';
import { Icon } from '../Icon/Icon';
import styles from './GameHeader.module.css';

interface GameHeaderProps {
    currentUserName: string | null;
    onLogout: () => void;
    currentView: 'login' | 'lobby' | 'game';
    onNavigateToLobby: () => void;
    turnNumber: number | null;
    counter: number | null;
    onToggleCounterDialog: () => void;
    onOpenSettings: () => void;
}

export function GameHeader({ currentUserName, onLogout, currentView, onNavigateToLobby, turnNumber, counter, onToggleCounterDialog, onOpenSettings }: GameHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
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
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopyStatus('copied');
            setTimeout(() => {
                setCopyStatus('idle');
                closeMenu(); 
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Optionally, handle the error (e.g., show an error message)
            closeMenu();
        });
    };

    return (
        <div className={styles.header}>
            {currentView === 'game' ? (
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
                        <button onClick={onToggleCounterDialog} className={styles.editButton}>
                            <Icon name="edit" />
                        </button>
                    </div>
                </div>
            ) : (
                <div></div> // Empty div to maintain layout
            )}
            <div className={styles.headerActions}>
                <span>{currentUserName} {currentView === 'game' && turnNumber && `(Turn: ${turnNumber})`}</span>
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
                            {currentView === 'game' && (
                                <>
                                    <button className={styles.menuItem} onClick={() => { onOpenSettings(); closeMenu(); }}>
                                        <Icon name="settings" />
                                        <span>Game Settings</span>
                                    </button>
                                    <button className={styles.menuItem} onClick={handleCopyLink}>
                                        <Icon name="link" />
                                        <span>{copyStatus === 'copied' ? 'Link Copied!' : 'Copy Game Link'}</span>
                                    </button>
                                    <button className={styles.menuItem} onClick={() => { onNavigateToLobby(); closeMenu(); }}>
                                        <Icon name="exit" />
                                        <span>Return to Lobby</span>
                                    </button>
                                </>
                            )}
                            {currentView === 'lobby' && (
                                 <>
                                    <button className={styles.menuItem} onClick={() => { onOpenSettings(); closeMenu(); }}>
                                        <Icon name="settings" />
                                        <span>Game Settings</span>
                                    </button>
                                    <button className={styles.menuItem} onClick={() => { onLogout(); closeMenu(); }}>
                                        <Icon name="exit" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            )}
                            {currentView === 'login' && (
                                 <>
                                    <button className={styles.menuItem} onClick={() => { onOpenSettings(); closeMenu(); }}>
                                        <Icon name="settings" />
                                        <span>Game Settings</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 
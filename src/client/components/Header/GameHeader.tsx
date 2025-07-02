import { useState } from 'preact/hooks';
import { Button } from '../Button/Button';
import { GameSettingsDialog } from '../GameSettingsDialog/GameSettingsDialog';
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

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopyStatus('copied');
            setTimeout(() => {
                setCopyStatus('idle');
                toggleMenu(); 
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Optionally, handle the error (e.g., show an error message)
            toggleMenu();
        });
    };

    return (
        <div className={styles.header}>
            {currentView === 'game' ? (
                <div className={styles.resources}>
                    <div className={styles.resourceItem}>
                        <i className="hbi-dollar-sign"></i>
                        <span>1,234</span>
                    </div>
                    <div className={styles.resourceItem}>
                        <i className="hbi-award"></i>
                        <span>567</span>
                    </div>
                    <div className={styles.resourceItem}>
                        <i className="hbi-smile"></i>
                        <span>{counter ?? 0}</span>
                        <button onClick={onToggleCounterDialog} className={styles.editButton}>
                            <i className="hbi-edit"></i>
                        </button>
                    </div>
                </div>
            ) : (
                <div></div> // Empty div to maintain layout
            )}
            <div className={styles.headerActions}>
                <span>{currentUserName} {currentView === 'game' && turnNumber && `(Turn: ${turnNumber})`}</span>
                <div className={styles.menuButtonContainer}>
                    <Button 
                        onClick={toggleMenu} 
                        ariaLabel="Open menu" 
                        variant="icon"
                    >
                        <span class="hbi-menu" aria-hidden="true"></span>
                    </Button>
                </div>
                {isMenuOpen && (
                    <div className={styles.menuDropdown}>
                        {currentView === 'game' && (
                            <>
                                <button className={styles.menuItem} onClick={() => { onOpenSettings(); toggleMenu(); }}>
                                    <i class="hbi hbi-settings"></i>
                                    <span>Game Settings</span>
                                </button>
                                <button className={styles.menuItem} onClick={handleCopyLink}>
                                    <i class="hbi hbi-link"></i>
                                    <span>{copyStatus === 'copied' ? 'Link Copied!' : 'Copy Game Link'}</span>
                                </button>
                                <button className={styles.menuItem} onClick={() => { onNavigateToLobby(); toggleMenu(); }}>
                                    <i class="hbi hbi-exit"></i>
                                    <span>Return to Lobby</span>
                                </button>
                            </>
                        )}
                        {currentView === 'lobby' && (
                             <>
                                <button className={styles.menuItem} onClick={() => { onOpenSettings(); toggleMenu(); }}>
                                    <i class="hbi hbi-settings"></i>
                                    <span>Game Settings</span>
                                </button>
                                <button className={styles.menuItem} onClick={() => { onLogout(); toggleMenu(); }}>
                                    <i class="hbi hbi-exit"></i>
                                    <span>Logout</span>
                                </button>
                            </>
                        )}
                        {currentView === 'login' && (
                             <>
                                <button className={styles.menuItem} onClick={() => { onOpenSettings(); toggleMenu(); }}>
                                    <i class="hbi hbi-settings"></i>
                                    <span>Game Settings</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 
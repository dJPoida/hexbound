import { useState } from 'preact/hooks';
import { MenuButton } from '../Button/MenuButton';
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
                <MenuButton onClick={toggleMenu} ariaLabel="Open menu" variant="secondary" />
                {isMenuOpen && (
                    <div className={styles.menuDropdown}>
                        {currentView === 'game' && (
                            <>
                                <button className={styles.menuItem} onClick={() => { onOpenSettings(); toggleMenu(); }}>Game Settings</button>
                                <button className={styles.menuItem} onClick={handleCopyLink}>
                                    {copyStatus === 'copied' ? 'Link Copied!' : 'Copy Game Link'}
                                </button>
                                <button className={styles.menuItem} onClick={() => { onNavigateToLobby(); toggleMenu(); }}>Return to Lobby</button>
                            </>
                        )}
                        {currentView === 'lobby' && (
                             <>
                                <button className={styles.menuItem} onClick={() => { onOpenSettings(); toggleMenu(); }}>Game Settings</button>
                                <button className={styles.menuItem} onClick={() => { onLogout(); toggleMenu(); }}>Logout</button>
                            </>
                        )}
                        {currentView === 'login' && (
                             <>
                                <button className={styles.menuItem} onClick={() => { onOpenSettings(); toggleMenu(); }}>Game Settings</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 
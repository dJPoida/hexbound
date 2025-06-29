import { useState } from 'preact/hooks';
import { MenuButton } from '../Button/MenuButton';
import { GameSettingsDialog } from '../GameSettingsDialog/GameSettingsDialog';
import styles from './Header.module.css';

interface HeaderProps {
    currentUserName: string | null;
    onLogout: () => void;
    currentView: 'login' | 'lobby' | 'game';
    onNavigateToLobby: () => void;
    turnNumber: number | null;
}

export function Header({ currentUserName, onLogout, currentView, onNavigateToLobby, turnNumber }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const openSettings = () => {
        setIsMenuOpen(false);
        setIsSettingsOpen(true);
    }
    const closeSettings = () => setIsSettingsOpen(false);

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
            <div className={styles.resources}>
                <div className={styles.resourceItem}>
                    <i className="hbi-dollar-sign"></i>
                    <span>1,234</span>
                </div>
                <div className={styles.resourceItem}>
                    <i className="hbi-award"></i>
                    <span>567</span>
                </div>
            </div>
            <div className={styles.headerActions}>
                <span>{currentUserName} {turnNumber && `(Turn: ${turnNumber})`}</span>
                <MenuButton onClick={toggleMenu} ariaLabel="Open menu" variant="secondary" />
                {isMenuOpen && (
                    <div className={styles.menuDropdown}>
                        {currentView === 'game' && (
                            <>
                                <button className={styles.menuItem} onClick={openSettings}>Game Settings</button>
                                <button className={styles.menuItem} onClick={handleCopyLink}>
                                    {copyStatus === 'copied' ? 'Link Copied!' : 'Copy Game Link'}
                                </button>
                                <button className={styles.menuItem} onClick={() => { onNavigateToLobby(); toggleMenu(); }}>Return to Lobby</button>
                            </>
                        )}
                        {currentView === 'lobby' && (
                             <>
                                <button className={styles.menuItem} onClick={openSettings}>Game Settings</button>
                                <button className={styles.menuItem} onClick={() => { onLogout(); toggleMenu(); }}>Logout</button>
                            </>
                        )}
                        {currentView === 'login' && (
                             <>
                                <button className={styles.menuItem} onClick={openSettings}>Game Settings</button>
                            </>
                        )}
                    </div>
                )}
            </div>
            {isSettingsOpen && <GameSettingsDialog onClose={closeSettings} />}
        </div>
    );
} 
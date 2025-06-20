import { useState } from 'preact/hooks';
import { MenuButton } from '../Button/MenuButton';
import { GameSettingsDialog } from '../GameSettingsDialog/GameSettingsDialog';
import styles from './Header.module.css';

interface HeaderProps {
    currentUserName: string | null;
    onLogout: () => void;
    currentView: 'login' | 'lobby' | 'game';
    onNavigateToLobby: () => void;
}

export function Header({ currentUserName, onLogout, currentView, onNavigateToLobby }: HeaderProps) {
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
            <p className={styles.welcomeMessage}>{currentUserName}</p>
            <div className={styles.headerActions}>
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
                    </div>
                )}
            </div>
            {isSettingsOpen && <GameSettingsDialog onClose={closeSettings} />}
        </div>
    );
} 
import { useState } from 'preact/hooks';
import { MenuButton } from '../Button/MenuButton';
import styles from './Header.module.css';

interface HeaderProps {
    currentUserName: string | null;
    onLogout: () => void;
    currentView: 'login' | 'lobby' | 'game';
    onNavigateToLobby: () => void;
}

export function Header({ currentUserName, onLogout, currentView, onNavigateToLobby }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className={styles.header}>
            <p className={styles.welcomeMessage}>Welcome, {currentUserName}!</p>
            <div className={styles.headerActions}>
                <MenuButton onClick={toggleMenu} ariaLabel="Open menu" variant="secondary" />
                {isMenuOpen && (
                    <div className={styles.menuDropdown}>
                        {currentView === 'game' && (
                            <button className={styles.menuItem} onClick={() => { onNavigateToLobby(); toggleMenu(); }}>Return to Lobby</button>
                        )}
                        <button className={styles.menuItem} onClick={() => { onLogout(); toggleMenu(); }}>Logout</button>
                    </div>
                )}
            </div>
        </div>
    );
} 
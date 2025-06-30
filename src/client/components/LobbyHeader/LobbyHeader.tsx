import { useState } from 'preact/hooks';
import { MenuButton } from '../Button/MenuButton';
import styles from './LobbyHeader.module.css';

interface LobbyHeaderProps {
    currentUserName: string | null;
    onLogout: () => void;
    onOpenSettings: () => void;
}

export function LobbyHeader({ currentUserName, onLogout, onOpenSettings }: LobbyHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className={styles.header}>
            <div></div> {/* Empty div for spacing */}
            <div className={styles.headerActions}>
                <span>{currentUserName}</span>
                <MenuButton onClick={toggleMenu} ariaLabel="Open menu" variant="secondary" />
                {isMenuOpen && (
                    <div className={styles.menuDropdown}>
                        <button className={styles.menuItem} onClick={() => { onOpenSettings(); toggleMenu(); }}>
                            <i class="hbi hbi-settings"></i>
                            <span>Game Settings</span>
                        </button>
                        <button className={styles.menuItem} onClick={() => { onLogout(); toggleMenu(); }}>
                            <i class="hbi hbi-exit"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 
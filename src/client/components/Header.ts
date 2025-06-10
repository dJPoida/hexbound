import { h } from 'preact';
import { useState } from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

interface HeaderProps {
    currentUserName: string | null;
    onLogout: () => void;
    styles: { [key: string]: string };
    currentView: 'lobby' | 'game';
    onNavigateToLobby: () => void;
}

export function Header({ currentUserName, onLogout, styles, currentView, onNavigateToLobby }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return html`
        <div class=${styles.header}>
            <p class=${styles.welcomeMessage}>Welcome, ${currentUserName}!</p>
            <div class=${styles.headerActions}>
                <button class=${styles.hamburgerButton} onClick=${toggleMenu}>
                    <svg fill="#ffffff" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px">
                        <path d="M4 8h24v2h-24zM4 15h24v2h-24zM4 22h24v2h-24z"></path>
                    </svg>
                </button>
                ${isMenuOpen && html`
                    <div class=${styles.menuDropdown}>
                        ${currentView === 'game' && html`
                            <button class=${styles.menuItem} onClick=${() => { onNavigateToLobby(); toggleMenu(); }}>Return to Lobby</button>
                        `}
                        <button class=${styles.menuItem} onClick=${() => { onLogout(); toggleMenu(); }}>Logout</button>
                    </div>
                `}
            </div>
        </div>
    `;
} 
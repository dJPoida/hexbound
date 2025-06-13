import { h } from 'preact';
import { useState } from 'preact/hooks';
import htm from 'htm';
import { MenuButton } from './Button/MenuButton';

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
                ${h(MenuButton, { onClick: toggleMenu, ariaLabel: 'Open menu', variant: 'secondary' })}
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
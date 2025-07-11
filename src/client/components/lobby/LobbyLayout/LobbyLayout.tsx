import { h } from 'preact';

import { AppHeader, AppHeaderView } from '../../ui/AppHeader';
import styles from './LobbyLayout.module.css';

interface LobbyLayoutProps {
    currentUserName: string | null;
    onLogout: () => void;
    onOpenSettings: () => void;
    onNavigateToStyleGuide: () => void;
    onNavigateToUtils: () => void;
    onNavigateToLobby: () => void;
    currentPage: 'lobby' | 'styleguide' | 'utils';
    dialog: h.JSX.Element | null;
    children: h.JSX.Element | null;
}

const getHeaderView = (currentPage: 'lobby' | 'styleguide' | 'utils'): AppHeaderView => {
    switch (currentPage) {
        case 'lobby': return AppHeaderView.LOBBY;
        case 'styleguide': return AppHeaderView.STYLEGUIDE;
        case 'utils': return AppHeaderView.UTILS;
        default: return AppHeaderView.LOBBY;
    }
};

export function LobbyLayout(props: LobbyLayoutProps) {
    const handleNavigate = (path: string) => {
        switch (path) {
            case '/':
                props.onNavigateToLobby();
                break;
            case '/styleguide':
                props.onNavigateToStyleGuide();
                break;
            case '/utils':
                props.onNavigateToUtils();
                break;
        }
    };

    return (
        <div class={styles.lobbyLayout}>
            <AppHeader 
                currentUserName={props.currentUserName} 
                currentView={getHeaderView(props.currentPage)}
                onLogout={props.onLogout} 
                onNavigate={handleNavigate}
                onOpenSettings={props.onOpenSettings}
            />
            <main class={styles.mainContent}>
                {!props.dialog && props.children}
                {props.dialog}
            </main>
        </div>
    );
} 
import { h } from 'preact';
import { LobbyHeader } from '../LobbyHeader/LobbyHeader';
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

export function LobbyLayout(props: LobbyLayoutProps) {
    return (
        <div class={styles.lobbyLayout}>
            <LobbyHeader 
                currentUserName={props.currentUserName} 
                onLogout={props.onLogout} 
                onOpenSettings={props.onOpenSettings}
                onNavigateToStyleGuide={props.onNavigateToStyleGuide}
                onNavigateToUtils={props.onNavigateToUtils}
                onNavigateToLobby={props.onNavigateToLobby}
                currentPage={props.currentPage}
            />
            <main class={styles.mainContent}>
                {!props.dialog && props.children}
                {props.dialog}
            </main>
        </div>
    );
} 
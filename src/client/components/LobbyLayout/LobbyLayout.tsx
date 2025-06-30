import { h } from 'preact';
import { LobbyHeader } from '../LobbyHeader/LobbyHeader';
import { LobbyView } from '../LobbyView/LobbyView';
import styles from './LobbyLayout.module.css';
import { GameListItem } from '../../../shared/types/game.types';

interface LobbyLayoutProps {
    currentUserName: string | null;
    onLogout: () => void;
    onNavigateToGame: (gameId: string, gameCode: string) => void;
    onCreateNewGame: () => void;
    myGames: GameListItem[];
    currentUserId: string | null;
    onOpenSettings: () => void;
    dialog: h.JSX.Element | null;
}

export function LobbyLayout(props: LobbyLayoutProps) {
    return (
        <div class={styles.lobbyLayout}>
            <LobbyHeader 
                currentUserName={props.currentUserName} 
                onLogout={props.onLogout} 
                onOpenSettings={props.onOpenSettings}
            />
            <main class={styles.mainContent}>
                {!props.dialog && (
                    <LobbyView 
                        onNavigateToGame={props.onNavigateToGame}
                        onCreateNewGame={props.onCreateNewGame}
                        myGames={props.myGames}
                        currentUserId={props.currentUserId}
                    />
                )}
                {props.dialog}
            </main>
        </div>
    );
} 
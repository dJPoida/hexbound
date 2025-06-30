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
}

export function LobbyLayout({ currentUserName, onLogout, onNavigateToGame, onCreateNewGame, myGames, currentUserId, onOpenSettings }: LobbyLayoutProps) {
    return (
        <div class={styles.lobbyLayout}>
            <LobbyHeader 
                currentUserName={currentUserName} 
                onLogout={onLogout} 
                onOpenSettings={onOpenSettings}
            />
            <main class={styles.mainContent}>
                <LobbyView 
                    onNavigateToGame={onNavigateToGame}
                    onCreateNewGame={onCreateNewGame}
                    myGames={myGames}
                    currentUserId={currentUserId}
                />
            </main>
        </div>
    );
} 
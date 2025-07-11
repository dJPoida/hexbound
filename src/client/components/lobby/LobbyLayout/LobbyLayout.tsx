import { h } from 'preact';

import styles from './LobbyLayout.module.css';

interface LobbyLayoutProps {
    dialog: h.JSX.Element | null;
    children: h.JSX.Element | null;
}

export function LobbyLayout(props: LobbyLayoutProps) {
    return (
        <div class={styles.lobbyLayout}>
            <main class={styles.mainContent}>
                {!props.dialog && props.children}
                {props.dialog}
            </main>
        </div>
    );
} 
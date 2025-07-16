import { h } from 'preact';
import { useEffect,useState } from 'preact/hooks';

import { ClientGameStatePayload } from '../../../../shared/types/socket';
import { useDialogs } from '../../../contexts/DialogProvider';
import { settingsService } from '../../../services/settings.service';
import { StyleColor } from '../../../types/ui';
import { Button } from '../../ui/Button';
import { ActionBar } from '../ActionBar/ActionBar';
import { Viewport } from '../Viewport/Viewport';
import styles from './GameViewLayout.module.css';

type DialogType = 'gameSettings' | 'incrementCounter' | 'debugInfo';

interface GameViewLayoutProps {
  gameState: ClientGameStatePayload;
  isMapReady: boolean;
  onReady?: () => void;
  onEndTurn: () => void;
  onPushDialog: (dialog: DialogType) => void;
  isMyTurn: boolean;
  currentUserId: string | null;
  dialog: h.JSX.Element | null;
}

export function GameViewLayout({ 
  gameState, 
  isMapReady, 
  onReady, 
  onEndTurn,
  onPushDialog,
  isMyTurn,
  currentUserId,
  dialog
}: GameViewLayoutProps) {
  
  const [settings, setSettings] = useState(settingsService.getSettings());
  const dialogs = useDialogs();

  useEffect(() => {
    const unsubscribe = settingsService.subscribe(setSettings);
    return () => unsubscribe();
  }, []);

  const toggleDebugDialog = () => {
    if (dialogs.getCurrentDialog() === 'debugInfo') {
      dialogs.popDialog();
    } else {
      onPushDialog('debugInfo');
    }
  };
  
  // Check if any players are placeholders
  const hasPlaceholders = gameState.players.some(p => p.isPlaceholder);
  const canEndTurn = isMyTurn && !hasPlaceholders;
  

  
  // Header is now handled at the App level via AppHeader

  const footerContent = (
    <ActionBar>
      <div>
        {settings.showDebugInfo && (
          <Button onClick={toggleDebugDialog} color={StyleColor.DEFAULT} icon="terminal" ariaLabel="Toggle Debug Info" />
        )}
      </div>
      <div>
        <Button 
          onClick={onEndTurn} 
          color={StyleColor.AMBER}
          disabled={!canEndTurn}
        >
          {hasPlaceholders ? 'Waiting for Players' : 'End Turn'}
        </Button>
      </div>
    </ActionBar>
  );
  
  return (
    <div class={styles.gameLayout}>
      <div className={`${styles.fadeOverlay} ${isMapReady ? styles.fadeOut : ''}`}></div>
      <div class={styles.viewportContainer}>
        <Viewport 
            pixiContainerId="pixi-container" 
            gameState={gameState} 
            currentPlayerId={currentUserId}
            onReady={onReady} 
        />
      </div>
      <main class={styles.mainContent}>
        {dialog}
      </main>
      <footer class={styles.footer}>{footerContent}</footer>
    </div>
  );
} 
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './Viewport.module.css';
import { ClientGameStatePayload } from '../../../shared/types/socket.types';
import { renderingService } from '../../services/rendering.service';

interface ViewportProps {
  pixiContainerId: string;
  gameState: ClientGameStatePayload | null;
  currentPlayerId: string | null;
  onReady?: () => void;
}

export function Viewport({ pixiContainerId, gameState, currentPlayerId, onReady }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);

  // This effect handles initialization and subsequent updates.
  useEffect(() => {
    const container = pixiContainerRef.current;
    if (container && gameState && currentPlayerId) {
      const init = async () => {
        await renderingService.initialize(container, gameState, currentPlayerId);
        // We only call update and fade-in *after* initialization is complete.
        renderingService.updateMap(gameState.mapData);
        if (onReady) {
          onReady();
        }
      };
      init();
    }
  }, [gameState, currentPlayerId]); // Updated dependencies

  // This effect handles cleanup when the component unmounts.
  useEffect(() => {
    return () => {
      renderingService.destroy();
    };
  }, []); // Empty dependency array ensures this runs only on unmount.

  return <div id={pixiContainerId} ref={pixiContainerRef} class={styles.viewport}></div>;
} 
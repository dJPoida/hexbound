import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { ClientGameStatePayload } from '../../../../shared/types/socket';
import { useAuth } from '../../../contexts/AuthProvider';
import { useGame } from '../../../contexts/GameProvider';
import { renderingService } from '../../../services/rendering.service';
import styles from './Viewport.module.css';

interface ViewportProps {
  pixiContainerId: string;
  gameState: ClientGameStatePayload | null;
  currentPlayerId: string | null;
  onReady?: () => void;
}

export function Viewport({ pixiContainerId, gameState, currentPlayerId, onReady }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const { mapData, mapChecksum } = useGame();
  const { isLoggedIn } = useAuth();

  // Guard: do not render or run effects unless logged in
  if (!isLoggedIn) return null;

  // This effect handles initialization when game changes.
  useEffect(() => {
    if (!isLoggedIn) return;
    const container = pixiContainerRef.current;
    if (container && gameState && currentPlayerId) {
      // Only initialize rendering service when both game state and map data are available
      if (mapData) {
        const init = async () => {
          // Always destroy any existing rendering service before initializing new game
          renderingService.destroy();
          await renderingService.initialize(container, gameState, mapData, currentPlayerId);

          // Call onReady only after rendering service has finished initializing
          if (onReady) {
            onReady();
          }
        };
        init();
      }
    }
  }, [isLoggedIn, gameState?.gameId, currentPlayerId, mapData]); // Include isLoggedIn in dependencies

  // This effect handles map data updates for the same game.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (mapData && gameState) {
      console.log(
        `[Viewport] Map data updated, calling renderingService.updateMap() for ${mapData.width}x${mapData.height} map`
      );
      renderingService.updateMap(mapData);
    }
  }, [isLoggedIn, mapChecksum, gameState?.gameId]); // Track isLoggedIn

  // This effect handles cleanup when the component unmounts.
  useEffect(() => {
    if (!isLoggedIn) return;
    return () => {
      renderingService.destroy();
    };
  }, [isLoggedIn]); // Only run cleanup if logged in

  return <div id={pixiContainerId} ref={pixiContainerRef} class={styles.viewport}></div>;
}

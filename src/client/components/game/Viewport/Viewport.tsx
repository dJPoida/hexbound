import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { ClientGameStatePayload } from '../../../../shared/types/socket.types';
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

  // This effect handles initialization when game changes.
  useEffect(() => {
    const container = pixiContainerRef.current;
    if (container && gameState && currentPlayerId && mapData) {
      const init = async () => {
        // Always destroy any existing rendering service before initializing new game
        renderingService.destroy();
        
        await renderingService.initialize(container, gameState, mapData, currentPlayerId);
        // We only call update and fade-in *after* initialization is complete.
        renderingService.updateMap(mapData);
        if (onReady) {
          onReady();
        }
      };
      init();
    }
  }, [gameState?.gameId, currentPlayerId, mapChecksum]); // Updated dependencies - track gameId and mapChecksum

  // This effect handles map data updates for the same game.
  useEffect(() => {
    if (mapData) {
      console.log(`[Viewport] Map data updated, calling renderingService.updateMap() for ${mapData.width}x${mapData.height} map`);
      renderingService.updateMap(mapData);
    }
  }, [mapChecksum]); // Track mapChecksum changes for efficiency

  // This effect handles cleanup when the component unmounts.
  useEffect(() => {
    return () => {
      renderingService.destroy();
    };
  }, []); // Empty dependency array ensures this runs only on unmount.

  return <div id={pixiContainerId} ref={pixiContainerRef} class={styles.viewport}></div>;
} 
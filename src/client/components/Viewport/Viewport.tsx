import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './Viewport.module.css';
import { MapData } from '../../../shared/types/game.types';
import { renderingService } from '../../services/rendering.service';

interface ViewportProps {
  pixiContainerId: string;
  mapData: MapData | null;
  gameId: string;
  onReady?: () => void;
}

export function Viewport({ pixiContainerId, mapData, gameId, onReady }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);

  // This effect handles initialization and subsequent updates.
  useEffect(() => {
    const container = pixiContainerRef.current;
    if (container && mapData) {
      const init = async () => {
        await renderingService.initialize(container, mapData, gameId);
        // We only call update and fade-in *after* initialization is complete.
        renderingService.updateMap(mapData);
        if (onReady) {
          onReady();
        }
      };
      init();
    }
  }, [mapData, gameId]); // This correctly runs when mapData is first available and on subsequent changes.

  // This effect handles cleanup when the component unmounts.
  useEffect(() => {
    return () => {
      renderingService.destroy();
    };
  }, []); // Empty dependency array ensures this runs only on unmount.

  return <div id={pixiContainerId} ref={pixiContainerRef} class={styles.viewport}></div>;
} 
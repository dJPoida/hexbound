import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './Viewport.module.css';
import { MapData } from '../../../shared/types/game.types';
import { renderingService } from '../../services/rendering.service';

interface ViewportProps {
  pixiContainerId: string;
  mapData: MapData | null;
  gameId: string;
}

export function Viewport({ pixiContainerId, mapData, gameId }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);

  // This effect handles initialization and subsequent updates.
  useEffect(() => {
    if (pixiContainerRef.current && mapData) {
      renderingService.initialize(pixiContainerRef.current, mapData, gameId);
      renderingService.updateMap(mapData);
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
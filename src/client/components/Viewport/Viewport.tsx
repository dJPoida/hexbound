import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './Viewport.module.css';
import { MapData } from '../../../shared/types/game.types';
import { renderingService } from '../../services/rendering.service';

interface ViewportProps {
  pixiContainerId: string;
  mapData: MapData | null;
}

export function Viewport({ pixiContainerId, mapData }: ViewportProps) {
  const pixiContainerRef = useRef<HTMLDivElement>(null);

  // This effect will run on every render, but the renderingService
  // is now responsible for ensuring initialization only happens once.
  useEffect(() => {
    if (pixiContainerRef.current) {
      renderingService.initialize(pixiContainerRef.current, mapData);
    }
  }); // No dependency array, runs on every render

  // This effect handles cleanup when the component unmounts
  useEffect(() => {
    return () => {
      renderingService.destroy();
    }
  }, []); // Empty dependency array, runs only on unmount

  // This effect handles updates to the map data
  useEffect(() => {
    if (mapData) {
      renderingService.updateMap(mapData);
    }
  }, [mapData]);

  return <div id={pixiContainerId} ref={pixiContainerRef} class={styles.viewport}></div>;
} 
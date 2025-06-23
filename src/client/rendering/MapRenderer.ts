import * as PIXI from 'pixi.js';
import { MapData } from '../../shared/types/game.types';

export class MapRenderer {
  private app: PIXI.Application;
  private mapData: MapData;
  private container: PIXI.Container;

  constructor(app: PIXI.Application, mapData: MapData) {
    this.app = app;
    this.mapData = mapData;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    console.log('[MapRenderer] Initialized.');
  }

  public render(): void {
    console.log('[MapRenderer] Rendering map with data:', this.mapData);
    // Actual rendering logic will be added here in the next steps.
  }
} 
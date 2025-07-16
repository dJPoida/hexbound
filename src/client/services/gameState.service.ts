import { Point } from 'pixi.js';

import { GameViewportState } from '../types/services';

const LOCAL_STORAGE_KEY_PREFIX = 'hexbound-game-state-';

class GameStateService {
  private getStorageKey(gameId: string): string {
    return `${LOCAL_STORAGE_KEY_PREFIX}${gameId}`;
  }

  public saveViewportState(gameId: string, state: GameViewportState): void {
    try {
      const key = this.getStorageKey(gameId);
      const value = JSON.stringify(state);
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[GameStateService] Error saving viewport state to localStorage:', error);
    }
  }

  public loadViewportState(gameId: string): GameViewportState | null {
    try {
      const key = this.getStorageKey(gameId);
      const savedState = localStorage.getItem(key);
      if (savedState) {
        return JSON.parse(savedState) as GameViewportState;
      }
      return null;
    } catch (error) {
      console.error('[GameStateService] Error loading viewport state from localStorage:', error);
      return null;
    }
  }
}

export const gameStateService = new GameStateService(); 
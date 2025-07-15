import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { TerrainType } from '../../../../shared/types/game.types';
import { ClientGameStatePayload } from '../../../../shared/types/socket.types';
import { socketService } from '../../../services/socket.service';
import { StyleColor } from '../../../types/styleColor.type';
import { Button, ButtonVariant } from '../../ui/Button';
import { Dialog, DialogSize } from '../../ui/Dialog';
import { Heading } from '../../ui/Typography/Heading';
import { Text } from '../../ui/Typography/Text';
import styles from './DevToolsDialog.module.css';

export enum DevToolsTab {
  GAME_STATE = 'gameState',
  MAP = 'map',
  PERFORMANCE = 'performance',
  NETWORK = 'network'
}

interface DevToolsDialogProps {
  gameState: ClientGameStatePayload;
  onClose: () => void;
}

export function DevToolsDialog({ gameState, onClose }: DevToolsDialogProps) {
  const [activeTab, setActiveTab] = useState<DevToolsTab>(DevToolsTab.GAME_STATE);
  const [fps, setFps] = useState<number>(0);

  // FPS monitoring
  useEffect(() => {
    if (activeTab !== DevToolsTab.PERFORMANCE) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round(frameCount));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [activeTab]);

  // Calculate map statistics
  const calculateMapStats = () => {
    const { mapData } = gameState;
    const terrainCounts = {} as Record<TerrainType, number>;
    const elevationCounts = {} as Record<number, number>;
    let spawnCount = 0;
    
    // Initialize terrain counts
    Object.values(TerrainType).forEach(terrain => {
      terrainCounts[terrain] = 0;
    });

    // Count terrain types, elevations, and spawns
    mapData.tiles.forEach(tile => {
      terrainCounts[tile.terrain]++;
      elevationCounts[tile.elevation] = (elevationCounts[tile.elevation] || 0) + 1;
      if (tile.playerSpawn !== undefined) {
        spawnCount++;
      }
    });

    const totalTiles = mapData.tiles.length;
    const terrainPercentages = {} as Record<TerrainType, number>;
    Object.entries(terrainCounts).forEach(([terrain, count]) => {
      terrainPercentages[terrain as TerrainType] = (count / totalTiles) * 100;
    });

    return {
      totalTiles,
      terrainCounts,
      terrainPercentages,
      elevationCounts,
      spawnCount,
      elevationRange: {
        min: Math.min(...Object.keys(elevationCounts).map(Number)),
        max: Math.max(...Object.keys(elevationCounts).map(Number))
      }
    };
  };

  const getConnectionStatus = () => {
    // For now, we'll show a placeholder until we can enhance the socket service
    return { text: 'Connected', color: 'var(--color-moss-green)' };
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case DevToolsTab.GAME_STATE: {
        const gameStateJson = JSON.stringify(gameState, null, 2);
        return (
          <div className={styles.tabContent}>
            <div className={styles.gameStateLayout}>
              <div className={styles.gameStateStats}>
                <div className={styles.statSection}>
                  <Heading level={4} variant="subSectionHeader">Game Overview</Heading>
                  <div className={styles.statItem}>
                    <strong>Game ID:</strong> {gameState.gameId}
                  </div>
                  <div className={styles.statItem}>
                    <strong>Game Code:</strong> {gameState.gameCode}
                  </div>
                  <div className={styles.statItem}>
                    <strong>Turn Number:</strong> {gameState.turnNumber}
                  </div>
                  <div className={styles.statItem}>
                    <strong>Current Player:</strong> {gameState.currentPlayerId}
                  </div>
                  <div className={styles.statItem}>
                    <strong>Placeholder Counter:</strong> {gameState.gameState.placeholderCounter}
                  </div>
                </div>

                <div className={styles.statSection}>
                  <Heading level={4} variant="subSectionHeader">Players ({gameState.players.length})</Heading>
                  {gameState.players.map((player, index) => (
                    <div key={player.userId} className={styles.statItem}>
                      <strong>Player {index + 1}:</strong> {player.userName} ({player.userId.substring(0, 8)}...)
                      {player.isPlaceholder && <span style={{ color: 'var(--color-glow-yellow)' }}> [Placeholder]</span>}
                    </div>
                  ))}
                </div>

                <div className={styles.statSection}>
                  <Heading level={4} variant="subSectionHeader">Map Data</Heading>
                  <div className={styles.statItem}>
                    <strong>Dimensions:</strong> {gameState.mapData.width} × {gameState.mapData.height}
                  </div>
                  <div className={styles.statItem}>
                    <strong>Total Tiles:</strong> {gameState.mapData.tiles.length}
                  </div>
                  <div className={styles.statItem}>
                    <strong>Data Size:</strong> {Math.round(gameStateJson.length / 1024)} KB
                  </div>
                  <Button
                    variant={ButtonVariant.STANDARD}
                    color={StyleColor.BLUE}
                    onClick={() => {
                      navigator.clipboard.writeText(gameStateJson);
                    }}
                  >
                    Copy Full JSON
                  </Button>
                </div>
              </div>
              
              <div className={styles.gameStateJson}>
                <div className={styles.statSection}>
                  <Heading level={4} variant="subSectionHeader">Complete Game State (JSON)</Heading>
                  <div className={styles.debugContent}>
                    <pre>{gameStateJson}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case DevToolsTab.MAP: {
        const mapStats = calculateMapStats();
        return (
          <div className={styles.tabContent}>
            <div className={styles.statsGrid}>
              <div className={styles.statSection}>
                <Heading level={4} variant="subSectionHeader">Map Overview</Heading>
                <div className={styles.statItem}>
                  <strong>Dimensions:</strong> {gameState.mapData.width} × {gameState.mapData.height}
                </div>
                <div className={styles.statItem}>
                  <strong>Total Tiles:</strong> {mapStats.totalTiles}
                </div>
                <div className={styles.statItem}>
                  <strong>Player Spawns:</strong> {mapStats.spawnCount}
                </div>
                <div className={styles.statItem}>
                  <strong>Elevation Range:</strong> {mapStats.elevationRange.min} to {mapStats.elevationRange.max}
                </div>
              </div>

              <div className={styles.statSection}>
                <Heading level={4} variant="subSectionHeader">Terrain Distribution</Heading>
                {Object.entries(mapStats.terrainCounts).map(([terrain, count]) => (
                  <div key={terrain} className={styles.statItem}>
                    <strong>{terrain}:</strong> {count} tiles ({mapStats.terrainPercentages[terrain as TerrainType].toFixed(1)}%)
                  </div>
                ))}
              </div>

              <div className={styles.statSection}>
                <Heading level={4} variant="subSectionHeader">Elevation Distribution</Heading>
                {Object.entries(mapStats.elevationCounts).map(([elevation, count]) => (
                  <div key={elevation} className={styles.statItem}>
                    <strong>Level {elevation}:</strong> {count} tiles
                  </div>
                ))}
              </div>
                         </div>
           </div>
         );
       }
              case DevToolsTab.PERFORMANCE:
         return (
           <div className={styles.tabContent}>
             <div className={styles.statSection}>
               <Heading level={4} variant="subSectionHeader">Rendering Performance</Heading>
               <div className={styles.statItem}>
                 <strong>FPS:</strong> <span style={{ color: fps > 50 ? 'var(--color-moss-green)' : fps > 30 ? 'var(--color-glow-yellow)' : 'var(--color-clay-red)' }}>{fps || 'Calculating...'}</span>
               </div>
               <div className={styles.statItem}>
                 <strong>Visible Tiles:</strong> Dynamic (based on viewport)
               </div>
               <div className={styles.statItem}>
                 <strong>Total Sprites:</strong> {gameState.mapData.tiles.length * 3} (3 copies per tile)
               </div>
               <div className={styles.statItem}>
                 <strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}
               </div>
               <Text variant="caption" color="subtle">
                 Performance metrics are updated in real-time. FPS is color-coded: Green (&gt;50), Yellow (30-50), Red (&lt;30).
               </Text>
             </div>
           </div>
         );
                    case DevToolsTab.NETWORK: {
         const connectionStatus = getConnectionStatus();
         return (
           <div className={styles.tabContent}>
             <div className={styles.statsGrid}>
               <div className={styles.statSection}>
                 <Heading level={4} variant="subSectionHeader">WebSocket Connection</Heading>
                 <div className={styles.statItem}>
                   <strong>Status:</strong> <span style={{ color: connectionStatus.color }}>{connectionStatus.text}</span>
                 </div>
                 <div className={styles.statItem}>
                   <strong>Protocol:</strong> {window.location.protocol === 'https:' ? 'WSS (Secure)' : 'WS (Insecure)'}
                 </div>
                 <div className={styles.statItem}>
                   <strong>Host:</strong> {window.location.host}
                 </div>
                 <div className={styles.statItem}>
                   <strong>Connection Time:</strong> {new Date().toLocaleTimeString()}
                 </div>
               </div>

               <div className={styles.statSection}>
                 <Heading level={4} variant="subSectionHeader">Game Session</Heading>
                 <div className={styles.statItem}>
                   <strong>Game ID:</strong> {gameState.gameId}
                 </div>
                 <div className={styles.statItem}>
                   <strong>Game Code:</strong> {gameState.gameCode}
                 </div>
                 <div className={styles.statItem}>
                   <strong>Turn Number:</strong> {gameState.turnNumber}
                 </div>
                 <div className={styles.statItem}>
                   <strong>Current Player:</strong> {gameState.currentPlayerId}
                 </div>
                 <div className={styles.statItem}>
                   <strong>Total Players:</strong> {gameState.players.length}
                 </div>
               </div>

               <div className={styles.statSection}>
                 <Heading level={4} variant="subSectionHeader">Player List</Heading>
                 {gameState.players.map((player, index) => (
                   <div key={player.userId} className={styles.statItem}>
                     <strong>Player {index + 1}:</strong> {player.userName} {player.isPlaceholder ? '(Placeholder)' : ''}
                   </div>
                 ))}
               </div>
             </div>
             <Text variant="caption" color="subtle">
               Network debugging tools will be expanded in future updates with message logs and connection statistics.
             </Text>
           </div>
         );
       }
       default:
         return null;
     }
   };

  return (
    <Dialog title="Dev Tools" onClose={onClose} size={DialogSize.FULLSCREEN}>
      <div className={styles.devToolsContainer}>
        <div className={styles.tabBar}>
          <Button
            variant={ButtonVariant.STANDARD}
            color={activeTab === DevToolsTab.GAME_STATE ? StyleColor.AMBER : StyleColor.DEFAULT}
            onClick={() => setActiveTab(DevToolsTab.GAME_STATE)}
          >
            Game State
          </Button>
          <Button
            variant={ButtonVariant.STANDARD}
            color={activeTab === DevToolsTab.MAP ? StyleColor.AMBER : StyleColor.DEFAULT}
            onClick={() => setActiveTab(DevToolsTab.MAP)}
          >
            Map
          </Button>
          <Button
            variant={ButtonVariant.STANDARD}
            color={activeTab === DevToolsTab.PERFORMANCE ? StyleColor.AMBER : StyleColor.DEFAULT}
            onClick={() => setActiveTab(DevToolsTab.PERFORMANCE)}
          >
            Performance
          </Button>
          <Button
            variant={ButtonVariant.STANDARD}
            color={activeTab === DevToolsTab.NETWORK ? StyleColor.AMBER : StyleColor.DEFAULT}
            onClick={() => setActiveTab(DevToolsTab.NETWORK)}
          >
            Network
          </Button>
        </div>
        {renderTabContent()}
      </div>
    </Dialog>
  );
} 
// Server -> Client: Map update payload

import { MapData } from '../../../map/mapData.type';

// Map update payload sent separately from game state
export interface MapUpdatePayload {
  gameId: string;
  mapData: MapData;
  checksum: string;
}

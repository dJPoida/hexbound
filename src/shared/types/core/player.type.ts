// Core player entity shared between client and server

export interface Player {
  userId: string;
  userName: string;
  isPlaceholder: boolean;
}

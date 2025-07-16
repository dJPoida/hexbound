// Game status types shared between client and server

export const GameStatusValues = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
} as const;

export type GameStatusName = (typeof GameStatusValues)[keyof typeof GameStatusValues];

export interface GameStatus {
  statusId: number;
  statusName: GameStatusName;
}

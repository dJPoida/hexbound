import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Game } from "./Game.entity";

// These values should correspond to the 'statusName' in the 'game_statuses' table
export const GameStatusValues = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
} as const;

export type GameStatusName = typeof GameStatusValues[keyof typeof GameStatusValues];

@Entity({ name: "game_statuses" })
export class GameStatus {
  @PrimaryGeneratedColumn('increment')
  statusId!: number;

  @Column({ type: "varchar", unique: true })
  statusName!: GameStatusName;

  @OneToMany(() => Game, game => game.status)
  games!: Game[];
} 
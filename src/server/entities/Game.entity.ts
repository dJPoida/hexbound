import { Column, Entity, JoinColumn,JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { GameStatus } from "./GameStatus.entity";
import { User } from "./User.entity";

@Entity({ name: "games" })
export class Game {
  @PrimaryGeneratedColumn("uuid")
  gameId!: string;

  @Column({ type: "varchar", unique: true })
  gameCode!: string;

  @ManyToOne(() => GameStatus, status => status.games, { eager: true })
  @JoinColumn({ name: "statusId" })
  status!: GameStatus;

  @Column({ type: "integer", default: 1 })
  currentTurn!: number;

  @ManyToMany(() => User, (user) => user.games)
  @JoinTable({
    name: "game_players",
    joinColumn: {
      name: "game_id",
      referencedColumnName: "gameId",
    },
    inverseJoinColumn: {
      name: "user_id",
      referencedColumnName: "userId",
    },
  })
  players!: User[];
} 
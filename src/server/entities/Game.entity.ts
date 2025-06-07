import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { User } from "./User.entity";

export type GameStatus = "waiting" | "active" | "finished";

@Entity({ name: "games" })
export class Game {
  @PrimaryGeneratedColumn("uuid")
  gameId!: string;

  @Column({ type: "varchar", unique: true })
  gameCode!: string;

  @Column({ type: "varchar", default: "waiting" })
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
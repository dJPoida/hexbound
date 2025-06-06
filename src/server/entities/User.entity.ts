import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  userId!: string;

  @Column({ type: "varchar", length: 20 })
  userName!: string;
} 
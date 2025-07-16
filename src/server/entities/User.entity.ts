import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Game } from './Game.entity';
import { PushSubscription } from './PushSubscription.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  userName!: string;

  @ManyToMany(() => Game, game => game.players)
  games!: Game[];

  @OneToMany(() => PushSubscription, subscription => subscription.user)
  pushSubscriptions!: PushSubscription[];
}

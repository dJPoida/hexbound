import { Column, Entity, Index,JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './User.entity';

@Entity({ name: 'push_subscriptions' })
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.pushSubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column('uuid')
  userId!: string;

  @Column({ type: 'text', unique: true })
  endpoint!: string;

  @Column('varchar')
  p256dh!: string;

  @Column('varchar')
  auth!: string;
} 
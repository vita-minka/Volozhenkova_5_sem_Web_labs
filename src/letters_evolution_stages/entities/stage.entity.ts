import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { LikeEntity } from './like.entity';

@Entity('stages')
export class StageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  videoUrl: string;

  @Column({ type: 'int' })
  century: number;

  @Column({ type: 'varchar', length: 50 })
  sign: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'int', nullable: true })
  creatorId: number;

  @ManyToOne(() => UserEntity, (user) => user.stages, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator: UserEntity;

  @OneToMany(() => LikeEntity, (like) => like.stage)
  likes: LikeEntity[];
}
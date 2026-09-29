import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StageEntity } from './stage.entity';
import { LikeEntity } from './like.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @OneToMany(() => StageEntity, (stage) => stage.creator)
  stages: StageEntity[];

  @OneToMany(() => LikeEntity, (like) => like.user)
  likes: LikeEntity[];
}
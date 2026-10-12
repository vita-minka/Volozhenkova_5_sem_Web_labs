import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StageEntity } from './stage.entity';
import { LikeEntity } from './like.entity';

@Entity('letters_evolution_stages_users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 200 })
  password: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  @OneToMany(() => StageEntity, (stage) => stage.creator)
  stages: StageEntity[];

  @OneToMany(() => LikeEntity, (like) => like.user)
  likes: LikeEntity[];
}
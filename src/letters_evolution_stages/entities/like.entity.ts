import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity';
import { StageEntity } from './stage.entity';

@Entity('letters_evolution_stages_likes')
@Unique(['userId', 'stageId'])
export class LikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  stageId: number;

  @ManyToOne(() => UserEntity, (user) => user.likes)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => StageEntity, (stage) => stage.likes)
  @JoinColumn({ name: 'stageId' })
  stage: StageEntity;
}
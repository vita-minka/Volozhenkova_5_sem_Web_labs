import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettersEvolutionStagesController } from './letters_evolution_stages.controller';
import { LettersEvolutionStagesService } from './letters_evolution_stages.service';
import { StageEntity } from './entities/stage.entity';
import { UserEntity } from './entities/user.entity';
import { LikeEntity } from './entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StageEntity, UserEntity, LikeEntity])],
  controllers: [LettersEvolutionStagesController],
  providers: [LettersEvolutionStagesService],
})
export class LettersEvolutionStagesModule {}
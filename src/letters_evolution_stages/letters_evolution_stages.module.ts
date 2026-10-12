import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettersEvolutionStagesController } from './letters_evolution_stages.controller';
import { LettersEvolutionStagesService } from './letters_evolution_stages.service';
import { MinioService } from './services/minio.service';
import { LikesService } from './services/likes.service';
import { StageEntity } from './entities/stage.entity';
import { UserEntity } from './entities/user.entity';
import { LikeEntity } from './entities/like.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StageEntity, UserEntity, LikeEntity]),
    AuthModule,
  ],
  controllers: [LettersEvolutionStagesController],
  providers: [LettersEvolutionStagesService, MinioService, LikesService],
  exports: [LettersEvolutionStagesService, LikesService, TypeOrmModule],
})
export class LettersEvolutionStagesModule {}
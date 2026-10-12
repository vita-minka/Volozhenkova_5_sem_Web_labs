import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from '../entities/like.entity';
import { StageEntity } from '../entities/stage.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(LikeEntity)
    private likesRepo: Repository<LikeEntity>,
    @InjectRepository(StageEntity)
    private stagesRepo: Repository<StageEntity>,
  ) {}

  async toggle(userId: number, stageId: number, value: number): Promise<{ liked: boolean; count: number }> {
    const stage = await this.stagesRepo.findOne({ where: { id: stageId } });
    if (!stage || stage.status === 'deleted') {
      throw new NotFoundException('Услуга не найдена');
    }

    const existing = await this.likesRepo.findOne({ where: { userId, stageId } });

    if (value === 1 && !existing) {
      await this.likesRepo.save(this.likesRepo.create({ userId, stageId }));
    } else if (value === 0 && existing) {
      await this.likesRepo.remove(existing);
    }

    const count = await this.likesRepo.count({ where: { stageId } });
    return { liked: value === 1, count };
  }

  async countFor(stageId: number): Promise<number> {
    return this.likesRepo.count({ where: { stageId } });
  }

  async isLikedBy(userId: number, stageId: number): Promise<boolean> {
    const found = await this.likesRepo.findOne({ where: { userId, stageId } });
    return !!found;
  }
}
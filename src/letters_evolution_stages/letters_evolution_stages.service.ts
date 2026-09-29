import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { StageEntity } from './entities/stage.entity';

@Injectable()
export class LettersEvolutionStagesService {
  constructor(
    @InjectRepository(StageEntity)
    private stageRepository: Repository<StageEntity>,
  ) {}

  async getPublished(): Promise<StageEntity[]> {
    return this.stageRepository.find({
      where: { status: 'published' },
      relations: { likes: true },
      order: { id: 'ASC' },
    });
  }

  async getAllVisible(): Promise<StageEntity[]> {
    return this.stageRepository.find({
      where: { status: Not('deleted') },
      relations: { likes: true },
      order: { id: 'ASC' },
    });
  }

  async getDraft(): Promise<StageEntity | null> {
    return this.stageRepository.findOne({
      where: { status: 'draft' },
      relations: { likes: true },
    });
  }

  async getById(id: number): Promise<StageEntity | null> {
    return this.stageRepository.findOne({
      where: { id, status: Not('deleted') },
      relations: { likes: true },
    });
  }

  async getByIdRaw(id: number): Promise<StageEntity | null> {
    const rows = await this.stageRepository.query(
      `SELECT * FROM stages WHERE id = $1 AND status != 'deleted'`,
      [id],
    );
    return rows[0] ?? null;
  }

  async getNext(id: number): Promise<StageEntity | null> {
    const published = await this.getPublished();
    const currentIndex = published.findIndex((s) => s.id === id);
    if (currentIndex === -1 || currentIndex === published.length - 1) {
      return published[0] ?? null;
    }
    return published[currentIndex + 1];
  }

  async filterByCentury(century?: number): Promise<StageEntity[]> {
    if (century === undefined || isNaN(century)) {
      return this.getPublished();
    }
    return this.stageRepository.find({
      where: { status: 'published', century },
      relations: { likes: true },
      order: { id: 'ASC' },
    });
  }

  // СОЗДАНИЕ услуги через ORM (POST /add — кнопка «Далее»)
  async createStage(
    title: string,
    imageUrl: string,
    videoUrl: string,
    century: number,
    sign: string,
  ): Promise<StageEntity> {
    const stage = this.stageRepository.create({
      title: title,
      description: 'Описание будет добавлено при публикации',
      imageUrl: imageUrl || '',
      videoUrl: videoUrl || '',
      status: 'draft',
      century: century || 11,
      sign: sign || 'Ять',
      creatorId: 1,
    });
    return this.stageRepository.save(stage);
  }


  // ПУБЛИКАЦИЯ услуги через ORM (POST /publish — кнопка «Опубликовать»)
  async publishStage(
    id: number,
    title: string,
    description: string,
    century: number,
    sign: string,
  ): Promise<StageEntity> {
    const stage = await this.stageRepository.findOne({ where: { id } });
    if (!stage) {
      throw new NotFoundException('Услуга не найдена');
    }
    stage.title = title;
    stage.description = description;
    stage.century = century;
    stage.sign = sign;
    stage.status = 'published';
    return this.stageRepository.save(stage);
  }

  async deleteStage(id: number): Promise<void> {
    await this.stageRepository.query(
      `UPDATE stages SET status = 'deleted' WHERE id = $1`,
      [id],
    );
  }
}
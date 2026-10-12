import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { StageEntity } from './entities/stage.entity';
import { StageResponseDto } from './dto/stage-response.dto';
import { LikesService } from './services/likes.service';

@Injectable()
export class LettersEvolutionStagesService {
  constructor(
    @InjectRepository(StageEntity)
    private stagesRepo: Repository<StageEntity>,
    private likesService: LikesService,
  ) {}

  private async toDto(stage: StageEntity, userId: number): Promise<StageResponseDto> {
    const [likesCount, isLiked] = await Promise.all([
      this.likesService.countFor(stage.id),
      this.likesService.isLikedBy(userId, stage.id),
    ]);
    return {
      id: stage.id,
      title: stage.title,
      description: stage.description,
      status: stage.status,
      imageUrl: stage.imageUrl,
      videoUrl: stage.videoUrl,
      century: stage.century,
      sign: stage.sign,
      createdAt: stage.createdAt,
      likesCount,
      isMine: stage.creatorId === userId,
      isLiked,
    };
  }

  // Список опубликованных с фильтром по веку
  async getPublishedFiltered(century: number | undefined, userId: number): Promise<StageResponseDto[]> {
    const where: any = { status: 'published' };
    if (century !== undefined) where.century = century;
    const stages = await this.stagesRepo.find({ where, order: { id: 'ASC' } });
    return Promise.all(stages.map((s) => this.toDto(s, userId)));
  }

  // Одна строка ленты — сырой SQL (курсор)
  async getFeedRaw(id: number, userId: number): Promise<StageResponseDto | null> {
    const rows = await this.stagesRepo.query(
      `SELECT * FROM letters_evolution_stages WHERE id = $1 AND status = 'published'`,
      [id],
    );
    if (!rows[0]) return null;
    const stage = await this.stagesRepo.findOne({ where: { id: rows[0].id } });
    return stage ? this.toDto(stage, userId) : null;
  }

  // Первая опубликованная
  async getFirstPublished(userId: number): Promise<StageResponseDto | null> {
    const stage = await this.stagesRepo.findOne({ where: { status: 'published' }, order: { id: 'ASC' } });
    return stage ? this.toDto(stage, userId) : null;
  }

  // Следующая опубликованная после id
  async getNext(id: number, userId: number): Promise<StageResponseDto | null> {
    const published = await this.stagesRepo.find({ where: { status: 'published' }, order: { id: 'ASC' } });
    const idx = published.findIndex((s) => s.id === id);
    if (idx === -1 || idx === published.length - 1) {
      return published[0] ? this.toDto(published[0], userId) : null;
    }
    return this.toDto(published[idx + 1], userId);
  }

  // Черновик текущего пользователя
  async getDraft(userId: number): Promise<StageResponseDto | null> {
    const stage = await this.stagesRepo.findOne({
      where: { status: 'draft', creatorId: userId },
      order: { id: 'DESC' },
    });
    return stage ? this.toDto(stage, userId) : null;
  }

  // Создание черновика через ORM
  async createDraft(
    userId: number,
    title: string,
    century: number,
    sign: string,
    imageFile?: Express.Multer.File,
    videoFile?: Express.Multer.File,
    minioUpload?: (file: Express.Multer.File, prefix: string) => Promise<string>,
  ): Promise<StageResponseDto> {
    const existing = await this.getDraft(userId);
    if (existing) {
      throw new BadRequestException('Черновик уже существует');
    }

    let imageUrl = '';
    let videoUrl = '';

    if (imageFile && minioUpload) {
      imageUrl = await minioUpload(imageFile, 'img');
    }
    if (videoFile && minioUpload) {
      videoUrl = await minioUpload(videoFile, 'vid');
    }

    const stage = this.stagesRepo.create({
      title,
      description: 'Описание будет добавлено при публикации',
      status: 'draft',
      century,
      sign,
      imageUrl,
      videoUrl,
      creatorId: userId,
    });
    const saved = await this.stagesRepo.save(stage);
    return this.toDto(saved, userId);
  }

  // Публикация через ORM
  async publish(
    userId: number,
    title: string,
    description: string,
    century: number,
    sign: string,
  ): Promise<StageResponseDto> {
    const draft = await this.stagesRepo.findOne({
      where: { status: 'draft', creatorId: userId },
    });
    if (!draft) {
      throw new NotFoundException('Черновик не найден');
    }
    draft.title = title;
    draft.description = description;
    draft.century = century;
    draft.sign = sign;
    draft.status = 'published';
    const saved = await this.stagesRepo.save(draft);
    return this.toDto(saved, userId);
  }

  // Мягкое удаление через сырой SQL UPDATE
  async softDelete(stageId: number, userId: number): Promise<void> {
    const stage = await this.stagesRepo.findOne({ where: { id: stageId } });
    if (!stage || stage.status === 'deleted') {
      throw new NotFoundException('Услуга не найдена');
    }
    if (stage.creatorId !== userId) {
      throw new BadRequestException('Можно удалять только свои услуги');
    }
    await this.stagesRepo.query(
      `UPDATE letters_evolution_stages SET status = 'deleted' WHERE id = $1`,
      [stageId],
    );
  }
}
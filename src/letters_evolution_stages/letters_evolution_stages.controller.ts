import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, Render,
  UseInterceptors, UploadedFiles, Req, Res, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import express from 'express';
import { LettersEvolutionStagesService } from './letters_evolution_stages.service';
import { MinioService } from './services/minio.service';
import { LikesService } from './services/likes.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { PublishStageDto } from './dto/publish-stage.dto';
import { StageFiltersDto } from './dto/stage-filters.dto';
import { LikeDto } from './dto/like.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { SessionService } from '../session/session.service';

@ApiTags('stages')
@Controller()
export class LettersEvolutionStagesController {
  constructor(
    private readonly service: LettersEvolutionStagesService,
    private readonly minio: MinioService,
    private readonly likes: LikesService,
    private readonly sessions: SessionService,
  ) {}

  // Определение пользователя: из cookie или fallback = 1
  private async resolveUserId(req: express.Request): Promise<number> {
    const sid = req.cookies?.sessionId;
    if (!sid) return 1;
    const userId = await this.sessions.getUserId(sid);
    return userId ?? 1;
  }

  // ============ HTML страницы ============

  @Get('feed')
  @Render('feed')
  async feedPage(@Req() req: express.Request, @Query('id') idQ?: string, @Query('next') next?: string) {
    const userId = await this.resolveUserId(req);
    let stage = null;
    if (idQ) stage = await this.service.getFeedRaw(Number(idQ), userId);
    if (!stage) stage = await this.service.getFirstPublished(userId);
    if (next === 'true' && stage) stage = await this.service.getNext(stage.id, userId) ?? stage;
    return { title: 'Лента', stage, activeTab: 'feed' };
  }

  @Get('feed/:id')
  @Render('feed')
  async feedByIdPage(@Req() req: express.Request, @Param('id') id: string, @Query('next') next?: string) {
    const userId = await this.resolveUserId(req);
    let stage = await this.service.getFeedRaw(Number(id), userId);
    if (!stage) stage = await this.service.getFirstPublished(userId);
    if (next === 'true' && stage) stage = await this.service.getNext(stage.id, userId) ?? stage;
    return { title: 'Лента', stage, activeTab: 'feed' };
  }

  @Get('add')
  @Render('add')
  async addPage(@Req() req: express.Request) {
    const userId = await this.resolveUserId(req);
    const draft = await this.service.getDraft(userId);
    return { title: 'Добавление', stage: draft, activeTab: 'add' };
  }

  @Get('stages')
@Render('tile')
async tilePage(@Req() req: express.Request, @Query('date') date?: string) {
  const userId = await this.resolveUserId(req);

  // Преобразуем дату → век
  let century: number | undefined = undefined;
  if (date && date.trim() !== '') {
    const year = new Date(date).getFullYear();
    if (!isNaN(year) && year > 0) {
      century = Math.ceil(year / 100);
    }
  }

  const stages = await this.service.getPublishedFiltered(century, userId);
  return {
    title: 'Этапы эволюции',
    stages,
    dateFilter: date ?? '',
    activeTab: 'stages',
  };
}

  // HTML-формы
  @Post('add')
  @UseInterceptors(FileFieldsInterceptor(
    [{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }],
    { storage: memoryStorage(), limits: { fileSize: 100 * 1024 * 1024, files: 2 } },
  ))
  async addForm(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Body() body: CreateStageDto,
  ) {
    const userId = await this.resolveUserId(req);
    const files = req.files as any;
    await this.service.createDraft(
      userId,
      body.title,
      Number(body.century) || 11,
      body.sign || 'Ять',
      files?.image?.[0],
      files?.video?.[0],
      (f, p) => this.minio.uploadFile(f, p),
    );
    res.redirect('/add');
  }

  @Post('publish')
  async publishForm(@Req() req: express.Request, @Body() body: any, @Res() res: express.Response) {
    const userId = await this.resolveUserId(req);
    await this.service.publish(
      userId,
      body.title,
      body.description,
      Number(body.century),
      body.sign,
    );
    res.redirect('/stages');
  }

  @Post('delete-stage')
  async deleteForm(@Req() req: express.Request, @Body() body: { stage_id: string }, @Res() res: express.Response) {
    const userId = await this.resolveUserId(req);
    await this.service.softDelete(Number(body.stage_id), userId);
    res.redirect('/stages');
  }

  // ============ REST API ============

  @Get('api/stages')
  @ApiOperation({ summary: 'Список опубликованных услуг (с фильтром по веку)' })
  async apiList(@Req() req: express.Request, @Query() filters: StageFiltersDto) {
    const userId = await this.resolveUserId(req);
    return this.service.getPublishedFiltered(filters.century, userId);
  }

  @Get('api/feed')
  @ApiOperation({ summary: 'Лента: одна карточка (по id или первая), ?next=true — следующая' })
  async apiFeed(
    @Req() req: express.Request,
    @Query('id') id?: string,
    @Query('next') next?: string,
  ) {
    const userId = await this.resolveUserId(req);
    let stage = id ? await this.service.getFeedRaw(Number(id), userId) : null;
    if (!stage) stage = await this.service.getFirstPublished(userId);
    if (next === 'true' && stage) stage = await this.service.getNext(stage.id, userId) ?? stage;
    return stage;
  }

  @Get('api/stages/draft')
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Черновик текущего пользователя (требует авторизации)' })
  async apiDraft(@Req() req: express.Request & { user?: { id: number } }) {
    const userId = req.user!.id;
    return this.service.getDraft(userId);
  }

  @Post('api/stages')
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileFieldsInterceptor(
    [{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }],
    { storage: memoryStorage(), limits: { fileSize: 100 * 1024 * 1024, files: 2 } },
  ))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        century: { type: 'integer' },
        sign: { type: 'string' },
        image: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Создать черновик с загрузкой файлов в MinIO (требует авторизации)' })
  async apiCreate(
    @Req() req: express.Request & { user?: { id: number } },
    @Body() body: CreateStageDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    const userId = req.user!.id;
    return this.service.createDraft(
      userId,
      body.title,
      Number(body.century) || 11,
      body.sign || 'Ять',
      files?.image?.[0],
      files?.video?.[0],
      (f, p) => this.minio.uploadFile(f, p),
    );
  }

  @Put('api/stages/publish')
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Опубликовать черновик (требует авторизации)' })
  async apiPublish(
    @Req() req: express.Request & { user?: { id: number } },
    @Body() body: PublishStageDto,
  ) {
    const userId = req.user!.id;
    return this.service.publish(userId, body.title, body.description, body.century, body.sign);
  }

  @Delete('api/stages/:id')
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Soft-delete через SQL UPDATE (требует авторизации)' })
  async apiDelete(
    @Req() req: express.Request & { user?: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user!.id;
    await this.service.softDelete(id, userId);
    return { message: `Услуга ${id} удалена`, status: 'success' };
  }

  @Post('api/stages/:id/like')
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Лайк (value=1) или снять (value=0) (требует авторизации)' })
  async apiLike(
    @Req() req: express.Request & { user?: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeDto,
  ) {
    const userId = req.user!.id;
    return this.likes.toggle(userId, id, dto.value);
  }
}
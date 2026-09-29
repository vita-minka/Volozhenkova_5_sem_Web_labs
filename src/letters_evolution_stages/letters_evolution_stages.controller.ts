import { Controller, Get, Post, Param, Query, Render, Body, Redirect } from '@nestjs/common';
import { LettersEvolutionStagesService } from './letters_evolution_stages.service';

@Controller()
export class LettersEvolutionStagesController {
  constructor(private readonly service: LettersEvolutionStagesService) {}

  @Get('feed')
  @Render('feed')
  async feed(@Query('id') idQuery?: string, @Query('next') next?: string) {
    let id = idQuery ? Number(idQuery) : undefined;
    let stage = id !== undefined ? await this.service.getByIdRaw(id) : null;

    if (!stage) {
      const published = await this.service.getPublished();
      stage = published[0];
    }

    if (next === 'true' && stage) {
      stage = await this.service.getNext(stage.id) ?? stage;
    }

    return { title: 'Лента', stage, activeTab: 'feed' };
  }

  @Get('feed/:id')
  @Render('feed')
  async feedById(@Param('id') id: string, @Query('next') next?: string) {
    let stage = await this.service.getByIdRaw(Number(id));
    if (!stage) {
      const published = await this.service.getPublished();
      stage = published[0];
    }
    if (next === 'true' && stage) {
      stage = await this.service.getNext(stage.id) ?? stage;
    }
    return { title: 'Лента', stage, activeTab: 'feed' };
  }

  @Get('add')
  @Render('add')
  async add() {
    const draft = await this.service.getDraft();
    return { title: 'Добавление', stage: draft, activeTab: 'add' };
  }

  @Get('stages')
  @Render('tile')
  async tile(@Query('century') century?: string) {
    const centuryNum = century !== undefined && century !== ''
      ? Number(century)
      : undefined;
    return {
      title: 'Этапы эволюции',
      stages: await this.service.filterByCentury(centuryNum),
      centuryFilter: century ?? '',
      activeTab: 'stages',
    };
  }

  // POST /add — создание черновика (кнопка «Далее»)
  @Post('add')
  @Redirect('/add', 302)
  async createDraft(@Body() body: {
    title: string;
    imageUrl?: string;
    videoUrl?: string;
    century?: string;
    sign?: string;
  }) {
    const century = body.century ? parseInt(body.century, 10) : 11;
    await this.service.createStage(
      body.title,
      body.imageUrl || '',
      body.videoUrl || '',
      century,
      body.sign || 'Ять',
    );
  }

  // POST /publish — публикация черновика (кнопка «Опубликовать»)
  @Post('publish')
  @Redirect('/stages', 302)
  async publish(@Body() body: {
    id: string;
    title: string;
    description: string;
    century: string;
    sign: string;
  }) {
    const id = parseInt(body.id, 10);
    const century = parseInt(body.century, 10);
    if (!isNaN(id) && !isNaN(century)) {
      await this.service.publishStage(id, body.title, body.description, century, body.sign);
    }
  }

  // POST /delete-stage — удаление через SQL UPDATE
  @Post('delete-stage')
  @Redirect('/stages', 302)
  async deleteStage(@Body() body: { stage_id: string }) {
    const id = parseInt(body.stage_id, 10);
    if (!isNaN(id)) {
      await this.service.deleteStage(id);
    }
  }
}
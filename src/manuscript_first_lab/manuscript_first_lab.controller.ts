import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import { ManuscriptFirstLabService } from './manuscript_first_lab.service';

@Controller()
export class ManuscriptFirstLabController {
  constructor(private readonly service: ManuscriptFirstLabService) {}

  // GET /feed  или  /feed/:id  или  /feed/:id?next=true
  @Get('feed')
  @Render('feed')
  feed(@Query('id') idQuery?: string, @Query('next') next?: string) {
    let id = idQuery ? Number(idQuery) : undefined;
    let manuscript = id !== undefined ? this.service.getById(id) : undefined;

    if (!manuscript) {
      const published = this.service.getPublished();
      manuscript = published[0];
    }

    if (next === 'true' && manuscript) {
      manuscript = this.service.getNext(manuscript.id) ?? manuscript;
    }

    return {
      title: 'Лента',
      manuscript,
      activeTab: 'feed',
    };
  }

  @Get('feed/:id')
  @Render('feed')
  feedById(@Param('id') id: string, @Query('next') next?: string) {
    let manuscript = this.service.getById(Number(id));
    if (!manuscript) {
      manuscript = this.service.getPublished()[0];
    }
    if (next === 'true') {
      manuscript = this.service.getNext(manuscript.id) ?? manuscript;
    }
    return {
      title: 'Лента',
      manuscript,
      activeTab: 'feed',
    };
  }

  @Get('add')
  @Render('add')
  add() {
    const draft = this.service.getDraft();
    return {
      title: 'Добавление',
      manuscript: draft,
      activeTab: 'add',
    };
  }

  @Get('manuscripts')
  @Render('tile')
  tile(@Query('century') century?: string) {
    const centuryNum = century !== undefined && century !== ''
      ? Number(century)
      : undefined;
    return {
      title: 'Рукописи',
      manuscripts: this.service.filterByCentury(centuryNum),
      centuryFilter: century ?? '',
      activeTab: 'manuscripts',
    };
  }
}
import { Module } from '@nestjs/common';
import { ManuscriptFirstLabService } from './manuscript_first_lab.service';
import { ManuscriptFirstLabController } from './manuscript_first_lab.controller';

@Module({
  controllers: [ManuscriptFirstLabController],
  providers: [ManuscriptFirstLabService],
})
export class ManuscriptFirstLabModule {}
import { Module } from '@nestjs/common';
import { ManuscriptFirstLabModule } from './manuscript_first_lab/manuscript_first_lab.module';

@Module({
  imports: [ManuscriptFirstLabModule],
})
export class AppModule {}
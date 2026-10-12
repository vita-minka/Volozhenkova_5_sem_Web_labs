import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class LikeDto {
  @ApiProperty({ example: 1, description: '0 — снять лайк, 1 — поставить' })
  @IsIn([0, 1])
  value: number;
}
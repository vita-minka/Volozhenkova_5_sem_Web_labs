import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PublishStageDto {
  @ApiProperty({ example: 'Ранний устав: начертание «ять» XI века' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Развёрнутое описание' })
  @IsString()
  description: string;

  @ApiProperty({ example: 11 })
  @Type(() => Number)
  @IsInt()
  century: number;

  @ApiProperty({ example: 'Ять' })
  @IsString()
  sign: string;
}
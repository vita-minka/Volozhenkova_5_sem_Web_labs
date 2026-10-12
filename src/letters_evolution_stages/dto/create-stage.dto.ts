import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStageDto {
  @ApiProperty({ example: 'Ранний устав: начертание «ять» XI века' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Описание', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 11 })
  @Type(() => Number)
  @IsInt()
  century: number;

  @ApiProperty({ example: 'Ять' })
  @IsString()
  sign: string;
}
import { ApiProperty } from '@nestjs/swagger';

export class StageResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty() status: string;
  @ApiProperty({ nullable: true }) imageUrl: string | null;
  @ApiProperty({ nullable: true }) videoUrl: string | null;
  @ApiProperty() century: number;
  @ApiProperty() sign: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() likesCount: number;
  @ApiProperty() isMine: boolean;
  @ApiProperty() isLiked: boolean;
}
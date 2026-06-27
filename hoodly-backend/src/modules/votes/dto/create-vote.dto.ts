import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsMongoId,
  IsBoolean,
} from 'class-validator';

export class CreateVoteDto {
  @ApiProperty({ description: 'ID de la zone où le vote a lieu' })
  @IsMongoId()
  @IsNotEmpty()
  zoneId!: string;

  @ApiProperty({ description: 'Titre ou question du vote' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Description facultative du vote' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Options de réponse disponibles',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2, { message: 'Il faut au moins 2 options de vote' })
  options!: string[];

  @ApiPropertyOptional({ description: 'Date de fin du vote (ISO string)' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Indique si le vote est anonyme',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

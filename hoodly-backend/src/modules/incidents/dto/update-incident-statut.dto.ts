import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidentStatus } from '../enums/incident-status.enum';

export class UpdateIncidentStatutDto {
  @ApiProperty({ description: 'Nouveau statut', enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  statut!: IncidentStatus;
}

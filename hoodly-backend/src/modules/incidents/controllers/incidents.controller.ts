import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { IncidentsService } from '../services/incidents.service';
import { Incident } from '../schemas/incident.schema';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { UpdateIncidentStatutDto } from '../dto/update-incident-statut.dto';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les incidents' })
  @ApiResponse({ status: 200, description: 'Liste des incidents' })
  findAll(@Query('zoneId') zoneId?: string): Promise<Incident[]> {
    return this.incidentsService.findAll(zoneId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un incident' })
  @ApiResponse({ status: 201, description: 'Incident créé' })
  create(@Body() body: CreateIncidentDto): Promise<Incident> {
    return this.incidentsService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un incident' })
  @ApiResponse({ status: 200, description: 'Incident mis à jour' })
  updateStatut(
    @Param('id') id: string,
    @Body() body: UpdateIncidentStatutDto,
  ): Promise<Incident> {
    return this.incidentsService.updateStatut(id, body);
  }
}

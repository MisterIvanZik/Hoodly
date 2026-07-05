import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from '../services/events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { VerifiedGuard } from '../../../core/auth/guards/verified.guard';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtGuard, VerifiedGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un événement' })
  @ApiResponse({ status: 201, type: EventResponseDto })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.eventsService.create(createEventDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les événements' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categorie', required: false })
  @ApiQuery({ name: 'statut', required: false })
  @ApiResponse({ status: 200, type: [EventResponseDto] })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categorie') categorie?: string,
    @Query('statut') statut?: string,
  ) {
    return this.eventsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      search,
      categorie,
      statut,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un événement par ID' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  async findOne(@Param('id', MongoIdValidationPipe) id: string) {
    const event = await this.eventsService.findById(id);
    if (!event) throw new NotFoundException('Événement introuvable');
    return event;
  }

  @Post(':id/interet')
  @ApiOperation({ summary: "Toggler l'intérêt pour un événement (swipe)" })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: '{ interested: boolean }' })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  async toggleInteret(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.eventsService.toggleInteret(id, user.userId);
  }

  @Post(':id/participer')
  @ApiOperation({ summary: "S'inscrire / se désinscrire d'un événement" })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: '{ participating: boolean }' })
  @ApiResponse({ status: 400, description: 'Événement complet ou créateur' })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  async participer(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.eventsService.participer(id, user.userId);
  }

  @Post(':id/valider')
  @ApiOperation({ summary: "Valider l'événement et distribuer les points" })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  async valider(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { presentIds: string[] },
    @CurrentUser() user: { userId: string },
  ) {
    return this.eventsService.valider(id, user.userId, body.presentIds ?? []);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un événement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  async update(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un événement' })
  @ApiParam({ name: 'id', description: 'ID MongoDB' })
  @ApiResponse({ status: 200, description: 'Événement supprimé' })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  async remove(@Param('id', MongoIdValidationPipe) id: string) {
    return this.eventsService.delete(id);
  }
}

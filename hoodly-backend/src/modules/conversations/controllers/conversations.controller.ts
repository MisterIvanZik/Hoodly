import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Param, 
  Body, 
  UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse 
} from '@nestjs/swagger';
import { ConversationsService } from '../services/conversations.service';
import { JwtGuard } from '../../../core/auth/guards/jwt.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { MongoIdValidationPipe } from '../../../shared/pipes/mongo-id-validation.pipe';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Démarrer ou récupérer une conversation pour un service' })
  @ApiResponse({ status: 201, description: 'Conversation initialisée' })
  async create(
    @Body() body: { serviceId?: string; destinataireId: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.getOrCreate(body.serviceId, user.userId, body.destinataireId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lister toutes mes conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  async findMe(@CurrentUser() user: { userId: string }) {
    return this.conversationsService.getUserConversations(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer les détails d\'une conversation' })
  @ApiResponse({ status: 200, description: 'Détails de la conversation' })
  async findOne(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.findOne(id, user.userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Récupérer l\'historique des messages d\'une conversation' })
  @ApiResponse({ status: 200, description: 'Historique des messages' })
  async getMessages(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.getMessages(id, user.userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envoyer un message dans une conversation' })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  async sendMessage(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { content: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.sendMessage(id, user.userId, body.content);
  }

  @Patch(':id/creneau/proposer')
  @ApiOperation({ summary: 'Proposer un créneau de rendez-vous pour la prestation' })
  @ApiResponse({ status: 200, description: 'Créneau proposé avec succès' })
  async proposerCreneau(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() body: { date: string; debut: string; fin: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.proposerCreneau(
      id,
      user.userId,
      body.date,
      body.debut,
      body.fin,
    );
  }

  @Patch(':id/creneau/accepter')
  @ApiOperation({ summary: 'Accepter le créneau de rendez-vous proposé' })
  @ApiResponse({ status: 200, description: 'Créneau validé et rendez-vous planifié' })
  async accepterCreneau(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.accepterCreneau(id, user.userId);
  }

  @Patch(':id/creneau/refuser')
  @ApiOperation({ summary: 'Décliner le créneau de rendez-vous proposé' })
  @ApiResponse({ status: 200, description: 'Créneau refusé' })
  async refuserCreneau(
    @Param('id', MongoIdValidationPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.conversationsService.refuserCreneau(id, user.userId);
  }
}

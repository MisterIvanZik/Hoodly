import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteActionDto } from './dto/vote-action.dto';
import { JwtGuard } from '../../core/auth/guards/jwt.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
  zoneId?: string;
  [key: string]: unknown;
}

@ApiTags('Votes')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau vote dans un quartier' })
  @ApiResponse({ status: 201, description: 'Le vote a été créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données de requête invalides' })
  @ApiResponse({
    status: 403,
    description: "L'utilisateur n'appartient pas au quartier",
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createVoteDto: CreateVoteDto,
  ) {
    return this.votesService.create(user.userId, createVoteDto);
  }

  @Get('zone/:zoneId')
  @ApiOperation({ summary: 'Récupérer tous les votes d’un quartier' })
  @ApiResponse({ status: 200, description: 'Liste des votes du quartier' })
  async findAllByZone(
    @Param('zoneId') zoneId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const votes = await this.votesService.findAllByZone(
      zoneId,
      user.userId,
      user.role,
    );
    return votes.map((vote) => this.sanitizeVote(vote, user.userId, user.role));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d’un vote' })
  @ApiResponse({ status: 200, description: 'Détails du vote' })
  @ApiResponse({ status: 404, description: 'Vote introuvable' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const vote = await this.votesService.findOne(id);
    return this.sanitizeVote(vote, user.userId, user.role);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Voter pour une option' })
  @ApiResponse({ status: 200, description: 'Vote enregistré avec succès' })
  @ApiResponse({ status: 400, description: 'Double vote ou scrutin clos' })
  @ApiResponse({
    status: 403,
    description: "L'utilisateur n'appartient pas à la zone du vote",
  })
  @ApiResponse({ status: 404, description: 'Vote introuvable' })
  async vote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() voteActionDto: VoteActionDto,
  ) {
    const vote = await this.votesService.vote(
      id,
      user.userId,
      voteActionDto.option,
    );
    return this.sanitizeVote(vote, user.userId, user.role);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Clore manuellement un scrutin' })
  @ApiResponse({ status: 200, description: 'Le scrutin a été clos' })
  @ApiResponse({ status: 403, description: 'Action non autorisée' })
  @ApiResponse({ status: 404, description: 'Vote introuvable' })
  async close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const vote = await this.votesService.close(id, user.userId, user.role);
    return this.sanitizeVote(vote, user.userId, user.role);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approuver une proposition de vote' })
  @ApiResponse({ status: 200, description: 'Le scrutin a été approuvé' })
  @ApiResponse({ status: 403, description: 'Action non autorisée' })
  @ApiResponse({ status: 404, description: 'Vote introuvable' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { isAnonymous?: boolean },
  ) {
    if (user.role !== 'moderator' && user.role !== 'admin') {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à approuver ce vote",
      );
    }
    const vote = await this.votesService.approve(
      id,
      user.userId,
      body.isAnonymous,
    );
    return this.sanitizeVote(vote, user.userId, user.role);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rejeter une proposition de vote' })
  @ApiResponse({ status: 200, description: 'Le scrutin a été rejeté' })
  @ApiResponse({ status: 403, description: 'Action non autorisée' })
  @ApiResponse({ status: 404, description: 'Vote introuvable' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { reason: string },
  ) {
    if (user.role !== 'moderator' && user.role !== 'admin') {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à rejeter ce vote",
      );
    }
    if (!body.reason || body.reason.trim() === '') {
      throw new BadRequestException('Un motif de refus est requis');
    }
    const vote = await this.votesService.reject(id, user.userId, body.reason);
    return this.sanitizeVote(vote, user.userId, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un vote' })
  @ApiResponse({ status: 200, description: 'Le vote a été supprimé' })
  @ApiResponse({ status: 403, description: 'Action non autorisée' })
  @ApiResponse({ status: 404, description: 'Vote introuvable' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.delete(id, user.userId, user.role);
  }

  private sanitizeVote(vote: any, userId: string, role: string) {
    const voteObj = vote.toObject ? vote.toObject() : vote;
    if (voteObj.isAnonymous) {
      voteObj.votedUsers = voteObj.votedUsers.map((v: any) => ({
        option: v.option,
        votedAt: v.votedAt,
      }));
    }
    return voteObj;
  }
}

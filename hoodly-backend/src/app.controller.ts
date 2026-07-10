import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppService } from './app.service';
import { Public } from './core/auth/decorators/public.decorator';
import { Neo4jService } from './modules/neo4j/neo4j.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
    private readonly neo4jService: Neo4jService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Hello World' })
  @ApiResponse({ status: 200, description: 'Message de bienvenue' })
  getHello(): { message: string } {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check dynamique (MongoDB & Neo4j)' })
  @ApiResponse({
    status: 200,
    description: "Statut de l'API et des bases de données",
  })
  @ApiResponse({
    status: 503,
    description: 'Une des bases de données est hors ligne',
  })
  async getHealth() {
    let mongodbStatus = 'down';
    let neo4jStatus = 'down';

    try {
      if (this.connection.readyState === 1) {
        mongodbStatus = 'up';
      }
    } catch {
      mongodbStatus = 'down';
    }

    try {
      await this.neo4jService.run('RETURN 1');
      neo4jStatus = 'up';
    } catch {
      neo4jStatus = 'down';
    }

    const report = {
      status: mongodbStatus === 'up' && neo4jStatus === 'up' ? 'ok' : 'error',
      databases: {
        mongodb: mongodbStatus,
        neo4j: neo4jStatus,
      },
    };

    if (report.status === 'error') {
      throw new ServiceUnavailableException(report);
    }

    return report;
  }
}

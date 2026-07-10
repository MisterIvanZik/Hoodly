import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jService } from './modules/neo4j/neo4j.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: {
            readyState: 1,
          },
        },
        {
          provide: Neo4jService,
          useValue: {
            run: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toEqual({ message: 'Hello World!' });
    });
  });

  describe('health', () => {
    it('should return health report when databases are up', async () => {
      const result = await appController.getHealth();
      expect(result).toEqual({
        status: 'ok',
        databases: {
          mongodb: 'up',
          neo4j: 'up',
        },
      });
    });
  });
});


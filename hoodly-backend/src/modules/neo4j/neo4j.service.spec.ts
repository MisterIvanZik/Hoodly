import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import neo4j from 'neo4j-driver';

// Mock neo4j-driver
jest.mock('neo4j-driver', () => {
  const mockSession = {
    run: jest.fn().mockResolvedValue({
      records: [
        {
          get: jest.fn().mockReturnValue('event_123'),
        },
      ],
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const mockDriver = {
    session: jest.fn().mockReturnValue(mockSession),
    verifyConnectivity: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  return {
    __esModule: true,
    default: {
      driver: jest.fn().mockReturnValue(mockDriver),
      auth: {
        basic: jest.fn(),
      },
    },
  };
});

describe('Neo4jService', () => {
  let service: Neo4jService;
  let mockDriver: any;
  let mockSession: any;

  const mockConfigService = {
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'NEO4J_DATABASE') return 'neo4j';
      if (key === 'NEO4J_URI') return 'bolt://localhost:7687';
      if (key === 'NEO4J_USERNAME') return 'neo4j';
      if (key === 'NEO4J_PASSWORD') return 'password';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Neo4jService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<Neo4jService>(Neo4jService);
    mockDriver = (neo4j.driver as jest.Mock).mock.results[0].value;
    mockSession = mockDriver.session();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyConnectivity', () => {
    it('should call verifyConnectivity on driver successfully', async () => {
      await service.verifyConnectivity();
      expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
    });

    it('should log error if verifyConnectivity throws', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      mockDriver.verifyConnectivity.mockRejectedValueOnce(new Error('Conn failed'));
      await expect(service.verifyConnectivity()).resolves.toBeUndefined();
      loggerSpy.mockRestore();
    });
  });

  describe('run', () => {
    it('should run cypher query and return results, closing the session', async () => {
      const result = await service.run('MATCH (n) RETURN n', { param: 1 });
      expect(result).toBeDefined();
      expect(mockDriver.session).toHaveBeenCalledWith({ database: 'neo4j' });
      expect(mockSession.run).toHaveBeenCalledWith('MATCH (n) RETURN n', { param: 1 });
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('syncInteret', () => {
    it('should run MERGE query for interest', () => {
      service.syncInteret('user1', 'event1', 'sport');
      expect(mockSession.run).toHaveBeenCalled();
    });
  });

  describe('removeInteret', () => {
    it('should run DELETE relationship query for interest', () => {
      service.removeInteret('user1', 'event1');
      expect(mockSession.run).toHaveBeenCalled();
    });
  });

  describe('syncParticipation', () => {
    it('should run MERGE query for participation', () => {
      service.syncParticipation('user1', 'event1', 'sport');
      expect(mockSession.run).toHaveBeenCalled();
    });
  });

  describe('removeParticipation', () => {
    it('should run DELETE relationship query for participation', () => {
      service.removeParticipation('user1', 'event1');
      expect(mockSession.run).toHaveBeenCalled();
    });
  });

  describe('getEventRecommendations', () => {
    it('should run query and map recommended eventIds', async () => {
      const result = await service.getEventRecommendations('user1');
      expect(result).toEqual(['event_123']);
    });
  });

  describe('onApplicationShutdown', () => {
    it('should close the driver', async () => {
      await service.onApplicationShutdown();
      expect(mockDriver.close).toHaveBeenCalled();
    });
  });
});

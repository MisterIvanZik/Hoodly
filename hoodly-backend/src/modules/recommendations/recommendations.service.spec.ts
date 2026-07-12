import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RecommendationsService } from './recommendations.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { Event } from '../events/schemas/event.schema';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let neo4jService: Neo4jService;
  let eventModel: any;

  const mockNeo4jService = {
    getEventRecommendations: jest.fn(),
  };

  const mockEventDoc = {
    _id: new Types.ObjectId(),
    titre: 'Clean park',
    categorie: 'Nature',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockEvtModel = jest.fn();
    (mockEvtModel as any).find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockEventDoc]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: Neo4jService, useValue: mockNeo4jService },
        { provide: getModelToken(Event.name), useValue: mockEvtModel },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    neo4jService = module.get<Neo4jService>(Neo4jService);
    eventModel = module.get(getModelToken(Event.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEventRecommendations', () => {
    it('should return empty list if neo4j returns empty list', async () => {
      mockNeo4jService.getEventRecommendations.mockResolvedValueOnce([]);
      const result = await service.getEventRecommendations('user123');
      expect(result).toEqual([]);
    });

    it('should fetch events by ids and order them correctly', async () => {
      const mockIds = [mockEventDoc._id.toString()];
      mockNeo4jService.getEventRecommendations.mockResolvedValueOnce(mockIds);

      const result = await service.getEventRecommendations('user123');

      expect(result).toEqual([mockEventDoc]);
      expect(eventModel.find).toHaveBeenCalledWith({ _id: { $in: mockIds } });
    });
  });
});

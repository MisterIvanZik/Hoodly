import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;
  let service: RecommendationsService;

  const mockRecommendationsService = {
    getEventRecommendations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [
        { provide: RecommendationsService, useValue: mockRecommendationsService },
      ],
    }).compile();

    controller = module.get<RecommendationsController>(RecommendationsController);
    service = module.get<RecommendationsService>(RecommendationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEvents', () => {
    it('should call getEventRecommendations on service', async () => {
      const user = { userId: 'user123' };
      mockRecommendationsService.getEventRecommendations.mockResolvedValueOnce([{ id: 'event123' }]);

      const result = await controller.getEvents(user);

      expect(result).toEqual([{ id: 'event123' }]);
      expect(service.getEventRecommendations).toHaveBeenCalledWith('user123');
    });
  });
});

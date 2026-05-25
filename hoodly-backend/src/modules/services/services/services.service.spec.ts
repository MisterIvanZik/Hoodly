import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { getModelToken } from '@nestjs/mongoose';
import { Service } from '../schemas/service.schema';
import { User } from '../../users/schemas/user.schema';
import { ConversationsService } from '../../conversations/services/conversations.service';

describe('ServicesService', () => {
  let service: ServicesService;

  const mockServiceModel = {};
  const mockUserModel = {};
  const mockConversationsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getModelToken(Service.name),
          useValue: mockServiceModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service, ServiceStatus, ServiceType } from '../schemas/service.schema';
import { User } from '../../users/schemas/user.schema';
import { ConversationsService } from '../../conversations/services/conversations.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { ContractsService } from '../../contracts/contracts.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let serviceModel: any;
  let userModel: any;
  let conversationsService: ConversationsService;
  let transactionsService: TransactionsService;
  let contractsService: ContractsService;

  const mockConversationsService = {
    getOrCreate: jest.fn(),
    updatePrestationStatus: jest.fn(),
    getUserConversations: jest.fn(),
    rejectOtherCandidates: jest.fn(),
    sendSystemMessage: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTransactionsService = {
    transferPoints: jest.fn(),
  };

  const mockContractsService = {
    findById: jest.fn(),
    complete: jest.fn(),
  };

  const mockUserDoc = {
    _id: new Types.ObjectId(),
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockServiceDoc: any = {
    _id: new Types.ObjectId(),
    titre: 'Clean my garden',
    description: 'Help me clean the leaves',
    createurId: new Types.ObjectId(),
    responderId: null,
    statut: ServiceStatus.ACTIF,
    type: ServiceType.DEMANDE,
    points: 10,
    gratuit: false,
    refusedResponders: [],
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockServModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));

    const queryMock = {
      populate: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockServiceDoc),
      then: jest.fn().mockImplementation(function (this: any, resolve: any) {
        return Promise.resolve(mockServiceDoc).then(resolve);
      }),
    };

    const queryMockFind = {
      ...queryMock,
      exec: jest.fn().mockResolvedValue([mockServiceDoc]),
      then: jest.fn().mockImplementation(function (this: any, resolve: any) {
        return Promise.resolve([mockServiceDoc]).then(resolve);
      }),
    };

    (mockServModel as any).find = jest.fn().mockReturnValue(queryMockFind);
    (mockServModel as any).countDocuments = jest.fn().mockResolvedValue(1);
    (mockServModel as any).findById = jest.fn().mockReturnValue(queryMock);
    (mockServModel as any).findByIdAndUpdate = jest.fn().mockReturnValue(queryMock);
    (mockServModel as any).findByIdAndDelete = jest.fn().mockResolvedValue({});

    const mockUsrModel = jest.fn();
    (mockUsrModel as any).findById = jest.fn().mockResolvedValue(mockUserDoc);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getModelToken(Service.name), useValue: mockServModel },
        { provide: getModelToken(User.name), useValue: mockUsrModel },
        { provide: ConversationsService, useValue: mockConversationsService },
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: ContractsService, useValue: mockContractsService },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    serviceModel = module.get(getModelToken(Service.name));
    userModel = module.get(getModelToken(User.name));
    conversationsService = module.get<ConversationsService>(ConversationsService);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    contractsService = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a service successfully', async () => {
      const dto = { titre: 'New Service', points: 10 } as any;
      const creatorId = new Types.ObjectId().toString();

      const result = await service.create(dto, creatorId);

      expect(result).toBeDefined();
      expect(serviceModel).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if creation fails', async () => {
      const dto = { titre: 'New Service' } as any;
      serviceModel.mockImplementationOnce(() => {
        throw new Error('Database down');
      });

      await expect(service.create(dto, 'id')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findById', () => {
    it('should return a service if found', async () => {
      const result = await service.findById(mockServiceDoc._id.toString());
      expect(result).toBe(mockServiceDoc);
    });

    it('should throw NotFoundException if service not found', async () => {
      const emptyQueryMock = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(function (this: any, resolve: any) {
          return Promise.resolve(null).then(resolve);
        }),
      };
      serviceModel.findById.mockReturnValueOnce(emptyQueryMock);

      await expect(service.findById(mockServiceDoc._id.toString())).rejects.toThrow(NotFoundException);
    });
  });

  describe('accepter', () => {
    it('should throw BadRequestException if responder is creator', async () => {
      const creatorId = mockServiceDoc.createurId.toString();
      serviceModel.findById.mockReturnValueOnce(mockServiceDoc);

      await expect(service.accepter(mockServiceDoc._id.toString(), creatorId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if service is not active', async () => {
      const inactiveService = { ...mockServiceDoc, statut: ServiceStatus.TERMINE };
      serviceModel.findById.mockReturnValueOnce(inactiveService);

      await expect(service.accepter(mockServiceDoc._id.toString(), 'user123')).rejects.toThrow(BadRequestException);
    });

    it('should accept service and update prestation status', async () => {
      const responderId = new Types.ObjectId().toString();
      serviceModel.findById.mockReturnValueOnce(mockServiceDoc);
      
      const mockConv = { _id: new Types.ObjectId() };
      mockConversationsService.getOrCreate.mockResolvedValueOnce(mockConv);
      mockConversationsService.getUserConversations.mockResolvedValueOnce([]);

      const result = await service.accepter(mockServiceDoc._id.toString(), responderId);

      expect(result).toBeDefined();
      expect(conversationsService.getOrCreate).toHaveBeenCalled();
      expect(conversationsService.updatePrestationStatus).toHaveBeenCalledWith(mockConv._id.toString(), 'valide');
    });
  });

  describe('demarrer', () => {
    it('should throw BadRequestException if no validated prestation is found', async () => {
      serviceModel.findById.mockReturnValueOnce(mockServiceDoc);
      mockConversationsService.getUserConversations.mockResolvedValueOnce([]);

      await expect(service.demarrer(mockServiceDoc._id.toString(), 'user123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('valider', () => {
    it('should throw BadRequestException if no completed prestation is found', async () => {
      serviceModel.findById.mockReturnValueOnce(mockServiceDoc);
      mockConversationsService.getUserConversations.mockResolvedValueOnce([]);

      await expect(service.valider(mockServiceDoc._id.toString(), 'user123')).rejects.toThrow(BadRequestException);
    });

    it('should transfer points and complete service', async () => {
      const serviceId = mockServiceDoc._id.toString();
      const creatorId = mockServiceDoc.createurId.toString();
      const responderId = new Types.ObjectId().toString();
      const userConv = {
        _id: new Types.ObjectId(),
        serviceId: { _id: mockServiceDoc._id },
        prestationStatut: 'termine',
        participants: [mockServiceDoc.createurId, new Types.ObjectId(responderId)],
      };
      
      const activeService = {
        ...mockServiceDoc,
        statut: ServiceStatus.TERMINE,
        responderId: new Types.ObjectId(responderId),
      };

      serviceModel.findById.mockReturnValueOnce(activeService);
      mockConversationsService.getUserConversations.mockResolvedValueOnce([userConv]);
      
      const result = await service.valider(serviceId, creatorId);

      expect(result).toBeDefined();
      expect(transactionsService.transferPoints).toHaveBeenCalled();
      expect(conversationsService.updatePrestationStatus).toHaveBeenCalledWith(userConv._id.toString(), 'termine', true);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of services', async () => {
      const result = await service.findAll(1, 10, 'Clean', 'offres', ServiceStatus.ACTIF);
      expect(result).toBeDefined();
      expect(result.services).toEqual([mockServiceDoc]);
    });
  });

  describe('update', () => {
    it('should update service if user is creator', async () => {
      serviceModel.findById.mockResolvedValueOnce(mockServiceDoc);
      const result = await service.update(
        mockServiceDoc._id.toString(),
        { titre: 'New Title' },
        mockServiceDoc.createurId.toString(),
        'user',
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user is not creator and not admin', async () => {
      serviceModel.findById.mockResolvedValueOnce(mockServiceDoc);
      await expect(
        service.update(mockServiceDoc._id.toString(), {}, 'otherUser', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete service if user is creator', async () => {
      serviceModel.findById.mockResolvedValueOnce(mockServiceDoc);
      const result = await service.delete(mockServiceDoc._id.toString(), mockServiceDoc.createurId.toString(), 'user');
      expect(result).toEqual({ message: 'Service supprimé' });
    });

    it('should throw ForbiddenException if user is not creator and not admin on delete', async () => {
      serviceModel.findById.mockResolvedValueOnce(mockServiceDoc);
      await expect(
        service.delete(mockServiceDoc._id.toString(), 'otherUser', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refuser', () => {
    it('should refuse candidate successfully', async () => {
      serviceModel.findById.mockResolvedValueOnce(mockServiceDoc);
      const mockConv = { _id: new Types.ObjectId() };
      mockConversationsService.getOrCreate.mockResolvedValueOnce(mockConv);

      const result = await service.refuser(mockServiceDoc._id.toString(), new Types.ObjectId().toString());
      expect(result).toBeDefined();
      expect(conversationsService.updatePrestationStatus).toHaveBeenCalledWith(mockConv._id.toString(), 'refuse');
    });
  });

  describe('terminer', () => {
    it('should mark service as finished', async () => {
      const responderId = new Types.ObjectId().toString();
      const activeService = {
        ...mockServiceDoc,
        statut: ServiceStatus.EN_COURS,
        responderId: new Types.ObjectId(responderId),
      };
      serviceModel.findById.mockResolvedValueOnce(activeService);

      const userConv = {
        _id: new Types.ObjectId(),
        serviceId: { _id: mockServiceDoc._id },
        prestationStatut: 'en_cours',
        participants: [mockServiceDoc.createurId, new Types.ObjectId(responderId)],
      };
      mockConversationsService.getUserConversations.mockResolvedValueOnce([userConv]);

      const result = await service.terminer(mockServiceDoc._id.toString(), responderId);
      expect(result).toBeDefined();
      expect(conversationsService.updatePrestationStatus).toHaveBeenCalledWith(userConv._id.toString(), 'termine');
    });
  });
});


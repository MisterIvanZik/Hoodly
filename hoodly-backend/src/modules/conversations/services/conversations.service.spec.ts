import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { Conversation } from '../schemas/conversation.schema';
import { Message } from '../schemas/message.schema';
import { User } from '../../users/schemas/user.schema';
import { ServicesService } from '../../services/services/services.service';
import { ConversationsGateway } from '../gateways/conversations.gateway';
import { ContractsService } from '../../contracts/contracts.service';
import { DocumentsService } from '../../documents/documents.service';
import { UploadsService } from '../../uploads/services/uploads.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationModel: any;
  let messageModel: any;
  let userModel: any;

  const mockServicesService = {
    accepter: jest.fn(),
    refuser: jest.fn(),
  };

  const mockConversationsGateway = {
    emitNewMessage: jest.fn(),
    emitMessageUpdated: jest.fn(),
    emitMessageDeleted: jest.fn(),
  };

  const mockContractsService = {
    findActiveContractForService: jest.fn(),
    create: jest.fn(),
    cancel: jest.fn(),
    complete: jest.fn(),
    findById: jest.fn(),
  };

  const mockDocumentsService = {
    create: jest.fn(),
  };

  const mockUploadsService = {
    uploadFile: jest.fn(),
  };

  const mockConversationDoc: any = {
    _id: new Types.ObjectId(),
    Nom: 'Test Conversation',
    participants: [new Types.ObjectId(), new Types.ObjectId()],
    statut: 'active',
    prestationStatut: 'aucun',
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockMessageDoc: any = {
    _id: new Types.ObjectId(),
    conversationId: mockConversationDoc._id,
    content: 'Hello World',
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockUserDoc: any = {
    _id: new Types.ObjectId(),
    name: 'John Doe',
    email: 'john@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockConvModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));

    const mockMsgModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));

    const mockUModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));

    // Setup Mongoose mock queries
    (mockConvModel as any).findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockConversationDoc),
      then: jest.fn().mockImplementation(function (this: any, resolve: any) {
        return Promise.resolve(mockConversationDoc).then(resolve);
      }),
    });
    (mockConvModel as any).findByIdAndUpdate = jest.fn().mockResolvedValue(mockConversationDoc);
    (mockConvModel as any).findOne = jest.fn().mockResolvedValue(mockConversationDoc);
    (mockConvModel as any).findOneAndUpdate = jest.fn().mockResolvedValue(mockConversationDoc);
    (mockConvModel as any).find = jest.fn().mockResolvedValue([mockConversationDoc]);
    (mockConvModel as any).deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

    (mockMsgModel as any).findById = jest.fn().mockResolvedValue(mockMessageDoc);
    (mockMsgModel as any).findByIdAndDelete = jest.fn().mockResolvedValue({});
    (mockMsgModel as any).find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([mockMessageDoc]),
    });

    (mockUModel as any).findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUserDoc),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: getModelToken(Conversation.name), useValue: mockConvModel },
        { provide: getModelToken(Message.name), useValue: mockMsgModel },
        { provide: getModelToken(User.name), useValue: mockUModel },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: ConversationsGateway, useValue: mockConversationsGateway },
        { provide: ContractsService, useValue: mockContractsService },
        { provide: DocumentsService, useValue: mockDocumentsService },
        { provide: UploadsService, useValue: mockUploadsService },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    conversationModel = module.get(getModelToken(Conversation.name));
    messageModel = module.get(getModelToken(Message.name));
    userModel = module.get(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForEvent', () => {
    it('should create conversation and send system message', async () => {
      const result = await service.createForEvent(
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        'Clean Walk Event',
      );

      expect(result).toBeDefined();
      expect(conversationModel).toHaveBeenCalled();
    });
  });

  describe('addParticipantToEvent', () => {
    it('should add participant and send system message', async () => {
      await service.addParticipantToEvent(
        new Types.ObjectId().toString(),
        mockUserDoc._id.toString(),
      );

      expect(conversationModel.findOneAndUpdate).toHaveBeenCalled();
      expect(userModel.findById).toHaveBeenCalled();
    });
  });

  describe('getOrCreate', () => {
    it('should throw BadRequestException if visitor is creator', async () => {
      const visitorId = 'user_abc';
      const creatorId = 'user_abc';

      await expect(
        service.getOrCreate(undefined, visitorId, creatorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing conversation', async () => {
      conversationModel.findOne.mockResolvedValueOnce(mockConversationDoc);
      const result = await service.getOrCreate(
        undefined,
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
      );

      expect(result).toBe(mockConversationDoc);
      expect(conversationModel.findOne).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const senderId = mockConversationDoc.participants[0].toString();
      conversationModel.findById.mockResolvedValueOnce(mockConversationDoc);

      const result = await service.sendMessage(
        mockConversationDoc._id.toString(),
        senderId,
        'Hello there',
      );

      expect(result).toBeDefined();
      expect(messageModel).toHaveBeenCalled();
      expect(mockConversationsGateway.emitNewMessage).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if sender is not participant', async () => {
      conversationModel.findById.mockResolvedValueOnce(mockConversationDoc);

      await expect(
        service.sendMessage(
          mockConversationDoc._id.toString(),
          new Types.ObjectId().toString(),
          'Hello there',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('editMessage', () => {
    it('should edit a message successfully', async () => {
      mockMessageDoc.senderId = mockConversationDoc.participants[0];
      messageModel.findById.mockResolvedValueOnce(mockMessageDoc);

      const result = await service.editMessage(
        mockConversationDoc._id.toString(),
        mockMessageDoc._id.toString(),
        mockMessageDoc.senderId.toString(),
        'Updated content',
      );

      expect(result).toBeDefined();
      expect(result.content).toBe('Updated content');
    });

    it('should throw ForbiddenException if sender is not author', async () => {
      mockMessageDoc.senderId = mockConversationDoc.participants[0];
      messageModel.findById.mockResolvedValueOnce(mockMessageDoc);

      await expect(
        service.editMessage(
          mockConversationDoc._id.toString(),
          mockMessageDoc._id.toString(),
          new Types.ObjectId().toString(),
          'Updated content',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('proposerCreneau', () => {
    it('should propose a creneau successfully', async () => {
      const userId = mockConversationDoc.participants[0].toString();
      
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        ...mockConversationDoc,
        participants: mockConversationDoc.participants,
        save: jest.fn().mockResolvedValue(true),
      } as any);

      const result = await service.proposerCreneau(
        mockConversationDoc._id.toString(),
        userId,
        '2026-12-01',
        '14:00',
        '16:00',
      );

      expect(result).toBeDefined();
      mockFindOne.mockRestore();
    });
  });

  describe('accepterCreneau', () => {
    it('should throw BadRequestException if no creneau proposed', async () => {
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        ...mockConversationDoc,
        creneau: undefined,
      } as any);

      await expect(
        service.accepterCreneau(mockConversationDoc._id.toString(), 'userId'),
      ).rejects.toThrow(BadRequestException);

      mockFindOne.mockRestore();
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message if sender is author', async () => {
      mockMessageDoc.senderId = mockConversationDoc.participants[0];
      messageModel.findById.mockResolvedValueOnce(mockMessageDoc);

      await service.deleteMessage(
        mockConversationDoc._id.toString(),
        mockMessageDoc._id.toString(),
        mockMessageDoc.senderId.toString(),
      );

      expect(messageModel.findByIdAndDelete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if sender is not author on delete', async () => {
      mockMessageDoc.senderId = mockConversationDoc.participants[0];
      messageModel.findById.mockResolvedValueOnce(mockMessageDoc);

      await expect(
        service.deleteMessage(
          mockConversationDoc._id.toString(),
          mockMessageDoc._id.toString(),
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMessages', () => {
    it('should return messages if user is participant', async () => {
      conversationModel.findById.mockResolvedValueOnce(mockConversationDoc);
      const result = await service.getMessages(
        mockConversationDoc._id.toString(),
        mockConversationDoc.participants[0].toString(),
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user is not participant in getMessages', async () => {
      conversationModel.findById.mockResolvedValueOnce(mockConversationDoc);
      await expect(
        service.getMessages(
          mockConversationDoc._id.toString(),
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('rejectOtherCandidates', () => {
    it('should reject other candidates for a service', async () => {
      conversationModel.find.mockResolvedValueOnce([mockConversationDoc]);
      await service.rejectOtherCandidates(
        mockConversationDoc._id.toString(),
        new Types.ObjectId().toString(),
      );
      expect(conversationModel.find).toHaveBeenCalled();
    });
  });

  describe('refuserCreneau', () => {
    it('should refuse creneau and reset status', async () => {
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        ...mockConversationDoc,
        creneau: { date: '2026-12-01' },
        save: jest.fn().mockResolvedValue(true),
      } as any);

      const result = await service.refuserCreneau(
        mockConversationDoc._id.toString(),
        mockConversationDoc.participants[0].toString(),
      );

      expect(result).toBeDefined();
      mockFindOne.mockRestore();
    });
  });

  describe('annulerPrestation', () => {
    it('should cancel prestation and update statuses', async () => {
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        ...mockConversationDoc,
        prestationStatut: 'valide',
        save: jest.fn().mockResolvedValue(true),
      } as any);

      const result = await service.annulerPrestation(
        mockConversationDoc._id.toString(),
        mockConversationDoc.participants[0].toString(),
      );

      expect(result).toBeDefined();
      mockFindOne.mockRestore();
    });
  });
});


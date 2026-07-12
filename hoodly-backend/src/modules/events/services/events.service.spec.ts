import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Event, EventStatus } from '../schemas/event.schema';
import { User } from '../../users/schemas/user.schema';
import { ConversationsService } from '../../conversations/services/conversations.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { Neo4jService } from '../../neo4j/neo4j.service';
import {
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let eventModel: jest.Mock & {
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    countDocuments: jest.Mock;
  };
  let userModel: any;
  let conversationsService: any;
  let transactionsService: any;
  let neo4jService: any;

  const makeEvent = (overrides: Record<string, unknown> = {}) => {
    const now = new Date('2026-01-01T10:00:00.000Z');

    return {
      _id: '507f191e810c19729de860dd',
      titre: 'Clean Walk',
      categorie: 'Ecologie',
      date: now,
      lieu: {
        adresse: '12 rue de la Paix',
        ville: 'Paris',
        codePostal: '75001',
      },
      capacite: 30,
      statut: EventStatus.PLANNED,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  const toExpectedDto = (event: any) => ({
    id: event._id.toString(),
    createurId: event.createurId?.toString() ?? '',
    titre: event.titre,
    description: event.description,
    categorie: event.categorie,
    date: event.date,
    lieu: event.lieu,
    capacite: event.capacite,
    statut: event.statut,
    interesses: (event.interesses ?? []).map((i: any) => i.toString()),
    participants: (event.participants ?? []).map((p: any) => p.toString()),
    participantsFull: undefined,
    payant: event.payant ?? false,
    pointsCout: event.pointsCout,
    pointsCreateur: event.pointsCreateur ?? 10,
    pointsParticipant: event.pointsParticipant ?? 5,
    participantsPresents: (event.participantsPresents ?? []).map((p: any) =>
      p.toString(),
    ),
    photoUrl: event.photoUrl,
    conversationId: event.conversationId?.toString(),
    templateDocumentId: event.templateDocumentId?.toString(),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  });

  const mockQuery = (result: any) => {
    const query: any = {
      skip: jest.fn().mockImplementation(() => query),
      limit: jest.fn().mockImplementation(() => query),
      sort: jest.fn().mockImplementation(() => query),
      populate: jest.fn().mockImplementation(() => query),
      lean: jest.fn().mockImplementation(() => Promise.resolve(result)),
      then: jest
        .fn()
        .mockImplementation((onfulfilled) =>
          Promise.resolve(result).then(onfulfilled),
        ),
    };
    return query;
  };

  beforeEach(async () => {
    const modelConstructor = jest.fn();
    eventModel = modelConstructor as any;
    eventModel.find = jest.fn().mockImplementation(() => mockQuery([]));
    eventModel.findById = jest.fn().mockImplementation(() => mockQuery(null));
    eventModel.findByIdAndUpdate = jest
      .fn()
      .mockImplementation(() => mockQuery(null));
    eventModel.findByIdAndDelete = jest
      .fn()
      .mockImplementation(() => mockQuery(null));
    eventModel.countDocuments = jest.fn();

    userModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    conversationsService = {
      createForEvent: jest.fn().mockResolvedValue({ _id: 'conv-123' }),
      addParticipantToEvent: jest.fn(),
      removeParticipantFromEvent: jest.fn(),
      sendSystemMessage: jest.fn(),
      deleteByEventId: jest.fn(),
    };

    transactionsService = {
      create: jest.fn(),
      awardPoints: jest.fn(),
      transferPoints: jest.fn(),
    };

    neo4jService = {
      syncInteret: jest.fn(),
      removeInteret: jest.fn(),
      syncParticipation: jest.fn(),
      removeParticipation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: eventModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: ConversationsService,
          useValue: conversationsService,
        },
        {
          provide: TransactionsService,
          useValue: transactionsService,
        },
        {
          provide: Neo4jService,
          useValue: neo4jService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event successfully', async () => {
      const eventData = {
        titre: 'Clean Walk',
        categorie: 'Ecologie',
        date: new Date('2026-01-01T10:00:00.000Z'),
        lieu: {},
        capacite: 30,
      };
      const savedEvent = {
        ...makeEvent(eventData),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      const save = jest.fn().mockResolvedValue(savedEvent);
      eventModel.mockImplementation(() => ({
        ...savedEvent,
        save,
      }));

      const result = await service.create(
        eventData,
        '507f191e810c19729de860ee',
      );

      expect(eventModel).toHaveBeenCalledWith({
        ...eventData,
        createurId: expect.any(Object),
      });
      expect(save).toHaveBeenCalled();
      expect(result).toEqual(toExpectedDto(savedEvent));
    });

    it('should throw InternalServerErrorException if creation fails', async () => {
      const eventData = {
        titre: 'Clean Walk',
        categorie: 'Ecologie',
        date: new Date(),
        lieu: {},
        capacite: 30,
      };
      const save = jest.fn().mockRejectedValue(new Error('Save failed'));
      eventModel.mockImplementation(() => ({
        save,
      }));

      await expect(
        service.create(eventData, '507f191e810c19729de860ee'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return paginated events with search filters', async () => {
      const e1 = makeEvent({ titre: 'Clean Walk' });
      const e2 = makeEvent({
        _id: '507f191e810c19729de860de',
        titre: 'Voisinage',
        categorie: 'Social',
      });

      const query = mockQuery([e1, e2]);
      eventModel.find.mockReturnValue(query);
      eventModel.countDocuments.mockResolvedValue(2);

      const result = await service.findAll(
        2,
        5,
        'clean',
        'Ecologie',
        EventStatus.PLANNED,
      );

      expect(eventModel.find).toHaveBeenCalledWith({
        $or: [
          { titre: { $regex: 'clean', $options: 'i' } },
          { categorie: { $regex: 'clean', $options: 'i' } },
        ],
        categorie: 'Ecologie',
        statut: EventStatus.PLANNED,
      });
      expect(query.skip).toHaveBeenCalledWith(5);
      expect(query.limit).toHaveBeenCalledWith(5);
      expect(query.sort).toHaveBeenCalledWith({ date: 1 });
      expect(result).toEqual({
        events: [toExpectedDto(e1), toExpectedDto(e2)],
        total: 2,
        page: 2,
        limit: 5,
        totalPages: 1,
      });
    });

    it('should work with empty query when no filters are passed', async () => {
      const e = makeEvent();
      const query = mockQuery([e]);
      eventModel.find.mockReturnValue(query);
      eventModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll();

      expect(eventModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual({
        events: [toExpectedDto(e)],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return event DTO if found', async () => {
      const e = makeEvent();
      eventModel.findById.mockReturnValue(mockQuery(e));

      const result = await service.findById(e._id);

      expect(eventModel.findById).toHaveBeenCalledWith(e._id);
      expect(result).toEqual(toExpectedDto(e));
    });

    it('should return null if not found', async () => {
      eventModel.findById.mockReturnValue(mockQuery(null));

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update event and return updated DTO', async () => {
      const e = makeEvent({ titre: 'Updated Titre' });
      eventModel.findByIdAndUpdate.mockResolvedValue(e);

      const result = await service.update(e._id, { titre: 'Updated Titre' });

      expect(eventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        e._id,
        { $set: { titre: 'Updated Titre' } },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(toExpectedDto(e));
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('missing', { titre: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete event successfully', async () => {
      const e = makeEvent();
      eventModel.findById.mockResolvedValue(e);
      eventModel.findByIdAndDelete.mockResolvedValue(e);

      const result = await service.delete(e._id);

      expect(eventModel.findById).toHaveBeenCalledWith(e._id);
      expect(eventModel.findByIdAndDelete).toHaveBeenCalledWith(e._id);
      expect(result).toEqual({
        message: 'Événement annulé et participants remboursés',
      });
    });

    it('should throw NotFoundException if event to delete does not exist', async () => {
      eventModel.findById.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleInteret', () => {
    it('should add interest if not already interested', async () => {
      const e = makeEvent({ interesses: [] });
      eventModel.findById.mockResolvedValue(e);

      const result = await service.toggleInteret(e._id, '507f191e810c19729de860ee');

      expect(result).toEqual({ interested: true });
      expect(neo4jService.syncInteret).toHaveBeenCalled();
    });

    it('should remove interest if already interested', async () => {
      const userId = new Types.ObjectId();
      const e = makeEvent({ interesses: [userId] });
      eventModel.findById.mockResolvedValue(e);

      const result = await service.toggleInteret(e._id, userId.toString());

      expect(result).toEqual({ interested: false });
      expect(neo4jService.removeInteret).toHaveBeenCalled();
    });
  });

  describe('participer', () => {
    it('should throw BadRequestException if user is creator', async () => {
      const userId = new Types.ObjectId();
      const e = makeEvent({ createurId: userId });
      eventModel.findById.mockResolvedValue(e);

      await expect(service.participer(e._id, userId.toString())).rejects.toThrow(BadRequestException);
    });

    it('should register participant if capacity not exceeded', async () => {
      const e = makeEvent({ createurId: new Types.ObjectId(), participants: [], capacite: 5 });
      eventModel.findById.mockResolvedValue(e);

      const result = await service.participer(e._id, new Types.ObjectId().toString());

      expect(result).toEqual({ participating: true });
      expect(neo4jService.syncParticipation).toHaveBeenCalled();
    });
  });

  describe('valider', () => {
    it('should throw ForbiddenException if user is not creator', async () => {
      const creatorId = new Types.ObjectId();
      const e = makeEvent({ createurId: creatorId });
      eventModel.findById.mockResolvedValue(e);

      await expect(service.valider(e._id, 'not-creator', [])).rejects.toThrow(ForbiddenException);
    });
  });
});


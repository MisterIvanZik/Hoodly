import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { UploadsService } from '../uploads/services/uploads.service';
import { QueryParserService } from './parser/query-parser.service';
import { Types } from 'mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentStatus } from './schemas/document.schema';
import * as express from 'express';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;
  let uploadsService: UploadsService;
  let queryParserService: QueryParserService;

  const mockDocumentsService = {
    findWithFilter: jest.fn(),
    create: jest.fn(),
    findByOwner: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  const mockUploadsService = {
    downloadFile: jest.fn(),
  };

  const mockQueryParserService = {
    parse: jest.fn(),
  };

  const mockUser = {
    userId: new Types.ObjectId().toString(),
    role: 'user',
  };

  const mockAdminUser = {
    userId: new Types.ObjectId().toString(),
    role: 'admin',
  };

  const mockDocumentDoc = {
    _id: new Types.ObjectId(),
    ownerId: new Types.ObjectId(mockUser.userId),
    title: 'Waiver',
    fileUrl: 'https://aws.com/waiver.pdf',
    status: DocumentStatus.PENDING,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
        { provide: UploadsService, useValue: mockUploadsService },
        { provide: QueryParserService, useValue: mockQueryParserService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
    uploadsService = module.get<UploadsService>(UploadsService);
    queryParserService = module.get<QueryParserService>(QueryParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('query', () => {
    it('should parse query and fetch documents with user filter', async () => {
      const body = { query: 'FIND ownerId' };
      const filter = { ownerId: 'someUser' };
      mockQueryParserService.parse.mockReturnValueOnce(filter);
      mockDocumentsService.findWithFilter.mockResolvedValueOnce([mockDocumentDoc]);

      const result = await controller.query(body, mockUser);

      expect(result).toEqual([mockDocumentDoc]);
      expect(queryParserService.parse).toHaveBeenCalledWith('FIND ownerId');
      expect(service.findWithFilter).toHaveBeenCalledWith({ ownerId: mockUser.userId });
    });

    it('should parse query and fetch documents with admin user filter (no ownerId override)', async () => {
      const body = { query: 'FIND ownerId' };
      const filter = { ownerId: 'someUser' };
      mockQueryParserService.parse.mockReturnValueOnce(filter);
      mockDocumentsService.findWithFilter.mockResolvedValueOnce([mockDocumentDoc]);

      const result = await controller.query(body, mockAdminUser);

      expect(result).toEqual([mockDocumentDoc]);
      expect(service.findWithFilter).toHaveBeenCalledWith({ ownerId: 'someUser' });
    });
  });

  describe('create', () => {
    it('should create document successfully', async () => {
      const dto = { ownerId: mockUser.userId, title: 'Waiver', fileUrl: 'x', pdfHash: 'y', type: 'contract' } as any;
      mockDocumentsService.create.mockResolvedValueOnce(mockDocumentDoc);

      const result = await controller.create(dto, mockUser);

      expect(result).toEqual(mockDocumentDoc);
    });

    it('should throw ForbiddenException if user tries to create for another owner', async () => {
      const dto = { ownerId: 'another_user', title: 'Waiver', fileUrl: 'x', pdfHash: 'y', type: 'contract' } as any;

      await expect(controller.create(dto, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findMyDocuments', () => {
    it('should fetch documents by ownerId', async () => {
      mockDocumentsService.findByOwner.mockResolvedValueOnce([mockDocumentDoc]);

      const result = await controller.findMyDocuments(mockUser);

      expect(result).toEqual([mockDocumentDoc]);
      expect(service.findByOwner).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('findOne', () => {
    it('should return document if owner matches', async () => {
      mockDocumentsService.findById.mockResolvedValueOnce(mockDocumentDoc);

      const result = await controller.findOne(mockDocumentDoc._id.toString(), mockUser);

      expect(result).toEqual(mockDocumentDoc);
    });

    it('should throw NotFoundException if document not found', async () => {
      mockDocumentsService.findById.mockResolvedValueOnce(null);

      await expect(controller.findOne('id', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      const doc = { ...mockDocumentDoc, ownerId: new Types.ObjectId() };
      mockDocumentsService.findById.mockResolvedValueOnce(doc);

      await expect(controller.findOne(doc._id.toString(), mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPdfContent', () => {
    it('should download and send pdf content', async () => {
      mockDocumentsService.findById.mockResolvedValueOnce(mockDocumentDoc);
      const mockBuffer = Buffer.from('pdf');
      mockUploadsService.downloadFile.mockResolvedValueOnce(mockBuffer);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as express.Response;

      await controller.getPdfContent(mockDocumentDoc._id.toString(), mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
      expect(mockRes.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should throw NotFoundException if download fails', async () => {
      mockDocumentsService.findById.mockResolvedValueOnce(mockDocumentDoc);
      mockUploadsService.downloadFile.mockRejectedValueOnce(new Error('S3 error'));

      const mockRes = {} as express.Response;

      await expect(controller.getPdfContent(mockDocumentDoc._id.toString(), mockRes)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should call updateStatus on service', async () => {
      mockDocumentsService.updateStatus.mockResolvedValueOnce(mockDocumentDoc);

      const result = await controller.updateStatus(mockDocumentDoc._id.toString(), DocumentStatus.APPROVED);

      expect(result).toEqual(mockDocumentDoc);
      expect(service.updateStatus).toHaveBeenCalledWith(mockDocumentDoc._id.toString(), DocumentStatus.APPROVED);
    });
  });

  describe('remove', () => {
    it('should delete if owner matches', async () => {
      mockDocumentsService.findById.mockResolvedValueOnce(mockDocumentDoc);
      mockDocumentsService.remove.mockResolvedValueOnce(undefined);

      const result = await controller.remove(mockDocumentDoc._id.toString(), mockUser);

      expect(result).toEqual({ message: 'Document supprimé avec succès' });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document, DocumentStatus, DocumentType } from './schemas/document.schema';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentModel: any;

  const mockDocumentDoc: any = {
    _id: new Types.ObjectId(),
    ownerId: new Types.ObjectId(),
    title: 'Waiver',
    fileUrl: 'https://aws.com/waiver.pdf',
    pdfHash: 'hash',
    type: DocumentType.CONTRACT_TEMPLATE,
    status: DocumentStatus.PENDING,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockDocModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...dto,
      }),
    }));

    const queryMockFindById = {
      exec: jest.fn().mockResolvedValue(mockDocumentDoc),
      then: jest.fn().mockImplementation(function (this: any, resolve: any) {
        return Promise.resolve(mockDocumentDoc).then(resolve);
      }),
    };

    (mockDocModel as any).findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentDoc),
    });
    (mockDocModel as any).findById = jest.fn().mockReturnValue(queryMockFindById);
    (mockDocModel as any).find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockDocumentDoc]),
    });
    (mockDocModel as any).findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockDocumentDoc),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getModelToken(Document.name), useValue: mockDocModel },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    documentModel = module.get(getModelToken(Document.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreateTemplate', () => {
    it('should find existing template', async () => {
      const result = await service.findOrCreateTemplate(new Types.ObjectId().toString());
      expect(result).toBe(mockDocumentDoc);
      expect(documentModel.findOne).toHaveBeenCalled();
    });

    it('should create template if not exists', async () => {
      documentModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOrCreateTemplate(new Types.ObjectId().toString());
      expect(result).toBeDefined();
      expect(documentModel).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a document', async () => {
      const dto = {
        ownerId: new Types.ObjectId().toString(),
        title: 'New Doc',
        fileUrl: 'http://aws.com/doc.pdf',
        pdfHash: 'hash',
        type: DocumentType.CONTRACT_TEMPLATE,
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(documentModel).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should call findById on model', async () => {
      const id = new Types.ObjectId().toString();
      const result = await service.findById(id);
      expect(result).toBe(mockDocumentDoc);
      expect(documentModel.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockDocumentDoc]);
    });
  });

  describe('findByOwner', () => {
    it('should find by ownerId', async () => {
      const ownerId = new Types.ObjectId().toString();
      const result = await service.findByOwner(ownerId);
      expect(result).toEqual([mockDocumentDoc]);
      expect(documentModel.find).toHaveBeenCalledWith({ ownerId: new Types.ObjectId(ownerId) });
    });
  });

  describe('updateStatus', () => {
    it('should update status and save', async () => {
      const id = mockDocumentDoc._id.toString();
      const result = await service.updateStatus(id, DocumentStatus.APPROVED);
      expect(result.status).toBe(DocumentStatus.APPROVED);
    });

    it("should throw NotFoundException if document not found", async () => {
      const emptyQueryMock = {
        then: jest.fn().mockImplementation(function (this: any, resolve: any) {
          return Promise.resolve(null).then(resolve);
        }),
      };
      documentModel.findById.mockReturnValueOnce(emptyQueryMock);
      await expect(service.updateStatus('id', DocumentStatus.APPROVED)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return', async () => {
      const id = mockDocumentDoc._id.toString();
      await service.remove(id);
      expect(documentModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if document not found on delete', async () => {
      documentModel.findByIdAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.remove('id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findWithFilter', () => {
    it('should search with filter', async () => {
      const ownerId = new Types.ObjectId().toString();
      const result = await service.findWithFilter({ ownerId });
      expect(result).toEqual([mockDocumentDoc]);
    });
  });
});

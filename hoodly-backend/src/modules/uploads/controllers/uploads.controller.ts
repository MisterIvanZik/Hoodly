import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from '../services/uploads.service';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier à uploader (PDF, JPG, PNG)',
        },
      },
    },
  })
  async upload(@UploadedFile() file: UploadedFile) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non autorisé (PDF, JPG, PNG uniquement)',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Fichier trop volumineux (max 5MB)');
    }

    const fileUrl = await this.uploadService.uploadFile(file);
    return { fileUrl };
  }
}

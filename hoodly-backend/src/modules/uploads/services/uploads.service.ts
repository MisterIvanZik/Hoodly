/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  async uploadFile(file: UploadedFile): Promise<string> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'hoodly',
            resource_type: 'auto',
          },
          (error, response) => {
            if (error) reject(error);
            else resolve(response as UploadApiResponse);
          },
        )
        .end(file.buffer);
    });

    return result.secure_url;
  }
}

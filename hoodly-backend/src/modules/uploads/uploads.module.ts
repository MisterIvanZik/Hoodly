import { Module } from '@nestjs/common';
import { UploadsController } from './controllers/uploads.controller';
import { UploadsService } from './services/uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}

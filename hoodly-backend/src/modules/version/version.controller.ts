import { Controller, Get } from '@nestjs/common';

@Controller('version')
export class VersionController {
  @Get()
  getVersion() {
    return {
      version: '1.0.0',
      downloadUrl: 'https://github.com/zerck0/Hoodly/releases/download/v1.0.0/hoodly-desktop-1.0-SNAPSHOT.jar',
    };
  }
}

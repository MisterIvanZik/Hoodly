import { Test, TestingModule } from '@nestjs/testing';
import { VersionController } from './version.controller';
import { VersionModule } from './version.module';

describe('VersionController', () => {
  let controller: VersionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionController],
    }).compile();

    controller = module.get<VersionController>(VersionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVersion', () => {
    it('should return the correct application version and desktop download URL', () => {
      const result = controller.getVersion();
      expect(result).toEqual({
        version: '1.0.0',
        downloadUrl: 'https://github.com/zerck0/Hoodly/releases/download/v1.0.0/hoodly-desktop-1.0-SNAPSHOT.jar',
      });
    });
  });
});

describe('VersionModule', () => {
  it('should compile the module successfully', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VersionModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get<VersionController>(VersionController)).toBeDefined();
  });
});

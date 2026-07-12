import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { VerifiedGuard } from './verified.guard';
import { ZoneMembershipStatus } from '../../../modules/users/enums/zone-membership-status.enum';

describe('VerifiedGuard', () => {
  let guard: VerifiedGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifiedGuard],
    }).compile();

    guard = module.get<VerifiedGuard>(VerifiedGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: any;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {};
      mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;
    });

    it('should return true if user is admin', () => {
      mockRequest.user = { role: 'admin' };
      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return true if user is moderator', () => {
      mockRequest.user = { role: 'moderator' };
      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return true if user zoneStatus is ACTIVE', () => {
      mockRequest.user = { role: 'user', zoneStatut: ZoneMembershipStatus.ACTIVE };
      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user zoneStatus is not ACTIVE', () => {
      mockRequest.user = { role: 'user', zoneStatut: ZoneMembershipStatus.PENDING };
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not logged in', () => {
      mockRequest.user = undefined;
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
});

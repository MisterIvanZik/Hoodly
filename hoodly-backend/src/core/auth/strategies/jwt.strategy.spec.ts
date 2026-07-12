import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../../modules/users/services/users.service';

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn().mockReturnValue((req: any, header: any, cb: any) => cb(null, 'secret')),
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockUsersService = {
    getProfileByAuth0Id: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'AUTH0_DOMAIN') return 'test.auth0.com';
      if (key === 'AUTH0_AUDIENCE') return 'test-audience';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should successfully validate payload and enrich it with user profile fields', async () => {
      const payload = { sub: 'auth0|123', email: 'john@example.com' };
      const mockUser = {
        id: 'user_id_123',
        role: 'user',
        zoneId: 'zone_id_123',
        zoneStatut: 'valide',
      };
      mockUsersService.getProfileByAuth0Id.mockResolvedValueOnce(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 'auth0|123',
        email: 'john@example.com',
        role: 'user',
        userId: 'user_id_123',
        zoneId: 'zone_id_123',
        zoneStatut: 'valide',
      });
      expect(mockUsersService.getProfileByAuth0Id).toHaveBeenCalledWith('auth0|123');
    });

    it('should return payload unchanged if user profile fetch fails', async () => {
      const payload = { sub: 'auth0|123', email: 'john@example.com' };
      mockUsersService.getProfileByAuth0Id.mockRejectedValueOnce(new Error('User not found'));

      const result = await strategy.validate(payload);

      expect(result).toEqual(payload);
    });
  });
});

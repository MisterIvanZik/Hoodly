import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsersService } from '../../modules/users/services/users.service';
import type { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let usersService: UsersService;

  const mockUsersService = {
    syncFromAuth0: jest.fn(),
    getProfileByAuth0Id: jest.fn(),
    updateProfile: jest.fn(),
    claimMission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncUser', () => {
    it('should sync user with profile from Auth0', async () => {
      const mockReq = {
        user: {
          sub: 'auth0|123',
          email: 'john@example.com',
          name: 'John Doe',
          picture: 'avatar.png',
        },
      } as unknown as Request;

      const mockResponse = { id: 'user123', email: 'john@example.com', name: 'John Doe' };
      mockUsersService.syncFromAuth0.mockResolvedValueOnce(mockResponse);

      const result = await controller.syncUser(mockReq);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.syncFromAuth0).toHaveBeenCalledWith('auth0|123', {
        email: 'john@example.com',
        name: 'John Doe',
        picture: 'avatar.png',
      });
    });

    it('should use namespace properties if present', async () => {
      const mockReq = {
        user: {
          sub: 'auth0|123',
          'https://api.hoodly.fr/email': 'john-ns@example.com',
          'https://api.hoodly.fr/name': 'John Namespace',
          'https://api.hoodly.fr/picture': 'ns-avatar.png',
        },
      } as unknown as Request;

      const mockResponse = { id: 'user123', email: 'john-ns@example.com', name: 'John Namespace' };
      mockUsersService.syncFromAuth0.mockResolvedValueOnce(mockResponse);

      const result = await controller.syncUser(mockReq);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.syncFromAuth0).toHaveBeenCalledWith('auth0|123', {
        email: 'john-ns@example.com',
        name: 'John Namespace',
        picture: 'ns-avatar.png',
      });
    });
  });

  describe('getMe', () => {
    it('should return the logged in user profile', async () => {
      const mockReq = {
        user: { sub: 'auth0|123' },
      } as unknown as Request;

      const mockResponse = { id: 'user123', email: 'john@example.com' };
      mockUsersService.getProfileByAuth0Id.mockResolvedValueOnce(mockResponse);

      const result = await controller.getMe(mockReq);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.getProfileByAuth0Id).toHaveBeenCalledWith('auth0|123');
    });
  });

  describe('updateProfile', () => {
    it('should update the profile successfully', async () => {
      const mockReq = {
        user: { sub: 'auth0|123' },
      } as unknown as Request;
      const dto = { name: 'New Name', age: 30 } as any;

      const mockResponse = { id: 'user123', name: 'New Name' };
      mockUsersService.updateProfile.mockResolvedValueOnce(mockResponse);

      const result = await controller.updateProfile(mockReq, dto);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('auth0|123', dto);
    });
  });

  describe('claimMission', () => {
    it('should claim a mission for the user', async () => {
      const mockReq = {
        user: { sub: 'auth0|123' },
      } as unknown as Request;
      const missionId = 'mission_abc';

      const mockResponse = { id: 'user123', points: 150 };
      mockUsersService.claimMission.mockResolvedValueOnce(mockResponse);

      const result = await controller.claimMission(mockReq, missionId);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.claimMission).toHaveBeenCalledWith('auth0|123', missionId);
    });
  });
});

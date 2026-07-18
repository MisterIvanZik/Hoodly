import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EmailsService } from './emails.service';
import * as nodemailer from 'nodemailer';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('nodemailer', () => {
  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock_msg_id' }),
  };
  return {
    createTransport: jest.fn().mockReturnValue(mockTransporter),
  };
});

describe('EmailsService', () => {
  let service: EmailsService;
  let mockConfigService: any;
  let mockTransporter: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'SMTP_HOST') return 'smtp.test.com';
        if (key === 'SMTP_PORT') return 587;
        if (key === 'SMTP_USER') return 'user@test.com';
        if (key === 'SMTP_PASS') return 'password';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailsService>(EmailsService);
    mockTransporter = (nodemailer.createTransport as jest.Mock).mock.results[0]?.value;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize transporter when credentials are provided', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'user@test.com',
          pass: 'password',
        },
        connectionTimeout: 5000,
        socketTimeout: 5000,
      });
    });

    it('should not initialize transporter when credentials are not provided', async () => {
      jest.clearAllMocks();
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'SMTP_USER') return undefined;
        if (key === 'SMTP_PASS') return undefined;
        return defaultValue;
      });

      const moduleTemp = await Test.createTestingModule({
        providers: [
          EmailsService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const serviceTemp = moduleTemp.get<EmailsService>(EmailsService);
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
      
      await expect(serviceTemp.sendEmail('to@example.com', 'subject', 'body')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await service.sendEmail('to@example.com', 'subject', 'body');
      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Hoodly" <user@test.com>',
        to: 'to@example.com',
        subject: 'subject',
        text: 'body',
      });
    });

    it('should throw InternalServerErrorException if sendMail throws error', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP failure'));
      await expect(service.sendEmail('to@example.com', 'subject', 'body')).rejects.toThrow(InternalServerErrorException);
      loggerSpy.mockRestore();
    });
  });
});

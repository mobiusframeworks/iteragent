import { activateCommand } from '../src/commands/activate';
import * as api from '../src/utils/api';
import * as storage from '../src/utils/storage';
import inquirer from 'inquirer';
import open from 'open';

// Mock dependencies
jest.mock('../src/utils/api');
jest.mock('../src/utils/storage');
jest.mock('inquirer');
jest.mock('open');
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis()
  }));
});

const mockApi = api as jest.Mocked<typeof api>;
const mockStorage = storage as jest.Mocked<typeof storage>;
const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;
const mockOpen = open as jest.Mocked<typeof open>;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
};

describe('Activate Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Server Health Check', () => {
    it('should check server health before activation', async () => {
      mockApi.checkServerHealth.mockResolvedValue({
        success: true,
        data: { status: 'healthy' }
      });

      mockInquirer.prompt
        .mockResolvedValueOnce({ email: 'test@example.com' })
        .mockResolvedValueOnce({ method: 'trial' });

      mockApi.redeemTrial.mockResolvedValue({
        success: true,
        data: {
          token: 'test-token',
          expiresAt: new Date().toISOString(),
          durationDays: 7
        }
      });

      await activateCommand({});

      expect(mockApi.checkServerHealth).toHaveBeenCalled();
    });

    it('should handle server connection failure', async () => {
      mockApi.checkServerHealth.mockResolvedValue({
        success: false,
        error: 'Connection refused',
        message: 'Unable to connect to server'
      });

      await activateCommand({});

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Unable to connect to InterTools license server')
      );
    });
  });

  describe('Email Input', () => {
    beforeEach(() => {
      mockApi.checkServerHealth.mockResolvedValue({
        success: true,
        data: { status: 'healthy' }
      });
    });

    it('should use provided email option', async () => {
      mockInquirer.prompt.mockResolvedValueOnce({ method: 'trial' });
      
      mockApi.redeemTrial.mockResolvedValue({
        success: true,
        data: {
          token: 'test-token',
          expiresAt: new Date().toISOString(),
          durationDays: 7
        }
      });

      await activateCommand({ email: 'provided@example.com' });

      expect(mockApi.redeemTrial).toHaveBeenCalledWith('provided@example.com');
    });

    it('should prompt for email if not provided', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ email: 'prompted@example.com' })
        .mockResolvedValueOnce({ method: 'trial' });

      mockApi.redeemTrial.mockResolvedValue({
        success: true,
        data: {
          token: 'test-token',
          expiresAt: new Date().toISOString(),
          durationDays: 7
        }
      });

      await activateCommand({});

      expect(mockInquirer.prompt).toHaveBeenCalledWith([{
        type: 'input',
        name: 'email',
        message: 'Enter your email address:',
        validate: expect.any(Function)
      }]);
    });

    it('should validate email format', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ email: 'test@example.com' })
        .mockResolvedValueOnce({ method: 'trial' });

      await activateCommand({});

      const emailPrompt = mockInquirer.prompt.mock.calls[0][0][0];
      const validator = emailPrompt.validate;

      expect(validator('valid@example.com')).toBe(true);
      expect(validator('invalid-email')).toBe('Please enter a valid email address');
    });
  });

  describe('Trial Activation', () => {
    beforeEach(() => {
      mockApi.checkServerHealth.mockResolvedValue({
        success: true,
        data: { status: 'healthy' }
      });

      mockInquirer.prompt
        .mockResolvedValueOnce({ email: 'test@example.com' })
        .mockResolvedValueOnce({ method: 'trial' });
    });

    it('should successfully activate trial', async () => {
      const mockToken = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBsYW4iOiJwcm8iLCJlbnRpdGxlbWVudHMiOlsiYWktY2hhdC1vcmNoZXN0cmF0b3IiXSwiaWF0IjoxNzAzMTIzNDU2LCJleHAiOjE3MDM3MjgyNTZ9.signature';
      
      mockApi.redeemTrial.mockResolvedValue({
        success: true,
        data: {
          token: mockToken,
          expiresAt: '2024-12-25T15:00:00.000Z',
          durationDays: 7
        }
      });

      await activateCommand({ trial: true });

      expect(mockApi.redeemTrial).toHaveBeenCalledWith('test@example.com');
      expect(mockStorage.saveConfig).toHaveBeenCalledWith({
        token: mockToken,
        email: 'test@example.com',
        plan: 'pro',
        expiresAt: '2024-12-25T15:00:00.000Z',
        issuedAt: expect.any(String)
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Trial Activated Successfully!')
      );
    });

    it('should handle trial activation failure', async () => {
      mockApi.redeemTrial.mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many trial requests'
      });

      await activateCommand({ trial: true });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Failed to activate trial')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
    });
  });

  describe('Subscription Activation', () => {
    beforeEach(() => {
      mockApi.checkServerHealth.mockResolvedValue({
        success: true,
        data: { status: 'healthy' }
      });

      mockInquirer.prompt
        .mockResolvedValueOnce({ email: 'test@example.com' })
        .mockResolvedValueOnce({ method: 'subscribe' });
    });

    it('should create checkout session and open browser', async () => {
      mockApi.activateLicense.mockResolvedValue({
        success: true,
        data: {
          checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_123',
          sessionId: 'cs_test_123'
        }
      });

      mockOpen.mockResolvedValue(undefined);

      await activateCommand({});

      expect(mockApi.activateLicense).toHaveBeenCalledWith('test@example.com');
      expect(mockOpen).toHaveBeenCalledWith('https://checkout.stripe.com/pay/cs_test_123');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Opening Stripe Checkout in your browser')
      );
    });

    it('should handle browser opening failure', async () => {
      mockApi.activateLicense.mockResolvedValue({
        success: true,
        data: {
          checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_123',
          sessionId: 'cs_test_123'
        }
      });

      mockOpen.mockRejectedValue(new Error('Browser not available'));

      await activateCommand({});

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Could not open browser automatically')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('https://checkout.stripe.com/pay/cs_test_123')
      );
    });

    it('should handle checkout session creation failure', async () => {
      mockApi.activateLicense.mockResolvedValue({
        success: false,
        error: 'Stripe error',
        message: 'Unable to create checkout session'
      });

      await activateCommand({});

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create checkout session')
      );
    });
  });

  describe('Activation Method Selection', () => {
    beforeEach(() => {
      mockApi.checkServerHealth.mockResolvedValue({
        success: true,
        data: { status: 'healthy' }
      });

      mockInquirer.prompt.mockResolvedValueOnce({ email: 'test@example.com' });
    });

    it('should skip method selection if trial option provided', async () => {
      mockApi.redeemTrial.mockResolvedValue({
        success: true,
        data: {
          token: 'test-token',
          expiresAt: new Date().toISOString(),
          durationDays: 7
        }
      });

      await activateCommand({ trial: true });

      // Should not prompt for method selection
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1); // Only email prompt
    });

    it('should prompt for activation method if not specified', async () => {
      mockInquirer.prompt.mockResolvedValueOnce({ method: 'trial' });
      
      mockApi.redeemTrial.mockResolvedValue({
        success: true,
        data: {
          token: 'test-token',
          expiresAt: new Date().toISOString(),
          durationDays: 7
        }
      });

      await activateCommand({});

      expect(mockInquirer.prompt).toHaveBeenCalledWith([{
        type: 'list',
        name: 'method',
        message: 'Choose activation method:',
        choices: [
          {
            name: '🆓 Start 7-day free trial (no payment required)',
            value: 'trial'
          },
          {
            name: '💳 Subscribe now via Stripe Checkout ($30/month after 7-day trial)',
            value: 'subscribe'
          }
        ]
      }]);
    });
  });
});

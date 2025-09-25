import { requirePro, hasProAccess, getLicenseStatus, proOnly } from '../src/license';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('node-fetch');
jest.mock('jsonwebtoken');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockFetch = require('node-fetch');
const mockJwt = require('jsonwebtoken');

// Mock JWT
const mockValidClaims = {
  sub: 'user_123',
  email: 'test@example.com',
  plan: 'pro',
  entitlements: [
    'ai-chat-orchestrator',
    'advanced-analysis',
    'element-extraction'
  ],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
  jti: 'jti_123',
  iss: 'intertools-pro',
  aud: 'intertools-users'
};

const mockExpiredClaims = {
  ...mockValidClaims,
  exp: Math.floor(Date.now() / 1000) - (24 * 60 * 60) // 1 day ago
};

const mockTrialClaims = {
  ...mockValidClaims,
  trial: true
};

describe('License Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.INTERTOOLS_LICENSE;
  });

  describe('requirePro', () => {
    it('should succeed with valid token from environment', async () => {
      process.env.INTERTOOLS_LICENSE = 'valid-token';
      mockJwt.verify.mockReturnValue(mockValidClaims);

      const result = await requirePro('ai-chat-orchestrator');
      
      expect(result).toEqual(mockValidClaims);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(String),
        expect.objectContaining({
          algorithms: ['RS256'],
          audience: 'intertools-users',
          issuer: 'intertools-pro'
        })
      );
    });

    it('should succeed with valid token from config file', async () => {
      const configPath = path.join(os.homedir(), '.config', 'intertools', 'config.json');
      
      mockFs.existsSync.mockImplementation((path) => {
        return path === configPath;
      });
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        token: 'config-token'
      }));
      
      mockJwt.verify.mockReturnValue(mockValidClaims);

      const result = await requirePro('ai-chat-orchestrator');
      
      expect(result).toEqual(mockValidClaims);
      expect(mockJwt.verify).toHaveBeenCalledWith('config-token', expect.any(String), expect.any(Object));
    });

    it('should throw error when no token found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(requirePro('ai-chat-orchestrator')).rejects.toThrow(
        expect.stringContaining('InterTools Pro License Required')
      );
    });

    it('should throw error for invalid token', async () => {
      process.env.INTERTOOLS_LICENSE = 'invalid-token';
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(requirePro('ai-chat-orchestrator')).rejects.toThrow(
        expect.stringContaining('Invalid License Token')
      );
    });

    it('should throw error for expired token', async () => {
      process.env.INTERTOOLS_LICENSE = 'expired-token';
      mockJwt.verify.mockReturnValue(mockExpiredClaims);

      await expect(requirePro('ai-chat-orchestrator')).rejects.toThrow(
        expect.stringContaining('License Expired')
      );
    });

    it('should throw error for missing entitlement', async () => {
      process.env.INTERTOOLS_LICENSE = 'valid-token';
      mockJwt.verify.mockReturnValue(mockValidClaims);

      await expect(requirePro('non-existent-feature')).rejects.toThrow(
        expect.stringContaining('Feature Not Available')
      );
    });

    it('should perform online verification', async () => {
      process.env.INTERTOOLS_LICENSE = 'valid-token';
      mockJwt.verify.mockReturnValue(mockValidClaims);
      
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          valid: true,
          plan: 'pro'
        })
      });

      const result = await requirePro('ai-chat-orchestrator');
      
      expect(result).toEqual(mockValidClaims);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/v1/license/verify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'valid-token' })
        })
      );
    });

    it('should continue with offline verification when online fails', async () => {
      process.env.INTERTOOLS_LICENSE = 'valid-token';
      mockJwt.verify.mockReturnValue(mockValidClaims);
      
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await requirePro('ai-chat-orchestrator');
      
      expect(result).toEqual(mockValidClaims);
      // Should not throw despite online verification failure
    });
  });

  describe('hasProAccess', () => {
    it('should return true for valid access', async () => {
      process.env.INTERTOOLS_LICENSE = 'valid-token';
      mockJwt.verify.mockReturnValue(mockValidClaims);

      const result = await hasProAccess('ai-chat-orchestrator');
      
      expect(result).toBe(true);
    });

    it('should return false for invalid access', async () => {
      // No token set
      mockFs.existsSync.mockReturnValue(false);

      const result = await hasProAccess('ai-chat-orchestrator');
      
      expect(result).toBe(false);
    });

    it('should return false for expired token', async () => {
      process.env.INTERTOOLS_LICENSE = 'expired-token';
      mockJwt.verify.mockReturnValue(mockExpiredClaims);

      const result = await hasProAccess('ai-chat-orchestrator');
      
      expect(result).toBe(false);
    });
  });

  describe('getLicenseStatus', () => {
    it('should return license status for valid token', async () => {
      process.env.INTERTOOLS_LICENSE = 'valid-token';
      mockJwt.verify.mockReturnValue(mockValidClaims);

      const status = await getLicenseStatus();
      
      expect(status).toEqual({
        hasLicense: true,
        plan: 'pro',
        email: 'test@example.com',
        expiresAt: new Date(mockValidClaims.exp * 1000),
        isExpired: false,
        isTrial: false,
        entitlements: mockValidClaims.entitlements
      });
    });

    it('should return trial status for trial token', async () => {
      process.env.INTERTOOLS_LICENSE = 'trial-token';
      mockJwt.verify.mockReturnValue(mockTrialClaims);

      const status = await getLicenseStatus();
      
      expect(status.isTrial).toBe(true);
    });

    it('should return no license status when no token', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const status = await getLicenseStatus();
      
      expect(status).toEqual({ hasLicense: false });
    });

    it('should return no license status for invalid token', async () => {
      process.env.INTERTOOLS_LICENSE = 'invalid-token';
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const status = await getLicenseStatus();
      
      expect(status).toEqual({ hasLicense: false });
    });
  });

  describe('proOnly wrapper', () => {
    it('should execute function with valid license', async () => {
      process.env.INTERTOOLS_LICENSE = 'valid-token';
      mockJwt.verify.mockReturnValue(mockValidClaims);

      const mockFunction = jest.fn().mockResolvedValue('success');
      const wrappedFunction = proOnly('ai-chat-orchestrator', mockFunction);

      const result = await wrappedFunction('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should throw error without valid license', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const mockFunction = jest.fn();
      const wrappedFunction = proOnly('ai-chat-orchestrator', mockFunction);

      await expect(wrappedFunction()).rejects.toThrow(
        expect.stringContaining('InterTools Pro License Required')
      );
      
      expect(mockFunction).not.toHaveBeenCalled();
    });
  });

  describe('Config file handling', () => {
    it('should handle config file read errors gracefully', async () => {
      const configPath = path.join(os.homedir(), '.config', 'intertools', 'config.json');
      
      mockFs.existsSync.mockImplementation((path) => {
        return path === configPath;
      });
      
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(requirePro('ai-chat-orchestrator')).rejects.toThrow(
        expect.stringContaining('InterTools Pro License Required')
      );
    });

    it('should handle malformed config file', async () => {
      const configPath = path.join(os.homedir(), '.config', 'intertools', 'config.json');
      
      mockFs.existsSync.mockImplementation((path) => {
        return path === configPath;
      });
      
      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(requirePro('ai-chat-orchestrator')).rejects.toThrow(
        expect.stringContaining('InterTools Pro License Required')
      );
    });
  });

  describe('Activation instructions', () => {
    it('should include activation instructions in error messages', async () => {
      mockFs.existsSync.mockReturnValue(false);

      try {
        await requirePro('ai-chat-orchestrator');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('npx intertools activate');
        expect(error.message).toContain('INTERTOOLS_LICENSE');
        expect(error.message).toContain('~/.config/intertools/config.json');
      }
    });
  });
});

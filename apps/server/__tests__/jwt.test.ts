import { 
  generateTrialToken, 
  generateSubscriptionToken, 
  verifyToken, 
  getTokenExpiry,
  hasEntitlement,
  isTrialToken 
} from '../src/utils/jwt';

// Mock the config and loadJWTKeys
jest.mock('../src/config', () => ({
  config: {
    trial: { durationDays: 7 },
    jwt: {
      issuer: 'intertools-pro',
      audience: 'intertools-users',
      algorithm: 'RS256'
    }
  },
  loadJWTKeys: () => ({
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5f5QX8tBmBP7Q
JKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3Q2X8tBmBP7QJKvZ8lR3YF9
vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3Q2X8tBmBP7QJKvZ8lR3YF9vV7X0mZ5Q3j
R8vZ3qF2X9Q7K8mF5vZ3Q2X8tBmBP7QJKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q
7K8mF5vZ3Q2X8tBmBP7QJKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3Q
2X8tBmBP7QJKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3QIDAQABAoIB
AQCxq2F3...
-----END PRIVATE KEY-----`,
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuX+UF/LQZgT+0CSr2fJU
d2Bfb1e19JmeUN40fL2d6hdl/UOyvJheb2d0Nl/LQZgT+0CSr2fJUd2Bfb1e19Jm
eUN40fL2d6hdl/UOyvJheb2d0Nl/LQZgT+0CSr2fJUd2Bfb1e19JmeUN40fL2d6h
dl/UOyvJheb2d0Nl/LQZgT+0CSr2fJUd2Bfb1e19JmeUN40fL2d6hdl/UOyvJhe
b2d0Nl/LQZgT+0CSr2fJUd2Bfb1e19JmeUN40fL2d6hdl/UOyvJheb2d0Nl/LQZ
gT+0CSr2fJUd2Bfb1e19JmeUN40fL2d6hdl/UOyvJheb2d0QIDAQAB
-----END PUBLIC KEY-----`
  })
}));

describe('JWT Utils', () => {
  const testEmail = 'test@example.com';
  const testUserId = 'user_123';
  const testCustomerId = 'cus_123';
  const testSubscriptionId = 'sub_123';

  describe('generateTrialToken', () => {
    it('should generate a valid trial token', () => {
      const token = generateTrialToken(testEmail, testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should create token with correct trial claims', () => {
      const token = generateTrialToken(testEmail, testUserId);
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(claims!.email).toBe(testEmail);
      expect(claims!.sub).toBe(testUserId);
      expect(claims!.plan).toBe('pro');
      expect(claims!.trial).toBe(true);
      expect(claims!.entitlements).toContain('ai-chat-orchestrator');
    });

    it('should set correct expiry for trial token', () => {
      const token = generateTrialToken(testEmail, testUserId);
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (7 * 24 * 60 * 60); // 7 days
      
      expect(claims!.exp).toBeGreaterThan(now);
      expect(claims!.exp).toBeLessThanOrEqual(expectedExpiry + 60); // Allow 1 minute variance
    });
  });

  describe('generateSubscriptionToken', () => {
    it('should generate a valid subscription token', () => {
      const token = generateSubscriptionToken(
        testEmail, 
        testUserId, 
        testCustomerId, 
        testSubscriptionId
      );
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should create token with correct subscription claims', () => {
      const token = generateSubscriptionToken(
        testEmail, 
        testUserId, 
        testCustomerId, 
        testSubscriptionId
      );
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(claims!.email).toBe(testEmail);
      expect(claims!.sub).toBe(testUserId);
      expect(claims!.plan).toBe('pro');
      expect(claims!.trial).toBeUndefined();
      expect(claims!.entitlements).toContain('priority-support');
    });

    it('should handle custom expiry date', () => {
      const customExpiry = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      const token = generateSubscriptionToken(
        testEmail, 
        testUserId, 
        testCustomerId, 
        testSubscriptionId,
        customExpiry
      );
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(claims!.exp).toBe(Math.floor(customExpiry.getTime() / 1000));
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateTrialToken(testEmail, testUserId);
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(claims!.email).toBe(testEmail);
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const claims = verifyToken(invalidToken);
      
      expect(claims).toBeNull();
    });

    it('should reject expired token', () => {
      // Create token with past expiry
      const pastDate = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 1 day ago
      const token = generateSubscriptionToken(
        testEmail, 
        testUserId, 
        testCustomerId, 
        testSubscriptionId,
        pastDate
      );
      
      const claims = verifyToken(token);
      expect(claims).toBeNull();
    });
  });

  describe('hasEntitlement', () => {
    it('should return true for valid entitlement', () => {
      const token = generateTrialToken(testEmail, testUserId);
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(hasEntitlement(claims!, 'ai-chat-orchestrator')).toBe(true);
    });

    it('should return false for invalid entitlement', () => {
      const token = generateTrialToken(testEmail, testUserId);
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(hasEntitlement(claims!, 'non-existent-feature')).toBe(false);
    });
  });

  describe('isTrialToken', () => {
    it('should identify trial token', () => {
      const token = generateTrialToken(testEmail, testUserId);
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(isTrialToken(claims!)).toBe(true);
    });

    it('should identify subscription token', () => {
      const token = generateSubscriptionToken(
        testEmail, 
        testUserId, 
        testCustomerId, 
        testSubscriptionId
      );
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      expect(isTrialToken(claims!)).toBe(false);
    });
  });

  describe('getTokenExpiry', () => {
    it('should calculate correct expiry info', () => {
      const token = generateTrialToken(testEmail, testUserId);
      const claims = verifyToken(token);
      
      expect(claims).toBeDefined();
      
      const expiry = getTokenExpiry(claims!);
      expect(expiry.expiresAt).toBeInstanceOf(Date);
      expect(expiry.isExpired).toBe(false);
      expect(expiry.timeLeftSeconds).toBeGreaterThan(0);
    });

    it('should detect expired token', () => {
      const pastDate = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 1 day ago
      
      // Create mock claims with past expiry
      const mockClaims = {
        sub: testUserId,
        email: testEmail,
        plan: 'pro' as const,
        entitlements: ['test'],
        iat: Math.floor((Date.now() - (25 * 60 * 60 * 1000)) / 1000),
        exp: Math.floor(pastDate.getTime() / 1000),
        jti: 'test',
        iss: 'test',
        aud: 'test'
      };
      
      const expiry = getTokenExpiry(mockClaims);
      expect(expiry.isExpired).toBe(true);
      expect(expiry.timeLeftSeconds).toBeLessThan(0);
    });
  });
});

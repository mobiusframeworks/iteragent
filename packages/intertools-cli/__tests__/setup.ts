// Test setup for CLI tests

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit() was called');
});

beforeEach(() => {
  mockExit.mockClear();
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.INTERTOOLS_SERVER_URL = 'http://localhost:3000';

// Increase timeout
jest.setTimeout(10000);

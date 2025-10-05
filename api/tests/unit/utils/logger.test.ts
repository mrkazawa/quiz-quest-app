import logger from '../../../src/utils/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const message = consoleErrorSpy.mock.calls[0][0];
      expect(message).toContain('ERROR');
      expect(message).toContain('Test error');
    });

    it('should log errors with additional arguments', () => {
      const error = new Error('Actual error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log errors with object context', () => {
      logger.error('Error with context', { userId: '123', action: 'test' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    beforeEach(() => {
      logger.setLevel('warn');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const message = consoleWarnSpy.mock.calls[0][0];
      expect(message).toContain('WARN');
      expect(message).toContain('Test warning');
    });
  });

  describe('info', () => {
    beforeEach(() => {
      logger.setLevel('info');
    });

    it('should log info messages', () => {
      logger.info('Test info');
      expect(consoleLogSpy).toHaveBeenCalled();
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('INFO');
      expect(message).toContain('Test info');
    });

    it('should log info with multiple arguments', () => {
      logger.info('Operation', 'completed', { count: 5 });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('http', () => {
    beforeEach(() => {
      logger.setLevel('http');
    });

    it('should log HTTP messages', () => {
      logger.http('HTTP request');
      expect(consoleLogSpy).toHaveBeenCalled();
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('HTTP');
      expect(message).toContain('HTTP request');
    });
  });

  describe('debug', () => {
    beforeEach(() => {
      logger.setLevel('debug');
    });

    it('should log debug messages', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('DEBUG');
      expect(message).toContain('Debug message');
    });
  });

  describe('verbose', () => {
    beforeEach(() => {
      logger.setLevel('verbose');
    });

    it('should log verbose messages', () => {
      logger.verbose('Verbose message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('VERBOSE');
      expect(message).toContain('Verbose message');
    });
  });

  describe('success', () => {
    beforeEach(() => {
      logger.setLevel('info');
    });

    it('should log success messages with emoji', () => {
      logger.success('Operation successful');
      expect(consoleLogSpy).toHaveBeenCalled();
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('✅');
      expect(message).toContain('Operation successful');
    });
  });

  describe('fail', () => {
    it('should log fail messages with emoji', () => {
      logger.fail('Operation failed');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const message = consoleErrorSpy.mock.calls[0][0];
      expect(message).toContain('❌');
      expect(message).toContain('Operation failed');
    });
  });

  describe('request', () => {
    beforeEach(() => {
      logger.setLevel('http');
    });

    it('should log HTTP requests', () => {
      logger.request('GET', '/api/test');
      expect(consoleLogSpy).toHaveBeenCalled();
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('GET');
      expect(message).toContain('/api/test');
    });

    it('should log HTTP requests with status code', () => {
      logger.request('POST', '/api/create', 201);
      expect(consoleLogSpy).toHaveBeenCalled();
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('[201]');
    });
  });

  describe('log level management', () => {
    it('should get current log level', () => {
      logger.setLevel('info');
      const level = logger.getLevel();
      expect(level).toBe('INFO');
    });

    it('should set log level', () => {
      logger.setLevel('debug');
      expect(logger.getLevel()).toBe('DEBUG');
      
      logger.setLevel('error');
      expect(logger.getLevel()).toBe('ERROR');
    });

    it('should respect log level filtering', () => {
      logger.setLevel('error');
      
      consoleLogSpy.mockClear();
      logger.debug('This should not log');
      expect(consoleLogSpy).not.toHaveBeenCalled();
      
      logger.error('This should log');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    beforeEach(() => {
      logger.setLevel('verbose');
    });

    it('should include timestamp in logs', () => {
      logger.info('Test message');
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should format Error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      const message = consoleErrorSpy.mock.calls[0][0];
      expect(message).toContain('Test error');
    });

    it('should format plain objects as JSON', () => {
      logger.info('Object data', { key: 'value', number: 123 });
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('key');
      expect(message).toContain('value');
    });
  });
});

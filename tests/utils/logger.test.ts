import { logger } from '../../src/utils/logger';

// Mock console methods to test logging output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalStdoutWrite = process.stdout.write;

describe('logger', () => {
  let logOutput: string[] = [];
  let errorOutput: string[] = [];
  
  beforeEach(() => {
    logOutput = [];
    errorOutput = [];
    
    console.log = jest.fn((...args) => {
      logOutput.push(args.join(' '));
    });
    
    console.error = jest.fn((...args) => {
      errorOutput.push(args.join(' '));
    });
    
    process.stdout.write = jest.fn((chunk) => {
      return true;
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.stdout.write = originalStdoutWrite;
  });

  describe('basic logging methods', () => {
    it('should log info messages with cyan color', () => {
      logger.info('Test info message');
      
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain('typeflow');
      expect(logOutput[0]).toContain('Test info message');
    });

    it('should log success messages with green color', () => {
      logger.success('Test success message');
      
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain('typeflow');
      expect(logOutput[0]).toContain('Test success message');
    });

    it('should log warning messages with yellow color', () => {
      logger.warn('Test warning message');
      
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain('typeflow');
      expect(logOutput[0]).toContain('Test warning message');
    });

    it('should log error messages with red color', () => {
      logger.error('Test error message');
      
      expect(errorOutput).toHaveLength(1);
      expect(errorOutput[0]).toContain('typeflow');
      expect(errorOutput[0]).toContain('Test error message');
    });

    it('should log debug messages with dim color', () => {
      logger.debug('Test debug message');
      
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toContain('typeflow');
      expect(logOutput[0]).toContain('Test debug message');
    });
  });

  describe('special logging methods', () => {
    it('should log server start information', () => {
      logger.logServerStart(3000);
      
      expect(logOutput.length).toBeGreaterThan(0);
      expect(logOutput.join(' ')).toContain('dev server running');
      expect(logOutput.join(' ')).toContain('localhost:3000');
    });

    it('should log ready message with duration', () => {
      logger.logReady(150);
      
      expect(logOutput.length).toBeGreaterThan(0);
      expect(logOutput.join(' ')).toContain('ready');
      expect(logOutput.join(' ')).toContain('150ms');
    });

    it('should log file change information', () => {
      logger.logFileChange('src/index.ts', 25);
      
      expect(logOutput).toHaveLength(2);
      expect(logOutput[0]).toContain('src/index.ts changed');
      expect(logOutput[1]).toContain('page reload');
      expect(logOutput[1]).toContain('25ms');
    });

    it('should log build information', () => {
      const files = [
        { name: 'dist/index.js', size: '2.5 kB', gzip: '0.8 kB' },
        { name: 'dist/styles.css', size: '1.2 kB' }
      ];
      
      logger.logBuild(files, 180);
      
      expect(logOutput.length).toBeGreaterThan(0);
      expect(logOutput.join(' ')).toContain('built in');
      expect(logOutput.join(' ')).toContain('180ms');
      expect(logOutput.join(' ')).toContain('dist/index.js');
      expect(logOutput.join(' ')).toContain('2.5 kB');
    });
  });

  describe('options', () => {
    it('should include timestamp when requested', () => {
      logger.info('Test message', { timestamp: true });
      
      expect(logOutput).toHaveLength(1);
      expect(logOutput[0]).toMatch(/\[\d{1,2}:\d{2}:\d{2}\s+(AM|PM)\]/);
    });

    it('should clear screen when requested', () => {
      logger.info('Test message', { clear: true });
      
      expect(process.stdout.write).toHaveBeenCalledWith('\x1Bc');
      expect(logOutput).toHaveLength(1);
    });
  });
});
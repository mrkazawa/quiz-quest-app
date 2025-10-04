// Test logger with different levels
const logger = require('./dist/utils/logger').default;

console.log('\n=== Testing Logger with Current LOG_LEVEL ===\n');

logger.error('This is an ERROR message - critical issues');
logger.warn('This is a WARN message - warnings');
logger.info('This is an INFO message - general information');
logger.http('This is an HTTP message - HTTP requests');
logger.debug('This is a DEBUG message - debugging details');
logger.verbose('This is a VERBOSE message - detailed logging');

console.log('\n=== Testing Utility Methods ===\n');

logger.success('Operation completed successfully');
logger.fail('Operation failed');
logger.request('GET', '/api/quiz', 200, 45);

console.log('\n=== Current Configuration ===');
console.log(`LOG_LEVEL: ${process.env.LOG_LEVEL || 'default'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`Effective Level: ${logger.getCurrentLevel ? logger.getCurrentLevel() : 'N/A'}`);

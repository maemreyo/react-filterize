import { logger } from './logger';

export const setupLogger = (isDevelopment: boolean = false) => {
  logger.configure({
    enabled: isDevelopment,
    level: isDevelopment ? 'debug' : 'error',
    prefix: 'react-filterize',
  });
};

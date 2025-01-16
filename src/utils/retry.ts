import { RetryConfig } from '../types';

export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`[useFilterize] Attempt ${attempt} failed:`, error);

      if (attempt === config.attempts) {
        break;
      }

      const delay = config.backoff
        ? config.delay * Math.pow(2, attempt - 1)
        : config.delay;

      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`[useFilterize] Retrying after ${delay}ms...`);
    }
  }

  throw lastError!;
};

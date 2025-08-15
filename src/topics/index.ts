import { ITopic } from './base.js';
import { InsightsTopic } from './insights/index.js';

/**
 * Declare topic instance.
 */
const insights = new InsightsTopic();

/**
 * List all available topics. Will be appended to as new topics are added.
 */
export const AVAILABLE_TOPICS: ITopic[] = [insights];

/**
 * Map resource names to their corresponding topic instances.
 */
export const TOPIC_KEY_MAP: Record<string, ITopic> = {
  [insights.TOPIC_KEY]: insights,
};

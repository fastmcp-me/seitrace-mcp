import { ITopic } from './base.js';
import { InsightsTopic } from './insights/index.js';
import { GeneralTopic } from './general/index.js';

/**
 * Declare topic instance.
 */
// Instantiate topic objects here. Add new topics below and wire them into
// AVAILABLE_TOPICS and TOPIC_KEY_MAP.
const insights = new InsightsTopic();
const general = new GeneralTopic();

/**
 * List all available topics. Will be appended to as new topics are added.
 */
// List of all topics. Used by the list_resources handler to aggregate
// resource names across topics.
export const AVAILABLE_TOPICS: ITopic[] = [insights, general];

/**
 * Map resource names to their corresponding topic instances.
 */
// Router map: topic key -> topic instance. Handlers use the prefix (e.g.,
// "insights" or "general") from resource names like "general_faucet"
// to select the correct topic instance.
export const TOPIC_KEY_MAP: Record<string, ITopic> = {
  [insights.TOPIC_KEY]: insights,
  [general.TOPIC_KEY]: general,
};

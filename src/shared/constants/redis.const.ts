export const REDIS_KEY_PREFIXES = {
  GAME_STATE: 'game',
} as const;

export function createRedisKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

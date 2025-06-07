import { ADJECTIVES, NOUNS, VERBS } from "@/shared/constants/word-lists.const";

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateGameCode(): string {
  const adjective = getRandomElement(ADJECTIVES);
  const noun = getRandomElement(NOUNS);
  const verb = getRandomElement(VERBS);

  return `${adjective}-${noun}-${verb}`;
} 
import { en } from './en';
import type { MessageKey } from './en';

export type { MessageKey } from './en';

/**
 * The active message catalog. Today this is always English; swapping in a
 * locale resolver later only requires reassigning this reference.
 */
const catalog: Record<MessageKey, string> = en;

/**
 * Translate a message key, substituting `{0}`, `{1}`, … with the provided
 * arguments. Falls back to the key itself if it is somehow missing.
 */
export function t(key: MessageKey, ...substitutions: (string | number)[]): string {
  const template = catalog[key] ?? key;
  if (substitutions.length === 0) return template;
  return template.replace(/\{(\d+)\}/g, (match, index: string) => {
    const value = substitutions[Number(index)];
    return value === undefined ? match : String(value);
  });
}

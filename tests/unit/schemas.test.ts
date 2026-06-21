import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, settingsSchema } from '@/core/settings';
import { historyStateSchema } from '@/core/history';

describe('settingsSchema', () => {
  it('accepts a fully valid object', () => {
    expect(settingsSchema.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back per-field without discarding valid siblings', () => {
    const parsed = settingsSchema.parse({
      ...DEFAULT_SETTINGS,
      position: 'diagonal',
      historyLimit: 999999,
      density: 'compact',
    });
    expect(parsed.position).toBe(DEFAULT_SETTINGS.position);
    expect(parsed.historyLimit).toBe(DEFAULT_SETTINGS.historyLimit);
    // A valid sibling survives the bad fields.
    expect(parsed.density).toBe('compact');
  });

  it('fills in missing fields with defaults', () => {
    expect(settingsSchema.parse({ position: 'left' })).toMatchObject({
      position: 'left',
      density: DEFAULT_SETTINGS.density,
    });
  });

  it('falls back entirely for non-object input', () => {
    expect(settingsSchema.parse('nope')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a valid navSections list and falls back on an invalid one', () => {
    expect(
      settingsSchema.parse({ ...DEFAULT_SETTINGS, navSections: ['issues', 'pulls'] }).navSections,
    ).toEqual(['issues', 'pulls']);
    expect(
      settingsSchema.parse({ ...DEFAULT_SETTINGS, navSections: ['issues', 'bogus'] }).navSections,
    ).toEqual(DEFAULT_SETTINGS.navSections);
  });

  it('round-trips historyInvolvedOnly and falls back on a bad value', () => {
    expect(
      settingsSchema.parse({ ...DEFAULT_SETTINGS, historyInvolvedOnly: true }).historyInvolvedOnly,
    ).toBe(true);
    expect(
      settingsSchema.parse({ ...DEFAULT_SETTINGS, historyInvolvedOnly: 'nope' })
        .historyInvolvedOnly,
    ).toBe(false);
  });
});

describe('historyStateSchema', () => {
  const validEntry = {
    key: 'https://github.com/o/r',
    safeUrl: 'https://github.com/o/r',
    pageKind: 'repo-home',
    locationLabel: 'Code',
    title: 'o/r',
    firstVisited: 1,
    lastVisited: 1,
    visitCount: 1,
    pinned: false,
    parserVersion: 1,
  };

  it('keeps valid entries and drops invalid ones', () => {
    const parsed = historyStateSchema.parse({
      entries: [validEntry, { key: 'broken' }, { ...validEntry, visitCount: -1 }],
    });
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0]!.key).toBe('https://github.com/o/r');
  });

  it('returns empty history for malformed input', () => {
    expect(historyStateSchema.parse({ entries: 'not array' })).toEqual({ entries: [] });
    expect(historyStateSchema.parse(42)).toEqual({ entries: [] });
  });
});

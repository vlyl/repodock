import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger, setDiagnosticsEnabled } from '@/lib/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setDiagnosticsEnabled(false);
  });

  it('suppresses debug output unless diagnostics are enabled', () => {
    setDiagnosticsEnabled(false);
    logger.debug('hidden');
    expect(console.warn).not.toHaveBeenCalled();

    setDiagnosticsEnabled(true);
    logger.debug('shown');
    expect(console.warn).toHaveBeenCalledWith('[RepoDock]', 'shown');
  });

  it('always emits warnings and errors', () => {
    logger.warn('w');
    logger.error('e');
    expect(console.warn).toHaveBeenCalledWith('[RepoDock]', 'w');
    expect(console.error).toHaveBeenCalledWith('[RepoDock]', 'e');
  });
});

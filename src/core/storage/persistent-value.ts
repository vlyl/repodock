import { storage } from '#imports';
import type { StorageItemKey } from '#imports';
import type { ZodType } from 'zod';

/** A versioned envelope wrapping persisted data so migrations have a version. */
interface Envelope {
  v: number;
  data: unknown;
}

export interface PersistentValueOptions<T> {
  /** Primary WXT storage key, e.g. `local:repodock.history`. */
  key: StorageItemKey;
  /** Optional fallback key used when the primary area is unavailable. */
  fallbackKey?: StorageItemKey;
  /** Current schema version. */
  version: number;
  /** Zod schema validating the migrated data. */
  schema: ZodType<T>;
  /** Produce a fresh default value. */
  defaults: () => T;
  /**
   * Migrate raw stored data from an older version toward the current shape.
   * Called only when the stored version is below {@link version}.
   */
  migrate?: (rawData: unknown, fromVersion: number) => unknown;
  /** Optional reporter for validation/migration problems. */
  onWarn?: (message: string) => void;
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'v' in value &&
    typeof value.v === 'number' &&
    'data' in value
  );
}

/**
 * A single persisted value with runtime validation and versioned migrations.
 *
 * Storage is delegated to WXT's cross-browser `storage` API. Every read is
 * validated against a Zod schema; invalid data falls back to defaults rather
 * than crashing callers. Writes are validated before persisting.
 */
export class PersistentValue<T> {
  private readonly opts: PersistentValueOptions<T>;

  constructor(opts: PersistentValueOptions<T>) {
    this.opts = opts;
  }

  private warn(message: string): void {
    this.opts.onWarn?.(message);
  }

  private async readRaw(): Promise<{ stored: unknown; usedFallback: boolean }> {
    try {
      const stored = await storage.getItem<unknown>(this.opts.key);
      if (stored !== null) return { stored, usedFallback: false };
    } catch (error) {
      this.warn(`Primary storage read failed for ${this.opts.key}: ${String(error)}`);
    }
    if (this.opts.fallbackKey) {
      try {
        const stored = await storage.getItem<unknown>(this.opts.fallbackKey);
        if (stored !== null) return { stored, usedFallback: true };
      } catch (error) {
        this.warn(`Fallback storage read failed for ${this.opts.fallbackKey}: ${String(error)}`);
      }
    }
    return { stored: null, usedFallback: false };
  }

  /** Read, migrate, and validate the value, returning defaults on any problem. */
  async get(): Promise<T> {
    const { stored } = await this.readRaw();
    if (stored === null) return this.opts.defaults();

    let version: number;
    let data: unknown;
    if (isEnvelope(stored)) {
      version = stored.v;
      data = stored.data;
    } else {
      // Pre-envelope data: treat as version 0 and let migrations handle it.
      version = 0;
      data = stored;
    }

    if (version < this.opts.version && this.opts.migrate) {
      try {
        data = this.opts.migrate(data, version);
      } catch (error) {
        this.warn(`Migration failed for ${this.opts.key}: ${String(error)}`);
        return this.opts.defaults();
      }
    }

    const result = this.opts.schema.safeParse(data);
    if (!result.success) {
      this.warn(`Validation failed for ${this.opts.key}; using defaults.`);
      return this.opts.defaults();
    }
    return result.data;
  }

  /** Validate and persist the value, returning the validated value. */
  async set(value: T): Promise<T> {
    const result = this.opts.schema.safeParse(value);
    if (!result.success) {
      throw new Error(`Refusing to persist invalid value for ${this.opts.key}`);
    }
    const envelope: Envelope = { v: this.opts.version, data: result.data };
    try {
      await storage.setItem(this.opts.key, envelope);
    } catch (error) {
      this.warn(`Primary storage write failed for ${this.opts.key}: ${String(error)}`);
      if (this.opts.fallbackKey) {
        await storage.setItem(this.opts.fallbackKey, envelope);
      } else {
        throw error instanceof Error ? error : new Error(String(error));
      }
    }
    return result.data;
  }

  /** Read, transform, and write atomically (best effort). */
  async update(transform: (current: T) => T): Promise<T> {
    const current = await this.get();
    return this.set(transform(current));
  }

  /** Reset to defaults and clear stored data. */
  async clear(): Promise<void> {
    try {
      await storage.removeItem(this.opts.key);
    } catch (error) {
      this.warn(`Failed to clear ${this.opts.key}: ${String(error)}`);
    }
    if (this.opts.fallbackKey) {
      try {
        await storage.removeItem(this.opts.fallbackKey);
      } catch {
        /* best effort */
      }
    }
  }

  /**
   * Observe changes to the value. The callback receives validated data, or
   * defaults when the value is removed or fails validation.
   */
  watch(callback: (value: T) => void): () => void {
    return storage.watch<unknown>(this.opts.key, (newValue) => {
      if (newValue === null || newValue === undefined) {
        callback(this.opts.defaults());
        return;
      }
      const data = isEnvelope(newValue) ? newValue.data : newValue;
      const result = this.opts.schema.safeParse(data);
      callback(result.success ? result.data : this.opts.defaults());
    });
  }
}

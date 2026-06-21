import type { GitHubContext } from '@/core/context/types';
import { resolveContext } from '@/core/context';
import { recordContext } from '@/core/history';
import { logger } from './logger';

type Resolver = (url: string, doc: Document) => GitHubContext;
type Recorder = (ctx: GitHubContext) => Promise<unknown>;

export interface ContextControllerOptions {
  /** Resolve a context. Defaults to the real resolver; injectable for tests. */
  resolve?: Resolver;
  /** Persist a recordable context. Defaults to the history store. */
  record?: Recorder;
  /** Read the current URL. Defaults to `window.location.href`. */
  getHref?: () => string;
  /** The document to read DOM facts from. Defaults to `document`. */
  getDocument?: () => Document;
  /** Delay before recording a stabilized visit, in ms. */
  recordDelayMs?: number;
}

const DEFAULT_RECORD_DELAY_MS = 700;
// Re-resolve a short while after a navigation to pick up GitHub's async DOM.
const RERESOLVE_DELAYS_MS = [0, 250, 700];
// Safety-net poll for SPA navigations no event told us about.
const POLL_INTERVAL_MS = 400;

/** A short signature used to suppress redundant emits for the same context. */
function signatureOf(ctx: GitHubContext): string {
  return [
    ctx.safeUrl,
    ctx.ref?.value ?? '',
    ctx.path?.value ?? '',
    ctx.item?.id ?? '',
    ctx.item?.title ?? '',
    ctx.sectionLabel ?? '',
  ].join('|');
}

/**
 * Drives context resolution over GitHub's client-side navigation. It detects
 * route changes via Turbo events, popstate, and a URL poll; re-resolves a few
 * times after each change to absorb GitHub's asynchronously-rendered DOM; emits
 * to subscribers; and records a visit only once the context has stabilized,
 * which prevents duplicates from transient routes and DOM mutations.
 */
export class ContextController {
  private readonly resolve: Resolver;
  private readonly record: Recorder;
  private readonly getHref: () => string;
  private readonly getDocument: () => Document;
  private readonly recordDelayMs: number;

  private current: GitHubContext | null = null;
  private signature = '';
  private listeners = new Set<(ctx: GitHubContext | null) => void>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private recordTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastHref = '';
  private stopped = true;

  constructor(options: ContextControllerOptions = {}) {
    this.resolve = options.resolve ?? ((url, doc) => resolveContext({ url, document: doc }));
    this.record = options.record ?? recordContext;
    this.getHref = options.getHref ?? (() => window.location.href);
    this.getDocument = options.getDocument ?? (() => document);
    this.recordDelayMs = options.recordDelayMs ?? DEFAULT_RECORD_DELAY_MS;
  }

  getContext(): GitHubContext | null {
    return this.current;
  }

  subscribe(listener: (ctx: GitHubContext | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  /** Begin watching for navigation. Returns a cleanup function. */
  start(): () => void {
    this.stopped = false;
    this.handleNavigation();

    window.addEventListener('popstate', this.handleNavigation);
    window.addEventListener('wxt:locationchange', this.handleNavigation);
    document.addEventListener('turbo:load', this.handleNavigation);
    document.addEventListener('turbo:render', this.handleNavigation);
    document.addEventListener('pjax:end', this.handleNavigation);
    document.addEventListener('soft-nav:end', this.handleNavigation);

    this.pollTimer = setInterval(() => {
      if (this.getHref() !== this.lastHref) this.handleNavigation();
    }, POLL_INTERVAL_MS);

    return () => this.stop();
  }

  stop(): void {
    this.stopped = true;
    window.removeEventListener('popstate', this.handleNavigation);
    window.removeEventListener('wxt:locationchange', this.handleNavigation);
    document.removeEventListener('turbo:load', this.handleNavigation);
    document.removeEventListener('turbo:render', this.handleNavigation);
    document.removeEventListener('pjax:end', this.handleNavigation);
    document.removeEventListener('soft-nav:end', this.handleNavigation);
    if (this.pollTimer !== null) clearInterval(this.pollTimer);
    this.clearTimers();
    if (this.recordTimer !== null) clearTimeout(this.recordTimer);
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }

  // Arrow function so it can be used directly as an event listener.
  private handleNavigation = (): void => {
    if (this.stopped) return;
    this.lastHref = this.getHref();
    this.clearTimers();
    for (const delay of RERESOLVE_DELAYS_MS) {
      this.timers.push(setTimeout(() => this.resolveAndEmit(), delay));
    }
  };

  private resolveAndEmit(): void {
    let ctx: GitHubContext;
    try {
      ctx = this.resolve(this.getHref(), this.getDocument());
    } catch (error) {
      logger.error('Context resolution failed', error);
      return;
    }

    const signature = signatureOf(ctx);
    if (signature === this.signature) return;
    this.signature = signature;
    this.current = ctx;

    for (const listener of this.listeners) {
      try {
        listener(ctx);
      } catch (error) {
        logger.error('Context listener failed', error);
      }
    }

    this.scheduleRecord(ctx);
  }

  private scheduleRecord(ctx: GitHubContext): void {
    if (this.recordTimer !== null) clearTimeout(this.recordTimer);
    this.recordTimer = setTimeout(() => {
      void this.record(ctx).catch((error) => logger.error('Failed to record visit', error));
    }, this.recordDelayMs);
  }
}

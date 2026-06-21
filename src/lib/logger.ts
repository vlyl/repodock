/**
 * A tiny logger. Debug output is gated behind the developer-diagnostics setting
 * so production consoles stay quiet; warnings and errors always surface.
 */
let diagnosticsEnabled = false;

export function setDiagnosticsEnabled(enabled: boolean): void {
  diagnosticsEnabled = enabled;
}

const PREFIX = '[RepoDock]';

export const logger = {
  debug(...args: unknown[]): void {
    // console.debug/info are linted out; route gated debug through warn.
    if (diagnosticsEnabled) console.warn(PREFIX, ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(PREFIX, ...args);
  },
  error(...args: unknown[]): void {
    console.error(PREFIX, ...args);
  },
};

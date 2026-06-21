export interface DocOptions {
  /** Object placed under `payload` in the embedded React data script. */
  embedded?: unknown;
  /** Raw embedded script text, for malformed-JSON tests. */
  embeddedRaw?: string;
  canonicalHref?: string;
  ogTitle?: string;
  octolyticsNwo?: string;
  colorMode?: string;
  baseRef?: string;
  headRef?: string;
}

/** Build a detached jsdom Document mimicking a GitHub page's relevant markup. */
export function makeDoc(opts: DocOptions = {}): Document {
  const doc = document.implementation.createHTMLDocument('test');
  if (opts.colorMode) doc.documentElement.setAttribute('data-color-mode', opts.colorMode);

  if (opts.canonicalHref) {
    const link = doc.createElement('link');
    link.rel = 'canonical';
    link.href = opts.canonicalHref;
    doc.head.appendChild(link);
  }
  if (opts.ogTitle) {
    const meta = doc.createElement('meta');
    meta.setAttribute('property', 'og:title');
    meta.setAttribute('content', opts.ogTitle);
    doc.head.appendChild(meta);
  }
  if (opts.octolyticsNwo) {
    const meta = doc.createElement('meta');
    meta.setAttribute('name', 'octolytics-dimension-repository_nwo');
    meta.setAttribute('content', opts.octolyticsNwo);
    doc.head.appendChild(meta);
  }

  const scriptText =
    opts.embeddedRaw ??
    (opts.embedded !== undefined ? JSON.stringify({ payload: opts.embedded }) : undefined);
  if (scriptText !== undefined) {
    const script = doc.createElement('script');
    script.type = 'application/json';
    script.setAttribute('data-target', 'react-app.embeddedData');
    script.textContent = scriptText;
    doc.body.appendChild(script);
  }

  if (opts.baseRef) {
    const span = doc.createElement('span');
    span.className = 'base-ref';
    span.textContent = opts.baseRef;
    doc.body.appendChild(span);
  }
  if (opts.headRef) {
    const span = doc.createElement('span');
    span.className = 'head-ref';
    span.textContent = opts.headRef;
    doc.body.appendChild(span);
  }

  return doc;
}

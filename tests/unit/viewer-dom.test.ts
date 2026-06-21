import { describe, expect, it } from 'vitest';
import { viewerIsParticipant, viewerLoginFromDom } from '@/core/context/dom';
import { makeDoc } from '../helpers/dom';

describe('viewerLoginFromDom', () => {
  it('reads the user-login meta tag', () => {
    expect(viewerLoginFromDom(makeDoc({ userLogin: 'octocat' }))).toBe('octocat');
  });

  it('is undefined when logged out', () => {
    expect(viewerLoginFromDom(makeDoc())).toBeUndefined();
  });
});

describe('viewerIsParticipant', () => {
  const sidebar = (inner: string): string => `<div id="partial-discussion-sidebar">${inner}</div>`;

  it('matches a participant profile link in the sidebar', () => {
    const doc = makeDoc({
      bodyHtml: sidebar('<a href="/octocat" class="participant-avatar"><img alt="@octocat"></a>'),
    });
    expect(viewerIsParticipant(doc, 'octocat')).toBe(true);
  });

  it('matches case-insensitively and via avatar alt text', () => {
    const doc = makeDoc({ bodyHtml: sidebar('<img alt="@OctoCat">') });
    expect(viewerIsParticipant(doc, 'octocat')).toBe(true);
  });

  it('does not match when the viewer is absent from the people sidebar', () => {
    const doc = makeDoc({
      bodyHtml: sidebar('<a href="/someone-else"><img alt="@someone-else"></a>'),
    });
    expect(viewerIsParticipant(doc, 'octocat')).toBe(false);
  });

  it('ignores the viewer avatar in the global header (outside the sidebar scope)', () => {
    // The logged-in user's own avatar always links to their profile in the page
    // header; it must NOT count as participation.
    const doc = makeDoc({
      bodyHtml: '<header class="AppHeader"><a href="/octocat"><img alt="@octocat"></a></header>',
    });
    expect(viewerIsParticipant(doc, 'octocat')).toBe(false);
  });
});

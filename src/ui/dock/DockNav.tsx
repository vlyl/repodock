import type { ReactNode } from 'react';
import {
  BookIcon,
  CodeIcon,
  CommentDiscussionIcon,
  GearIcon,
  GitPullRequestIcon,
  GraphIcon,
  IssueOpenedIcon,
  PlayIcon,
  ShieldIcon,
  TableIcon,
  TagIcon,
} from '@primer/octicons-react';
import type { GitHubContext, NavSection } from '@/core/context';
import { activeNavSection, navSectionUrl, NAV_SECTIONS } from '@/core/context';
import { t } from '@/i18n';
import type { MessageKey } from '@/i18n';

const SECTION_ICON: Record<NavSection, ReactNode> = {
  code: <CodeIcon size={16} />,
  issues: <IssueOpenedIcon size={16} />,
  pulls: <GitPullRequestIcon size={16} />,
  actions: <PlayIcon size={16} />,
  projects: <TableIcon size={16} />,
  wiki: <BookIcon size={16} />,
  discussions: <CommentDiscussionIcon size={16} />,
  security: <ShieldIcon size={16} />,
  insights: <GraphIcon size={16} />,
  releases: <TagIcon size={16} />,
  settings: <GearIcon size={16} />,
};

const SECTION_LABEL: Record<NavSection, MessageKey> = {
  code: 'nav.code',
  issues: 'nav.issues',
  pulls: 'nav.pulls',
  actions: 'nav.actions',
  projects: 'nav.projects',
  wiki: 'nav.wiki',
  discussions: 'nav.discussions',
  security: 'nav.security',
  insights: 'nav.insights',
  releases: 'nav.releases',
  settings: 'nav.settings',
};

export interface DockNavProps {
  context: GitHubContext;
  sections: NavSection[];
}

/** Quick-navigation buttons to the current repository's GitHub sections. */
export function DockNav({ context, sections }: DockNavProps): ReactNode {
  const enabled = NAV_SECTIONS.filter((section) => sections.includes(section));
  if (enabled.length === 0) return null;
  const active = activeNavSection(context.pageKind);

  return (
    <nav className="rd-dock__nav" aria-label={t('dock.navRegionLabel')}>
      {enabled.map((section) => {
        const href = navSectionUrl(context, section);
        if (href === undefined) return null;
        const label = t(SECTION_LABEL[section]);
        const isActive = active === section;
        return (
          <a
            key={section}
            className={`rd-nav-btn${isActive ? ' is-active' : ''}`}
            href={href}
            aria-label={label}
            title={label}
            aria-current={isActive ? 'page' : undefined}
          >
            {SECTION_ICON[section]}
          </a>
        );
      })}
    </nav>
  );
}

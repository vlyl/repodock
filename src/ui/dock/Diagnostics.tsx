import type { ReactNode } from 'react';
import type { GitHubContext } from '@/core/context';
import { t } from '@/i18n';

function Row({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rd-diag__row">
      <dt className="rd-diag__key">{label}</dt>
      <dd className="rd-diag__val">{value}</dd>
    </div>
  );
}

export function Diagnostics({ context }: { context: GitHubContext }): ReactNode {
  const { ref, path, repository, item, diagnostics } = context;
  return (
    <div className="rd-diag">
      <h3 className="rd-diag__title">{t('dock.diagnostics')}</h3>
      <dl className="rd-diag__list">
        <Row label="pageKind" value={context.pageKind} />
        {repository && <Row label="repository" value={`${repository.nwo}`} />}
        {ref && (
          <Row
            label="ref"
            value={`${ref.value} · ${ref.type} · ${ref.confidence} · ${ref.source}`}
          />
        )}
        {path && (
          <Row
            label="path"
            value={`${path.value} · ${path.kind} · ${path.confidence} · ${path.source}`}
          />
        )}
        {item && <Row label="item" value={`${item.type} #${item.id}`} />}
        {context.lineRange && (
          <Row
            label="lines"
            value={`${context.lineRange.start}${context.lineRange.end ? `–${context.lineRange.end}` : ''}`}
          />
        )}
      </dl>
      {diagnostics && (
        <>
          <div className="rd-diag__resolvers">
            {diagnostics.resolvers.map((resolver) => (
              <span
                key={resolver.name}
                className={`rd-diag__chip${resolver.matched ? ' is-matched' : ''}`}
                title={resolver.note}
              >
                {resolver.name}
              </span>
            ))}
          </div>
          {diagnostics.warnings.length > 0 && (
            <ul className="rd-diag__warnings">
              {diagnostics.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

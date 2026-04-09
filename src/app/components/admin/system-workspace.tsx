import Link from "next/link";
import type { ReactNode } from "react";

type HeroStat = {
  label: string;
  value: string;
  hint?: string;
};

type AdminWorkspaceHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: HeroStat[];
};

type AdminWorkspaceSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type AdminFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

type AdminWorkspaceBreadcrumbProps = {
  items: Array<{
    label: string;
    href?: string;
  }>;
};

type AdminToolbarSlotProps = {
  label?: string;
  children: ReactNode;
  grow?: boolean;
};

type AdminDetailGridProps = {
  children: ReactNode;
  variant?: "split" | "balanced";
};

type AdminDetailCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: "default" | "warning";
};

type AdminModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
};

export function AdminWorkspace({ children }: { children: ReactNode }) {
  return <section className="admin-workspace">{children}</section>;
}

export function AdminWorkspaceBreadcrumb({ items }: AdminWorkspaceBreadcrumbProps) {
  return (
    <nav className="admin-workspace-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${item.href ?? index}`} className="admin-workspace-breadcrumb-item">
            {item.href && !isLast ? (
              <Link href={item.href} className="admin-workspace-breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "admin-workspace-breadcrumb-current" : "admin-workspace-breadcrumb-link"}>
                {item.label}
              </span>
            )}
            {!isLast ? <span className="admin-workspace-breadcrumb-separator">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}

export function AdminWorkspaceHero({
  eyebrow,
  title,
  description,
  actions,
  stats,
}: AdminWorkspaceHeroProps) {
  return (
    <header className="admin-workspace-hero">
      <div className="admin-workspace-hero-head">
        <div className="admin-workspace-copy">
          <p className="admin-workspace-eyebrow">{eyebrow}</p>
          <h1 className="admin-workspace-title">{title}</h1>
          <p className="admin-workspace-description">{description}</p>
        </div>
        {actions ? <div className="admin-workspace-actions">{actions}</div> : null}
      </div>

      {stats?.length ? (
        <div className="admin-workspace-stats">
          {stats.map((stat) => (
            <article key={`${stat.label}-${stat.value}`} className="admin-workspace-stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              {stat.hint ? <p>{stat.hint}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function AdminWorkspaceSection({
  title,
  description,
  actions,
  children,
}: AdminWorkspaceSectionProps) {
  return (
    <section className="admin-workspace-section">
      <div className="admin-workspace-section-head">
        <div>
          <h2 className="admin-workspace-section-title">{title}</h2>
          {description ? <p className="admin-workspace-section-description">{description}</p> : null}
        </div>
        {actions ? <div className="admin-workspace-section-actions">{actions}</div> : null}
      </div>
      <div className="admin-workspace-section-body">{children}</div>
    </section>
  );
}

export function AdminWorkspaceToolbar({ children }: { children: ReactNode }) {
  return <div className="admin-workspace-toolbar">{children}</div>;
}

export function AdminToolbarSlot({ label, children, grow = false }: AdminToolbarSlotProps) {
  return (
    <div className={`admin-toolbar-slot${grow ? " admin-toolbar-slot-grow" : ""}`}>
      {label ? <span className="admin-toolbar-slot-label">{label}</span> : null}
      <div className="admin-toolbar-slot-control">{children}</div>
    </div>
  );
}

export function AdminDetailGrid({ children, variant = "split" }: AdminDetailGridProps) {
  return <div className={`admin-detail-grid admin-detail-grid-${variant}`}>{children}</div>;
}

export function AdminDetailCard({
  title,
  description,
  actions,
  children,
  tone = "default",
}: AdminDetailCardProps) {
  return (
    <article className={`admin-detail-card${tone === "warning" ? " admin-detail-card-warning" : ""}`}>
      <div className="admin-detail-card-head">
        <div>
          <h2 className="admin-detail-card-title">{title}</h2>
          {description ? <p className="admin-detail-card-description">{description}</p> : null}
        </div>
        {actions ? <div className="admin-detail-card-actions">{actions}</div> : null}
      </div>
      <div className="admin-detail-card-body">{children}</div>
    </article>
  );
}

export function AdminFormGrid({ children }: { children: ReactNode }) {
  return <div className="admin-form-grid">{children}</div>;
}

export function AdminField({ label, hint, children }: AdminFieldProps) {
  return (
    <div className="admin-field">
      <span className="admin-field-label">{label}</span>
      {hint ? <span className="admin-field-hint">{hint}</span> : null}
      <span className="admin-field-control">{children}</span>
    </div>
  );
}

export function AdminModal({
  open,
  title,
  description,
  children,
  actions,
  onClose,
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div className="admin-modal-shell" role="presentation">
      <button type="button" className="admin-modal-backdrop" aria-label="关闭弹窗" onClick={onClose} />
      <div className="admin-modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="admin-modal-head">
          <div>
            <h3 className="admin-modal-title">{title}</h3>
            {description ? <p className="admin-modal-description">{description}</p> : null}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {actions ? <div className="admin-modal-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
export interface LogItem {
  label: string
  value: string
}

interface LogPanelProps {
  badge: string
  title: string
  description?: string
  items?: LogItem[]
}

export function LogPanel({ badge, title, description, items = [] }: LogPanelProps) {
  return (
    <aside className="log-panel">
      <p className="log-panel__badge">{badge}</p>
      <h3>{title}</h3>
      {description ? <p className="log-panel__description">{description}</p> : null}
      {items.length > 0 ? (
        <dl className="log-panel__list">
          {items.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </aside>
  )
}


import { getTagColor } from '../utils'

export default function TagChip({ tag, onRemove }) {
  if (!tag) return null
  const color = getTagColor(tag.color)
  return (
    <span
      className="tag-chip"
      style={{ background: color.bg, color: color.text }}
    >
      <span className="tag-dot" style={{ background: color.dot }} />
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 0 0 2px', fontSize: '11px', lineHeight: 1 }}
        >
          ×
        </button>
      )}
    </span>
  )
}

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function MarkdownEditor({ value, onChange, placeholder = 'Add notes, links, checklists...' }) {
  const [tab, setTab] = useState('edit')

  return (
    <div className="md-wrap">
      <div className="md-tabs">
        <button className={`md-tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>Edit</button>
        <button className={`md-tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>Preview</button>
      </div>
      {tab === 'edit' ? (
        <textarea
          className="md-edit-area"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
        />
      ) : (
        <div className="md-preview">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>Nothing to preview</span>
          )}
        </div>
      )}
    </div>
  )
}

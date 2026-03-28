import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

export default function MarkdownEditor({ value, onChange, placeholder = 'Add notes, links, checklists...' }) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        'data-placeholder': placeholder,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.storage.markdown.getMarkdown())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.storage.markdown.getMarkdown()
    if (value !== current) {
      editor.commands.setContent(value || '')
    }
  }, [editor, value])

  return (
    <div className="md-wrap">
      <EditorContent editor={editor} />
    </div>
  )
}

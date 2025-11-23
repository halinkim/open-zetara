import { useEffect } from 'react'
import { Editor } from '@/lib/canvas/editor/Editor'

export function useKeyboardShortcuts(editor: Editor) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if editing text
            const activeElement = document.activeElement as HTMLElement
            const isInputFocused = activeElement && (
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'INPUT' ||
                (activeElement as any).isContentEditable
            )

            if (isInputFocused || editor.getEditingShapeId()) return

            const modifier = e.ctrlKey || e.metaKey

            // Undo (Ctrl+Z)
            if (modifier && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                editor.undo()
                return
            }

            // Redo (Ctrl+Y or Ctrl+Shift+Z)
            if (modifier && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                editor.redo()
                return
            }

            // Copy (Ctrl+C)
            if (modifier && e.key === 'c') {
                e.preventDefault()
                editor.copy()
                return
            }

            // Paste (Ctrl+V)
            if (modifier && e.key === 'v') {
                e.preventDefault()
                editor.paste()
                return
            }

            // Duplicate (Ctrl+D)
            if (modifier && e.key === 'd') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.duplicateShapes(selected)
                }
                return
            }

            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.deleteShapes(selected)
                }
                return
            }

            // Select All (Ctrl+A)
            if (modifier && e.key === 'a') {
                e.preventDefault()
                editor.selectAll()
                return
            }

            // Z-Index: Bring to Front (Ctrl+Shift+])
            if (modifier && e.shiftKey && e.key === ']') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.bringToFront(selected)
                }
                return
            }

            // Z-Index: Send to Back (Ctrl+Shift+[)
            if (modifier && e.shiftKey && e.key === '[') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.sendToBack(selected)
                }
                return
            }

            // Z-Index: Bring Forward (Ctrl+])
            if (modifier && e.key === ']' && !e.shiftKey) {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.bringForward(selected)
                }
                return
            }

            // Z-Index: Send Backward (Ctrl+[)
            if (modifier && e.key === '[' && !e.shiftKey) {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.sendBackward(selected)
                }
                return
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editor])
}

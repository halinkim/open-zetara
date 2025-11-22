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

            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.deleteShapes(selected)
                }
            }

            // Select All (Ctrl+A)
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault()
                editor.selectAll()
            }

            // Duplicate (Ctrl+D)
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    const newIds: string[] = []
                    selected.forEach(id => {
                        const shape = editor.getShape(id)
                        if (shape) {
                            const newShape = editor.createShape(shape.type, {
                                ...shape,
                                x: shape.x + 20,
                                y: shape.y + 20,
                                id: undefined // Let createShape generate ID
                            } as any)
                            newIds.push(newShape.id)
                        }
                    })
                    editor.setSelection(newIds)
                }
            }

            // Z-Index: Send Backward ([) / Bring Forward (])
            if (e.key === '[') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.sendBackward(selected)
                }
            }

            if (e.key === ']') {
                e.preventDefault()
                const selected = editor.getSelectedShapeIds()
                if (selected.length > 0) {
                    editor.bringForward(selected)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editor])
}
